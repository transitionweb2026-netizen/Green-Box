-- Bug found via live QA: update_order_status's DELIVERED-branch guard was
-- `if v_loyalty_settings is not null and v_loyalty_settings.is_enabled then`.
-- Postgres composite (row) types use field-wise IS NULL/IS NOT NULL
-- semantics per the SQL standard: `row IS NOT NULL` is true only if EVERY
-- field in the row is non-null. loyalty_settings.min_redeemable_points is
-- legitimately nullable and IS null in the real seeded row, so
-- `v_loyalty_settings IS NOT NULL` evaluated to false even though the row
-- was found and is_enabled = true -- meaning loyalty points could NEVER be
-- earned on any delivered order. Confirmed live: two real test orders
-- (subtotals 1050 and 1250, both above the 1000 spend_threshold) were
-- marked DELIVERED and earned 0 points; a debug-instrumented copy of this
-- function proved the branch was entered with the correct settings values
-- but the composite null-check short-circuited it.
--
-- Fix: check a specific NOT NULL column (id, the primary key) instead of
-- the whole-row composite, which correctly discriminates "row not found"
-- (a genuine scalar NULL, id is null) from "row found" (id is never null,
-- regardless of what other nullable columns happen to be null).
create or replace function public.update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_note text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_sequence text[] := array['PENDING', 'CONFIRMED', 'PREPARING', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  v_current_idx integer;
  v_new_idx integer;
  v_loyalty_settings public.loyalty_settings;
  v_loyalty_account public.loyalty_accounts;
  v_points_earned integer;
  v_new_balance integer;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can change order status';
  end if;

  if p_new_status not in ('PENDING', 'CONFIRMED', 'PREPARING', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') then
    raise exception 'Invalid status: %', p_new_status;
  end if;

  select * into v_order from public.orders where id = p_order_id;
  if v_order is null then
    raise exception 'Order not found';
  end if;

  if v_order.status in ('DELIVERED', 'CANCELLED') then
    raise exception 'Order is already in a terminal state (%)', v_order.status;
  end if;

  if p_new_status <> 'CANCELLED' then
    v_current_idx := array_position(v_sequence, v_order.status);
    v_new_idx := array_position(v_sequence, p_new_status);
    if v_new_idx is null or v_new_idx <> v_current_idx + 1 then
      raise exception 'Cannot move order from % directly to % (no skipping stages)', v_order.status, p_new_status;
    end if;
  end if;

  update public.orders set status = p_new_status where id = p_order_id;

  insert into public.order_status_history (order_id, status, changed_by, note)
  values (p_order_id, p_new_status, auth.uid(), p_note);

  if p_new_status = 'DELIVERED' then
    select * into v_loyalty_settings from public.loyalty_settings where id = 1;
    if v_loyalty_settings.id is not null and v_loyalty_settings.is_enabled then
      v_points_earned := floor(v_order.subtotal / v_loyalty_settings.spend_threshold) * v_loyalty_settings.points_per_threshold;

      if v_points_earned > 0 then
        select * into v_loyalty_account from public.loyalty_accounts where profile_id = v_order.profile_id;
        if v_loyalty_account is null then
          insert into public.loyalty_accounts (profile_id) values (v_order.profile_id)
            returning * into v_loyalty_account;
        end if;

        v_new_balance := v_loyalty_account.points_balance + v_points_earned;

        update public.loyalty_accounts
          set points_balance = v_new_balance,
              lifetime_points_earned = lifetime_points_earned + v_points_earned
          where id = v_loyalty_account.id;

        insert into public.loyalty_transactions (loyalty_account_id, type, points, balance_after, order_id, reason)
        values (v_loyalty_account.id, 'EARNED', v_points_earned, v_new_balance, v_order.id, 'Order delivered');

        update public.orders set loyalty_points_earned = v_points_earned where id = v_order.id;
      end if;
    end if;
  end if;

  if p_new_status = 'CANCELLED' and v_order.loyalty_points_redeemed > 0 then
    select * into v_loyalty_account from public.loyalty_accounts where profile_id = v_order.profile_id;
    if v_loyalty_account is not null then
      v_new_balance := v_loyalty_account.points_balance + v_order.loyalty_points_redeemed;

      update public.loyalty_accounts set points_balance = v_new_balance where id = v_loyalty_account.id;

      insert into public.loyalty_transactions (loyalty_account_id, type, points, balance_after, order_id, reason)
      values (
        v_loyalty_account.id, 'REVERSED', v_order.loyalty_points_redeemed, v_new_balance,
        v_order.id, 'Order cancelled -- redeemed points restored'
      );
    end if;
  end if;

  select * into v_order from public.orders where id = p_order_id;
  return v_order;
end;
$$;

-- CREATE OR REPLACE preserves the function's OID, but ACLs (grants) survive
-- a replace automatically in Postgres, and privileges were already locked
-- down correctly by 0014 (revoke from anon/authenticated, grant to
-- authenticated only) -- restating the grant here anyway so this migration
-- is correct standalone, without depending on 0014 having run first.
revoke execute on function public.update_order_status(uuid, text, text) from anon, authenticated;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;
