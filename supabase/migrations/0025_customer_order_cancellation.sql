-- Customers previously had no way to cancel their own order at all -- only
-- an admin could change status. The final cancellation/refund POLICY is a
-- real, still-open business decision (see DECISIONS.md), but the
-- capability itself doesn't need to wait on that: this makes both the
-- cutoff and whether self-cancellation is allowed at all a plain
-- admin-editable setting (key 'order_policy_settings', shape
-- {"customer_cancellation_enabled": bool, "cancellation_cutoff_hours": int}),
-- with a conservative default (enabled, 2-hour cutoff before the delivery
-- slot's start time), and reuses the exact same loyalty-reversal logic
-- update_order_status() already uses for an admin-initiated cancellation
-- so the two paths can never diverge in behavior.

insert into public.settings (key, value, description)
values (
  'order_policy_settings',
  jsonb_build_object('customer_cancellation_enabled', true, 'cancellation_cutoff_hours', 2),
  'Whether customers can cancel their own order, and how many hours before the delivery slot the cutoff is.'
)
on conflict (key) do nothing;

create or replace function public.cancel_own_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_order public.orders;
  v_policy jsonb;
  v_cutoff_hours integer;
  v_slot_start time;
  v_delivery_at timestamptz;
  v_loyalty_account public.loyalty_accounts;
  v_new_balance integer;
begin
  if v_profile_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_order from public.orders where id = p_order_id;
  if v_order is null or v_order.profile_id <> v_profile_id then
    raise exception 'Order not found';
  end if;

  if v_order.status not in ('PENDING', 'CONFIRMED') then
    raise exception 'This order can no longer be cancelled -- it is already being prepared';
  end if;

  select value into v_policy from public.settings where key = 'order_policy_settings';
  if v_policy is null or coalesce((v_policy->>'customer_cancellation_enabled')::boolean, true) is not true then
    raise exception 'Self-service cancellation is not currently available -- please contact us';
  end if;
  v_cutoff_hours := coalesce((v_policy->>'cancellation_cutoff_hours')::integer, 2);

  v_slot_start := coalesce((v_order.delivery_slot_snapshot->>'start_time')::time, '00:00'::time);
  v_delivery_at := (v_order.delivery_date + v_slot_start) at time zone 'UTC';
  if now() > v_delivery_at - make_interval(hours => v_cutoff_hours) then
    raise exception 'Too close to the delivery time to cancel this order -- please contact us';
  end if;

  update public.orders set status = 'CANCELLED' where id = p_order_id;

  insert into public.order_status_history (order_id, status, changed_by, note)
  values (p_order_id, 'CANCELLED', v_profile_id, 'Cancelled by customer');

  if v_order.loyalty_points_redeemed > 0 then
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

revoke execute on function public.cancel_own_order(uuid) from public;
revoke execute on function public.cancel_own_order(uuid) from anon;
grant execute on function public.cancel_own_order(uuid) to authenticated;
