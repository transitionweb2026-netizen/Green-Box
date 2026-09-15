-- Two-stage loyalty points: PENDING -> AVAILABLE (or -> CANCELLED).
--
-- Before this migration, loyalty_accounts.points_balance was both "points
-- the customer has ever earned" and "points the customer can redeem right
-- now" -- the two were the same number, credited in one atomic step inside
-- update_order_status() the moment an order reached DELIVERED (see
-- 0017_fix_loyalty_earning_null_check.sql). There was no notion of
-- "pending" at all: nothing was credited at order creation, and nothing
-- was ever un-credited on cancellation (cancellation only reversed
-- *redeemed* points via the existing REVERSED transaction type -- earned
-- points were never at stake because they didn't exist until delivery).
--
-- The desired behavior is a genuine two-stage balance:
--   1. At order creation, if the order is loyalty-eligible, the points it
--      *would* earn are recorded immediately as a PENDING loyalty_transaction
--      and added to a new pending_points_balance -- visible to the customer,
--      but never part of points_balance (the only column create_order()'s
--      own redemption check and the checkout UI ever read), so pending
--      points can never be redeemed.
--   2. When that same order reaches DELIVERED, the SAME transaction row
--      transitions PENDING -> AVAILABLE: its points move from
--      pending_points_balance into points_balance. No new transaction is
--      created (order_id has a partial unique index enforcing this).
--   3. If that order is cancelled first (by an admin via update_order_status
--      or by the customer via cancel_own_order) while still PENDING, the
--      same row transitions PENDING -> CANCELLED and its points are
--      dropped from pending_points_balance without ever touching
--      points_balance.
--
-- This only affects the EARNED lifecycle. REDEEMED/ADJUSTED/REVERSED
-- transactions are immediate, already-settled balance changes today and
-- stay that way -- they just get status = 'AVAILABLE' (the new column's
-- default) for schema consistency.

alter table public.loyalty_transactions
  add column status text not null default 'AVAILABLE' check (status in ('PENDING', 'AVAILABLE', 'CANCELLED')),
  add column available_at timestamptz,
  add column cancelled_at timestamptz;

alter table public.loyalty_accounts
  add column pending_points_balance integer not null default 0;

-- One EARNED transaction per order, ever -- the idempotency guarantee the
-- pending->available and pending->cancelled transitions below depend on.
-- A page refresh (checkout confirmation, orders, account) never re-runs
-- create_order(), so this is defense in depth rather than the only guard,
-- but it makes "one order, one earning row" a hard DB constraint instead
-- of an assumption.
create unique index loyalty_transactions_one_earned_per_order
  on public.loyalty_transactions (order_id)
  where type = 'EARNED';

-- create_order(): award PENDING points at order creation -------------------

create or replace function public.create_order(
  p_cart_id uuid,
  p_address_id uuid,
  p_delivery_time_slot_id uuid,
  p_payment_method_id uuid,
  p_customer_notes text default null,
  p_redeem_points integer default 0,
  p_delivery_date date default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_cart public.carts;
  v_address public.addresses;
  v_zone public.delivery_zones;
  v_area public.delivery_areas;
  v_slot public.delivery_time_slots;
  v_payment_method public.payment_methods;
  v_subtotal numeric(10, 2) := 0;
  v_discount numeric(10, 2) := 0;
  v_order public.orders;
  v_order_number text;
  v_item record;
  v_loyalty_settings public.loyalty_settings;
  v_loyalty_account public.loyalty_accounts;
  v_earn_account public.loyalty_accounts;
  v_points_earned integer;
  v_redeem_value numeric(10, 2);
  v_new_balance integer;
  v_booked_count integer;
  v_reservation_lead_days integer;
begin
  if v_profile_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_delivery_date is null then
    raise exception 'Delivery date is required';
  end if;
  if p_delivery_date < current_date then
    raise exception 'Delivery date cannot be in the past';
  end if;

  select * into v_cart from public.carts where id = p_cart_id;
  if v_cart is null or v_cart.profile_id <> v_profile_id then
    raise exception 'Cart not found';
  end if;
  if v_cart.status <> 'active' then
    raise exception 'Cart is not active';
  end if;
  if not exists (select 1 from public.cart_items where cart_id = p_cart_id) then
    raise exception 'Cart is empty';
  end if;

  select * into v_address from public.addresses where id = p_address_id;
  if v_address is null or v_address.profile_id <> v_profile_id then
    raise exception 'Address not found';
  end if;

  select * into v_area from public.delivery_areas where id = v_address.delivery_area_id;
  if v_area is null or v_area.is_active is not true then
    raise exception 'This address is not in a currently served area';
  end if;

  select * into v_zone from public.delivery_zones where id = v_area.delivery_zone_id;
  if v_zone is null or v_zone.is_active is not true then
    raise exception 'This delivery zone is not currently active';
  end if;

  if v_zone.delivery_fee is null then
    raise exception 'This delivery zone is not fully configured yet (missing delivery fee)';
  end if;

  select * into v_slot from public.delivery_time_slots where id = p_delivery_time_slot_id for update;
  if v_slot is null or v_slot.is_active is not true then
    raise exception 'Delivery time slot not available';
  end if;

  if v_slot.max_orders is not null then
    select count(*) into v_booked_count
    from public.orders
    where delivery_time_slot_id = p_delivery_time_slot_id
      and delivery_date = p_delivery_date
      and status <> 'CANCELLED';

    if v_booked_count >= v_slot.max_orders then
      raise exception 'This delivery slot is fully booked for the selected date';
    end if;
  end if;

  select * into v_payment_method from public.payment_methods where id = p_payment_method_id;
  if v_payment_method is null or v_payment_method.is_active is not true then
    raise exception 'Payment method not available';
  end if;

  select coalesce((select (value->>'lead_days')::integer from public.settings where key = 'reservation_settings'), 1)
    into v_reservation_lead_days;

  v_order_number := 'GB-' || to_char(now(), 'YYYYMMDD') || '-' ||
    lpad(nextval('public.orders_number_seq')::text, 6, '0');

  for v_item in
    select ci.quantity, p.price, p.name_ar, p.is_available, p.requires_reservation
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = p_cart_id
  loop
    if v_item.is_available is not true then
      raise exception 'Product % is no longer available', v_item.name_ar;
    end if;
    if v_item.requires_reservation and p_delivery_date < (current_date + v_reservation_lead_days) then
      raise exception 'Product % requires at least % day(s) advance reservation', v_item.name_ar, v_reservation_lead_days;
    end if;
    v_subtotal := v_subtotal + (v_item.price * v_item.quantity);
  end loop;

  if v_zone.min_order_amount is not null and v_subtotal < v_zone.min_order_amount then
    raise exception 'Order subtotal is below the minimum order amount for this zone';
  end if;

  select * into v_loyalty_settings from public.loyalty_settings where id = 1;

  if p_redeem_points is not null and p_redeem_points > 0 then
    if v_loyalty_settings is null or v_loyalty_settings.is_enabled is not true then
      raise exception 'Loyalty program is not currently enabled';
    end if;

    select * into v_loyalty_account from public.loyalty_accounts where profile_id = v_profile_id;
    if v_loyalty_account is null or v_loyalty_account.points_balance < p_redeem_points then
      raise exception 'Insufficient loyalty points balance';
    end if;

    if v_loyalty_settings.min_redeemable_points is not null
       and p_redeem_points < v_loyalty_settings.min_redeemable_points then
      raise exception 'Redemption amount is below the minimum allowed';
    end if;

    v_redeem_value := (p_redeem_points::numeric / v_loyalty_settings.redemption_points_unit)
      * v_loyalty_settings.points_redemption_value;
    v_discount := least(v_redeem_value, v_subtotal + v_zone.delivery_fee);
  end if;

  insert into public.orders (
    order_number, profile_id, subtotal, delivery_fee, discount_amount,
    address_id, address_snapshot, delivery_zone_id, delivery_time_slot_id,
    delivery_slot_snapshot, delivery_date, payment_method_id, customer_notes, loyalty_points_redeemed
  )
  values (
    v_order_number, v_profile_id, v_subtotal, v_zone.delivery_fee, v_discount,
    v_address.id,
    jsonb_build_object(
      'label', v_address.label,
      'recipient_name', v_address.recipient_name,
      'phone', v_address.phone,
      'governorate', v_area.governorate,
      'city', v_area.city,
      'area', v_area.area,
      'zone_name_ar', v_zone.name_ar,
      'zone_name_en', v_zone.name_en,
      'detailed_address', v_address.detailed_address,
      'landmark', v_address.landmark
    ),
    v_zone.id, v_slot.id,
    jsonb_build_object(
      'label_ar', v_slot.label_ar, 'label_en', v_slot.label_en,
      'start_time', v_slot.start_time, 'end_time', v_slot.end_time
    ),
    p_delivery_date,
    v_payment_method.id, p_customer_notes, coalesce(p_redeem_points, 0)
  )
  returning * into v_order;

  insert into public.order_items (order_id, product_id, product_name_ar, product_name_en, unit_price, quantity, line_total, notes)
  select v_order.id, p.id, p.name_ar, p.name_en, p.price, ci.quantity, p.price * ci.quantity, ci.notes
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.cart_id = p_cart_id;

  insert into public.payments (order_id, payment_method_id, amount, status)
  values (v_order.id, v_payment_method.id, v_order.total, 'PENDING');

  update public.carts set status = 'converted' where id = p_cart_id;

  if p_redeem_points is not null and p_redeem_points > 0 then
    v_new_balance := v_loyalty_account.points_balance - p_redeem_points;

    update public.loyalty_accounts
      set points_balance = v_new_balance,
          lifetime_points_redeemed = lifetime_points_redeemed + p_redeem_points
      where id = v_loyalty_account.id;

    insert into public.loyalty_transactions (loyalty_account_id, type, points, balance_after, order_id, reason)
    values (v_loyalty_account.id, 'REDEEMED', -p_redeem_points, v_new_balance, v_order.id, 'Redeemed at checkout');
  end if;

  -- Award PENDING points for this order (see migration header). Uses the
  -- same eligibility rule as the old DELIVERED-time credit: enabled +
  -- floor(subtotal / spend_threshold) * points_per_threshold > 0.
  if v_loyalty_settings.id is not null and v_loyalty_settings.is_enabled then
    v_points_earned := floor(v_subtotal / v_loyalty_settings.spend_threshold) * v_loyalty_settings.points_per_threshold;

    if v_points_earned > 0 then
      select * into v_earn_account from public.loyalty_accounts where profile_id = v_profile_id;
      if v_earn_account is null then
        insert into public.loyalty_accounts (profile_id) values (v_profile_id) returning * into v_earn_account;
      end if;

      update public.loyalty_accounts
        set pending_points_balance = pending_points_balance + v_points_earned
        where id = v_earn_account.id;

      insert into public.loyalty_transactions
        (loyalty_account_id, type, status, points, balance_after, order_id, reason)
      values (
        v_earn_account.id, 'EARNED', 'PENDING', v_points_earned, v_earn_account.points_balance,
        v_order.id, 'Order placed -- pending delivery'
      );

      update public.orders set loyalty_points_earned = v_points_earned where id = v_order.id;
    end if;
  end if;

  return v_order;
end;
$$;

revoke execute on function public.create_order(uuid, uuid, uuid, uuid, text, integer, date) from public;
revoke execute on function public.create_order(uuid, uuid, uuid, uuid, text, integer, date) from anon;
grant execute on function public.create_order(uuid, uuid, uuid, uuid, text, integer, date) to authenticated;

-- update_order_status(): DELIVERED releases the pending transaction; ------
-- CANCELLED voids it. (Admin-only path.)

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
  v_loyalty_account public.loyalty_accounts;
  v_pending_tx public.loyalty_transactions;
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
    select * into v_pending_tx
    from public.loyalty_transactions
    where order_id = v_order.id and type = 'EARNED' and status = 'PENDING'
    for update;

    if v_pending_tx.id is not null then
      select * into v_loyalty_account from public.loyalty_accounts where id = v_pending_tx.loyalty_account_id;
      v_new_balance := v_loyalty_account.points_balance + v_pending_tx.points;

      update public.loyalty_accounts
        set points_balance = v_new_balance,
            pending_points_balance = pending_points_balance - v_pending_tx.points,
            lifetime_points_earned = lifetime_points_earned + v_pending_tx.points
        where id = v_loyalty_account.id;

      update public.loyalty_transactions
        set status = 'AVAILABLE', available_at = now(), balance_after = v_new_balance
        where id = v_pending_tx.id;
    end if;
  end if;

  if p_new_status = 'CANCELLED' then
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

    select * into v_pending_tx
    from public.loyalty_transactions
    where order_id = v_order.id and type = 'EARNED' and status = 'PENDING'
    for update;

    if v_pending_tx.id is not null then
      update public.loyalty_accounts
        set pending_points_balance = pending_points_balance - v_pending_tx.points
        where id = v_pending_tx.loyalty_account_id;

      update public.loyalty_transactions
        set status = 'CANCELLED', cancelled_at = now()
        where id = v_pending_tx.id;
    end if;
  end if;

  select * into v_order from public.orders where id = p_order_id;
  return v_order;
end;
$$;

revoke execute on function public.update_order_status(uuid, text, text) from anon, authenticated;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;

-- cancel_own_order(): same pending-void behavior as the admin path above, --
-- for the customer self-service cancellation path (PENDING/CONFIRMED only,
-- so any earned transaction for this order is still guaranteed PENDING).

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
  v_pending_tx public.loyalty_transactions;
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

  select * into v_pending_tx
  from public.loyalty_transactions
  where order_id = v_order.id and type = 'EARNED' and status = 'PENDING'
  for update;

  if v_pending_tx.id is not null then
    update public.loyalty_accounts
      set pending_points_balance = pending_points_balance - v_pending_tx.points
      where id = v_pending_tx.loyalty_account_id;

    update public.loyalty_transactions
      set status = 'CANCELLED', cancelled_at = now()
      where id = v_pending_tx.id;
  end if;

  select * into v_order from public.orders where id = p_order_id;
  return v_order;
end;
$$;

revoke execute on function public.cancel_own_order(uuid) from public;
revoke execute on function public.cancel_own_order(uuid) from anon;
grant execute on function public.cancel_own_order(uuid) to authenticated;
