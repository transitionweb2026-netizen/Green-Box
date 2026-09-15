-- Hardens the redemption logic that already existed inside create_order()
-- (see 0008_trusted_functions.sql originally, most recently redefined by
-- 0026_loyalty_pending_points.sql) rather than building a second path.
-- That logic already: read the real points_balance, rejected insufficient
-- balance, respected min_redeemable_points, computed the discount from
-- loyalty_settings (never trusting a client-supplied amount), capped the
-- discount so total (a generated column: subtotal + delivery_fee -
-- discount_amount) can never go negative, deducted points and inserted a
-- REDEEMED loyalty_transaction in the same trusted-function transaction as
-- the order insert. Three real gaps remain, all closed here:
--
-- 1. No validation that p_redeem_points is a multiple of
--    loyalty_settings.redemption_points_unit. A client could request e.g.
--    150 points against a unit of 100 and get a proportional (not
--    block-based) discount. Now rejected outright.
--
-- 2. No row lock on loyalty_accounts before reading points_balance for the
--    redemption check. Two concurrent create_order() calls for the same
--    profile (e.g. a double-click, or two tabs) could both read the same
--    balance before either commits its deduction, both pass the
--    "sufficient balance" check, and both redeem -- overspending the
--    account. Fixed with `for update`, same pattern this function already
--    uses for delivery_time_slots' capacity check.
--
-- 3. No row lock on the cart before checking cart.status = 'active'. Two
--    concurrent calls with the same cart_id could both see 'active' before
--    either sets it to 'converted', creating two separate orders (and two
--    separate redemptions) from what the customer experienced as one
--    double-clicked submit. Fixed the same way.
--
-- Also consolidates the two separate loyalty_accounts lookups this
-- function had (one for the redemption check, one for crediting pending
-- points -- added by 0026) into a single locked read used by both, since
-- they're the same row and the redemption path already needs it locked.

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

  if p_redeem_points is not null and p_redeem_points < 0 then
    raise exception 'Redemption amount cannot be negative';
  end if;

  -- Locked for the rest of this transaction: a second concurrent call for
  -- the same cart_id blocks here until the first commits (or rolls back),
  -- then correctly observes status = 'converted' below instead of racing
  -- past the active-cart check into a duplicate order.
  select * into v_cart from public.carts where id = p_cart_id for update;
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

  -- Locked once, reused by both the redemption check below and the
  -- pending-points credit near the end -- same row, same transaction.
  -- A null result (no account yet) locks nothing, which is correct: there
  -- is no row to protect until one is created.
  select * into v_loyalty_account from public.loyalty_accounts where profile_id = v_profile_id for update;

  if p_redeem_points is not null and p_redeem_points > 0 then
    if v_loyalty_settings is null or v_loyalty_settings.is_enabled is not true then
      raise exception 'Loyalty program is not currently enabled';
    end if;

    if v_loyalty_settings.redemption_points_unit is null or v_loyalty_settings.redemption_points_unit <= 0 then
      raise exception 'Loyalty redemption is not configured correctly';
    end if;

    if p_redeem_points % v_loyalty_settings.redemption_points_unit <> 0 then
      raise exception 'Redemption must be in blocks of % points', v_loyalty_settings.redemption_points_unit;
    end if;

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
    v_payment_method.id, p_customer_notes, greatest(coalesce(p_redeem_points, 0), 0)
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

    -- Keep the in-memory copy in sync so the pending-earn block below (if
    -- this same order also earns points) records an accurate balance_after
    -- rather than the pre-redemption snapshot taken at the top.
    v_loyalty_account.points_balance := v_new_balance;
  end if;

  -- Award PENDING points for this order (see migration 0026). Uses the
  -- same eligibility rule as the old DELIVERED-time credit: enabled +
  -- floor(subtotal / spend_threshold) * points_per_threshold > 0.
  if v_loyalty_settings.id is not null and v_loyalty_settings.is_enabled then
    v_points_earned := floor(v_subtotal / v_loyalty_settings.spend_threshold) * v_loyalty_settings.points_per_threshold;

    if v_points_earned > 0 then
      if v_loyalty_account is null then
        insert into public.loyalty_accounts (profile_id) values (v_profile_id) returning * into v_loyalty_account;
      end if;

      update public.loyalty_accounts
        set pending_points_balance = pending_points_balance + v_points_earned
        where id = v_loyalty_account.id;

      insert into public.loyalty_transactions
        (loyalty_account_id, type, status, points, balance_after, order_id, reason)
      values (
        v_loyalty_account.id, 'EARNED', 'PENDING', v_points_earned, v_loyalty_account.points_balance,
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
