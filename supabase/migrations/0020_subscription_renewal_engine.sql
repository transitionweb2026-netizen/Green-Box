-- Phase 2: real weekly subscription renewal engine.
--
-- Idempotency guarantee: at most one generated order per (subscription,
-- delivery date), enforced at the DB level so a duplicate cron run (or an
-- admin manual trigger racing the cron job) can never double-book.
create unique index orders_subscription_date_uniq on public.orders (subscription_id, delivery_date)
  where subscription_id is not null;

-- Shared core: attempts to generate one order for one subscription on one
-- target date, revalidating everything exactly the way create_order()
-- does for a live checkout. Never raises for a "can't fulfill right now"
-- case (a stale address, an inactive zone, a full slot, an out-of-stock
-- product) -- it returns a row describing what happened instead, so a
-- batch run over many subscriptions can't be aborted by one bad row, and
-- a subscription that can't be fulfilled simply keeps its
-- next_delivery_date unchanged (retried on the next run) rather than
-- silently skipping a delivery.
--
-- Loyalty: earning still only happens in update_order_status() on
-- DELIVERED, unchanged -- a subscription-generated order earns points
-- exactly like any other order once marked delivered. Redemption is NOT
-- applied automatically here: there is no live customer interaction at
-- renewal time to choose how many points to redeem, and auto-redeeming an
-- unconfirmed amount would be inventing a business rule. Every
-- subscription-generated order therefore has loyalty_points_redeemed = 0
-- by design.
--
-- Pricing is always recomputed from current product prices (never stored
-- on subscription_items), matching create_order()'s own guarantee.
create or replace function public._generate_order_for_subscription(p_subscription_id uuid, p_target_date date)
returns table(subscription_id uuid, order_id uuid, outcome text, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions;
  v_address public.addresses;
  v_area public.delivery_areas;
  v_zone public.delivery_zones;
  v_slot public.delivery_time_slots;
  v_payment_method public.payment_methods;
  v_subtotal numeric(10, 2);
  v_available_count integer;
  v_booked_count integer;
  v_order public.orders;
  v_order_number text;
begin
  select * into v_sub from public.subscriptions where id = p_subscription_id for update;
  if v_sub is null then
    return query select p_subscription_id, null::uuid, 'skipped'::text, 'Subscription not found'::text;
    return;
  end if;

  if v_sub.status <> 'ACTIVE' then
    return query select p_subscription_id, null::uuid, 'skipped'::text, 'Subscription is not active'::text;
    return;
  end if;

  if exists (
    select 1 from public.orders o where o.subscription_id = p_subscription_id and o.delivery_date = p_target_date
  ) then
    return query select p_subscription_id, null::uuid, 'skipped'::text, 'An order already exists for this subscription on this date'::text;
    return;
  end if;

  if v_sub.address_id is null then
    return query select p_subscription_id, null::uuid, 'skipped'::text, 'No delivery address on file'::text;
    return;
  end if;
  select * into v_address from public.addresses where id = v_sub.address_id;
  if v_address is null then
    return query select p_subscription_id, null::uuid, 'skipped'::text, 'Delivery address no longer exists'::text;
    return;
  end if;

  select * into v_area from public.delivery_areas where id = v_address.delivery_area_id;
  if v_area is null or v_area.is_active is not true then
    return query select p_subscription_id, null::uuid, 'skipped'::text, 'Delivery area is no longer active'::text;
    return;
  end if;

  select * into v_zone from public.delivery_zones where id = v_area.delivery_zone_id;
  if v_zone is null or v_zone.is_active is not true or v_zone.delivery_fee is null then
    return query select p_subscription_id, null::uuid, 'skipped'::text, 'Delivery zone is not active or not fully configured'::text;
    return;
  end if;

  if v_sub.delivery_time_slot_id is null then
    return query select p_subscription_id, null::uuid, 'skipped'::text, 'No delivery time slot on file'::text;
    return;
  end if;
  select * into v_slot from public.delivery_time_slots where id = v_sub.delivery_time_slot_id for update;
  if v_slot is null or v_slot.is_active is not true then
    return query select p_subscription_id, null::uuid, 'skipped'::text, 'Delivery time slot is no longer active'::text;
    return;
  end if;

  if v_slot.max_orders is not null then
    select count(*) into v_booked_count
    from public.orders
    where delivery_time_slot_id = v_slot.id and delivery_date = p_target_date and status <> 'CANCELLED';
    if v_booked_count >= v_slot.max_orders then
      return query select p_subscription_id, null::uuid, 'skipped'::text, 'Delivery slot is fully booked for the target date'::text;
      return;
    end if;
  end if;

  if v_sub.payment_method_id is null then
    return query select p_subscription_id, null::uuid, 'skipped'::text, 'No payment method on file'::text;
    return;
  end if;
  select * into v_payment_method from public.payment_methods where id = v_sub.payment_method_id;
  if v_payment_method is null or v_payment_method.is_active is not true then
    return query select p_subscription_id, null::uuid, 'skipped'::text, 'Payment method is no longer active'::text;
    return;
  end if;

  select coalesce(sum(p.price * si.quantity), 0), count(*)
    into v_subtotal, v_available_count
  from public.subscription_items si
  join public.products p on p.id = si.product_id
  where si.subscription_id = p_subscription_id and p.is_available = true;

  if v_available_count = 0 then
    return query select p_subscription_id, null::uuid, 'skipped'::text, 'None of the subscribed products are currently available'::text;
    return;
  end if;

  if v_zone.min_order_amount is not null and v_subtotal < v_zone.min_order_amount then
    return query select p_subscription_id, null::uuid, 'skipped'::text, 'Available items fall below the zone minimum order amount'::text;
    return;
  end if;

  v_order_number := 'GB-' || to_char(now(), 'YYYYMMDD') || '-' ||
    lpad(nextval('public.orders_number_seq')::text, 6, '0');

  insert into public.orders (
    order_number, profile_id, subtotal, delivery_fee, discount_amount,
    address_id, address_snapshot, delivery_zone_id, delivery_time_slot_id,
    delivery_slot_snapshot, delivery_date, payment_method_id, customer_notes,
    loyalty_points_redeemed, subscription_id
  )
  values (
    v_order_number, v_sub.profile_id, v_subtotal, v_zone.delivery_fee, 0,
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
    p_target_date, v_payment_method.id,
    'تم إنشاؤه تلقائيًا من الاشتراك الأسبوعي',
    0, v_sub.id
  )
  returning * into v_order;

  insert into public.order_items (order_id, product_id, product_name_ar, product_name_en, unit_price, quantity, line_total)
  select v_order.id, p.id, p.name_ar, p.name_en, p.price, si.quantity, p.price * si.quantity
  from public.subscription_items si
  join public.products p on p.id = si.product_id
  where si.subscription_id = p_subscription_id and p.is_available = true;

  insert into public.payments (order_id, payment_method_id, amount, status)
  values (v_order.id, v_payment_method.id, v_order.total, 'PENDING');

  update public.subscriptions set next_delivery_date = p_target_date + 7 where id = v_sub.id;

  return query select p_subscription_id, v_order.id, 'created'::text, null::text;
end;
$$;

-- Internal helper only -- never callable directly by anon/authenticated,
-- only from within generate_subscription_orders()/
-- admin_generate_subscription_order() below (both SECURITY DEFINER, owned
-- by the same role, so the internal call needs no grant of its own).
revoke execute on function public._generate_order_for_subscription(uuid, date) from public, anon, authenticated;

-- Batch entry point, intended to be called once a day by pg_cron. Finds
-- every ACTIVE subscription whose next_delivery_date has arrived (or
-- passed, in case a run was ever missed) and attempts to generate its
-- order.
create or replace function public.generate_subscription_orders()
returns table(subscription_id uuid, order_id uuid, outcome text, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub record;
begin
  for v_sub in
    select s.id, s.next_delivery_date from public.subscriptions s
    where s.status = 'ACTIVE' and s.next_delivery_date is not null and s.next_delivery_date <= current_date
  loop
    return query select * from public._generate_order_for_subscription(v_sub.id, v_sub.next_delivery_date);
  end loop;
end;
$$;

-- Only postgres (i.e. the pg_cron job below) may run the full batch --
-- never exposed to the API.
revoke execute on function public.generate_subscription_orders() from public, anon, authenticated;

-- Admin-triggered single-subscription renewal ("generate now"). Same
-- revalidation as the batch job; targets next_delivery_date if it's in
-- the future, or today otherwise, and goes through the same
-- (subscription, date) uniqueness guard so it can never double-book
-- against a cron run that fires the same day.
create or replace function public.admin_generate_subscription_order(p_subscription_id uuid)
returns table(order_id uuid, outcome text, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions;
  v_target_date date;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can trigger a subscription renewal';
  end if;

  select * into v_sub from public.subscriptions where id = p_subscription_id;
  if v_sub is null then
    raise exception 'Subscription not found';
  end if;

  v_target_date := greatest(coalesce(v_sub.next_delivery_date, current_date), current_date);

  return query select r.order_id, r.outcome, r.reason from public._generate_order_for_subscription(p_subscription_id, v_target_date) r;
end;
$$;

revoke execute on function public.admin_generate_subscription_order(uuid) from public, anon;
grant execute on function public.admin_generate_subscription_order(uuid) to authenticated;

-- Admin subscription status control (pause/resume/cancel from the admin
-- dashboard). subscriptions RLS only grants UPDATE to the owning customer
-- (subscriptions_owner_all) -- admin has SELECT only (subscriptions_admin_select)
-- -- so this trusted function is the admin's write path, matching the
-- project's existing pattern (update_order_status, etc.) rather than
-- widening RLS with a new admin UPDATE policy.
create or replace function public.admin_set_subscription_status(p_subscription_id uuid, p_status text)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can change a subscription''s status';
  end if;

  if p_status not in ('ACTIVE', 'PAUSED', 'CANCELLED') then
    raise exception 'Invalid subscription status: %', p_status;
  end if;

  update public.subscriptions set status = p_status where id = p_subscription_id returning * into v_sub;
  if v_sub is null then
    raise exception 'Subscription not found';
  end if;

  return v_sub;
end;
$$;

revoke execute on function public.admin_set_subscription_status(uuid, text) from public, anon;
grant execute on function public.admin_set_subscription_status(uuid, text) to authenticated;

-- Manual loyalty point adjustment (customer support / goodwill cases).
-- Uses the loyalty_transactions 'ADJUSTED' type that already existed in
-- the type system with no way to actually create one. Never touches
-- points_balance without a corresponding transaction row (auditable), and
-- never allows the balance to go negative.
create or replace function public.admin_adjust_loyalty_points(p_profile_id uuid, p_points integer, p_reason text)
returns public.loyalty_accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.loyalty_accounts;
  v_new_balance integer;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can adjust loyalty points';
  end if;

  if p_points = 0 then
    raise exception 'Adjustment amount cannot be zero';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required for a manual adjustment';
  end if;

  select * into v_account from public.loyalty_accounts where profile_id = p_profile_id for update;
  if v_account is null then
    insert into public.loyalty_accounts (profile_id) values (p_profile_id) returning * into v_account;
  end if;

  v_new_balance := v_account.points_balance + p_points;
  if v_new_balance < 0 then
    raise exception 'Adjustment would result in a negative balance (current balance: %)', v_account.points_balance;
  end if;

  update public.loyalty_accounts set points_balance = v_new_balance where id = v_account.id returning * into v_account;

  insert into public.loyalty_transactions (loyalty_account_id, type, points, balance_after, reason)
  values (v_account.id, 'ADJUSTED', p_points, v_new_balance, p_reason);

  return v_account;
end;
$$;

revoke execute on function public.admin_adjust_loyalty_points(uuid, integer, text) from public, anon;
grant execute on function public.admin_adjust_loyalty_points(uuid, integer, text) to authenticated;

-- Admin role management. Uses the existing customer/admin role model only
-- (no new roles introduced). Self-escalation from customer to admin
-- remains blocked by the existing prevent_role_self_change trigger
-- (migration 0002), which this function does not touch. What was missing
-- was a *server-side* guard against an admin accidentally demoting the
-- last remaining administrator, leaving the store with no admin access at
-- all -- that's the one thing this function adds beyond a plain RLS-backed
-- update (which profiles_admin_all already technically allows).
create or replace function public.admin_set_profile_role(p_profile_id uuid, p_new_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.profiles;
  v_remaining_admins integer;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can change a user role';
  end if;

  if p_new_role not in ('customer', 'admin') then
    raise exception 'Invalid role: %', p_new_role;
  end if;

  select * into v_target from public.profiles where id = p_profile_id;
  if v_target is null then
    raise exception 'User not found';
  end if;

  if v_target.role = 'admin' and p_new_role = 'customer' then
    select count(*) into v_remaining_admins from public.profiles where role = 'admin' and id <> p_profile_id;
    if v_remaining_admins = 0 then
      raise exception 'Cannot remove the last administrator';
    end if;
  end if;

  update public.profiles set role = p_new_role where id = p_profile_id returning * into v_target;
  return v_target;
end;
$$;

revoke execute on function public.admin_set_profile_role(uuid, text) from public, anon;
grant execute on function public.admin_set_profile_role(uuid, text) to authenticated;
