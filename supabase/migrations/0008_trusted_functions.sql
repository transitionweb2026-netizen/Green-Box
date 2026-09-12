-- Trusted mutation functions. See DATABASE.md, "Trusted Mutation
-- Functions" and ARCHITECTURE.md, Authentication: these are the only way
-- orders/order_items/payments/loyalty rows are ever written. Each is
-- SECURITY DEFINER (runs with the function owner's privileges, bypassing
-- the REVOKEs on the underlying tables) and does its own authorization +
-- recomputes every monetary value from live data -- a client can never
-- supply a price or a loyalty balance directly.

create or replace function public.create_order(
  p_cart_id uuid,
  p_address_id uuid,
  p_delivery_time_slot_id uuid,
  p_payment_method_id uuid,
  p_customer_notes text default null,
  p_redeem_points integer default 0
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
begin
  if v_profile_id is null then
    raise exception 'Not authenticated';
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

  select * into v_slot from public.delivery_time_slots where id = p_delivery_time_slot_id;
  if v_slot is null or v_slot.is_active is not true then
    raise exception 'Delivery time slot not available';
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
    delivery_slot_snapshot, payment_method_id, customer_notes, loyalty_points_redeemed
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

grant execute on function public.create_order(uuid, uuid, uuid, uuid, text, integer) to authenticated;

-- update_order_status ------------------------------------------------

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

  -- Points are earned on DELIVERED, never at order creation, so a
  -- cancelled-before-delivery order never earns anything to reverse.
  -- Earning is calculated on the merchandise subtotal (not delivery fee)
  -- -- an assumption, not an explicitly confirmed rule; flagged for
  -- confirmation in DECISIONS.md.
  if p_new_status = 'DELIVERED' then
    select * into v_loyalty_settings from public.loyalty_settings where id = 1;
    if v_loyalty_settings is not null and v_loyalty_settings.is_enabled then
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

  -- Redemption is deducted at checkout time; reverse it if the order is
  -- later cancelled.
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

grant execute on function public.update_order_status(uuid, text, text) to authenticated;

-- record_payment_verification --------------------------------------

create or replace function public.record_payment_verification(
  p_payment_id uuid,
  p_new_status text,
  p_notes text default null
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_order_payment_status text;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can verify payments';
  end if;

  if p_new_status not in ('PENDING', 'AWAITING_VERIFICATION', 'VERIFIED', 'REJECTED', 'REFUNDED') then
    raise exception 'Invalid payment status: %', p_new_status;
  end if;

  select * into v_payment from public.payments where id = p_payment_id;
  if v_payment is null then
    raise exception 'Payment not found';
  end if;

  update public.payments
    set status = p_new_status,
        verified_by = auth.uid(),
        verified_at = now(),
        notes = coalesce(p_notes, notes)
    where id = p_payment_id
    returning * into v_payment;

  v_order_payment_status := case p_new_status
    when 'VERIFIED' then 'PAID'
    when 'REJECTED' then 'FAILED'
    when 'REFUNDED' then 'REFUNDED'
    when 'AWAITING_VERIFICATION' then 'AWAITING_VERIFICATION'
    else 'PENDING'
  end;

  update public.orders set payment_status = v_order_payment_status where id = v_payment.order_id;

  return v_payment;
end;
$$;

grant execute on function public.record_payment_verification(uuid, text, text) to authenticated;
