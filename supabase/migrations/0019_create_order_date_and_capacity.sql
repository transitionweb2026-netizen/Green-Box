-- Phase 1: create_order() gains delivery-date validation and server-side,
-- race-safe slot-capacity enforcement. Postgres does not allow
-- CREATE OR REPLACE to change a function's parameter list arbitrarily, so
-- the old 6-argument overload is dropped explicitly rather than left
-- alongside the new one -- an orphaned old overload would bypass every
-- check added here (and would fail anyway once inserted, since
-- orders.delivery_date is NOT NULL with no default as of migration 0018,
-- but it should not be reachable at all).
drop function if exists public.create_order(uuid, uuid, uuid, uuid, text, integer);

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
  v_redeem_value numeric(10, 2);
  v_new_balance integer;
  v_booked_count integer;
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

  -- Lock the slot row for the rest of this transaction. A second,
  -- concurrent create_order() call for the SAME slot blocks here until
  -- this transaction commits (booking counted below) or rolls back
  -- (booking never happened) -- so two simultaneous checkouts can never
  -- both read "1 seat left" and both succeed. Coarser than locking per
  -- (slot, date) specifically -- concurrent orders for the same slot on
  -- different dates serialize too -- but that's an acceptable, simple
  -- trade-off at this business's order volume, and avoids a separate
  -- counter table that would need its own increment/decrement/reversal
  -- bookkeeping on cancellation.
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

  v_order_number := 'GB-' || to_char(now(), 'YYYYMMDD') || '-' ||
    lpad(nextval('public.orders_number_seq')::text, 6, '0');

  for v_item in
    select ci.quantity, p.price, p.name_ar, p.is_available
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = p_cart_id
  loop
    if v_item.is_available is not true then
      raise exception 'Product % is no longer available', v_item.name_ar;
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

  return v_order;
end;
$$;

-- A brand-new function signature (this is a new object, distinct from the
-- dropped 6-arg overload) gets Postgres's standard PUBLIC execute grant
-- AND this project's default-privileges auto-grant to anon/authenticated
-- (see migration 0014's history of the same two-layer issue) -- both must
-- be revoked explicitly, not just one.
revoke execute on function public.create_order(uuid, uuid, uuid, uuid, text, integer, date) from public;
revoke execute on function public.create_order(uuid, uuid, uuid, uuid, text, integer, date) from anon, authenticated;
grant execute on function public.create_order(uuid, uuid, uuid, uuid, text, integer, date) to authenticated;
