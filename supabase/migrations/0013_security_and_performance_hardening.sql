-- Fix 1: mutable search_path on functions that didn't already set one
-- (the SECURITY DEFINER functions already had `set search_path = public`
-- from 0002/0004/0008; these three did not). ALTER FUNCTION ... SET is
-- used instead of recreating the body, to touch nothing but the
-- search_path itself.
alter function public.touch_updated_at() set search_path = public;
alter function public.normalize_arabic(text) set search_path = public;
alter function public.enforce_box_items_types() set search_path = public;

-- Fix 2: pg_trgm was installed in public (flagged by the linter -- schema
-- pollution / naming-collision risk). Move it to the existing `extensions`
-- schema (already used by pgcrypto/uuid-ossp/pg_stat_statements in this
-- project). ALTER EXTENSION ... SET SCHEMA preserves object OIDs, so the
-- existing GIN trigram index on products keeps working without a rebuild
-- -- verified after this migration via a real search_products() call.
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;

-- search_products/search_suggestions use unqualified `%` and similarity()
-- calls, which need pg_trgm's new schema on their search_path now that
-- it's no longer in public.
alter function public.search_products(text, uuid, integer) set search_path = public, extensions;
alter function public.search_suggestions(text, integer) set search_path = public, extensions;

-- Fix 3: every function got Postgres's default PUBLIC execute grant,
-- which the advisor correctly flags for the SECURITY DEFINER ones --
-- `grant execute ... to authenticated` in 0008 never removed the
-- pre-existing PUBLIC grant, so `anon` could call create_order/
-- update_order_status/record_payment_verification too (harmless in
-- practice, since each independently checks auth.uid()/is_admin()
-- internally and raises an exception otherwise -- but least-privilege
-- says close it anyway). The plain trigger functions (returns trigger)
-- never need direct caller access at all: the trigger manager invokes
-- them regardless of the firing role's EXECUTE grant on the function
-- itself, which is why revoking here is safe (verified afterward with a
-- real signup, which fires handle_new_user).
--
-- NOTE: this migration's `revoke ... from public` turned out to be
-- insufficient on its own -- see 0014_fix_function_privilege_revokes.sql,
-- which discovered and fixed the real cause (a project-level default
-- privilege granting EXECUTE directly to anon/authenticated on new
-- functions, independent of the PUBLIC pseudo-role). Kept here unedited
-- for an accurate history; 0014 is the migration that actually closed it.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_user_email_change() from public;
revoke execute on function public.prevent_role_self_change() from public;
revoke execute on function public.enforce_single_default_address() from public;
revoke execute on function public.enforce_box_items_types() from public;
revoke execute on function public.touch_updated_at() from public;

revoke execute on function public.create_order(uuid, uuid, uuid, uuid, text, integer) from public;
revoke execute on function public.update_order_status(uuid, text, text) from public;
revoke execute on function public.record_payment_verification(uuid, text, text) from public;
grant execute on function public.create_order(uuid, uuid, uuid, uuid, text, integer) to authenticated;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;
grant execute on function public.record_payment_verification(uuid, text, text) to authenticated;

-- is_admin() is the one SECURITY DEFINER function that must stay callable
-- by BOTH anon and authenticated, despite the advisor flagging it: it's
-- referenced inside the admin-write RLS policy on every publicly-readable
-- catalog table (categories, products, ...), and Postgres evaluates every
-- permissive policy on a table for every query against it, including
-- anonymous SELECTs -- if anon couldn't execute is_admin(), anonymous
-- storefront browsing would fail with a permission error, not just skip
-- that policy. It only ever returns a boolean about the CALLING session's
-- own admin status (always false for anon), so this is a required
-- exception, not an oversight.
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- normalize_arabic must stay callable by anon+authenticated: it's invoked
-- (a) inside products' generated columns whenever authenticated (admin)
-- inserts/updates a product, and (b) inside search_products/
-- search_suggestions, which are SECURITY INVOKER, so the calling role
-- (anon or authenticated, doing a public search) needs EXECUTE on it too.
revoke execute on function public.normalize_arabic(text) from public;
grant execute on function public.normalize_arabic(text) to anon, authenticated;

-- Fix 4: 17 foreign keys had no covering index (flagged by the performance
-- advisor) -- adding them now while the tables are empty costs nothing and
-- avoids slow joins/cascades later.
create index addresses_delivery_area_id_idx on public.addresses (delivery_area_id);
create index box_items_item_product_id_idx on public.box_items (item_product_id);
create index cart_items_product_id_idx on public.cart_items (product_id);
create index loyalty_transactions_order_id_idx on public.loyalty_transactions (order_id);
create index order_items_product_id_idx on public.order_items (product_id);
create index order_status_history_changed_by_idx on public.order_status_history (changed_by);
create index orders_address_id_idx on public.orders (address_id);
create index orders_delivery_time_slot_id_idx on public.orders (delivery_time_slot_id);
create index orders_delivery_zone_id_idx on public.orders (delivery_zone_id);
create index orders_payment_method_id_idx on public.orders (payment_method_id);
create index payments_payment_method_id_idx on public.payments (payment_method_id);
create index payments_verified_by_idx on public.payments (verified_by);
create index subscription_items_product_id_idx on public.subscription_items (product_id);
create index subscriptions_address_id_idx on public.subscriptions (address_id);
create index subscriptions_delivery_time_slot_id_idx on public.subscriptions (delivery_time_slot_id);
create index subscriptions_delivery_zone_id_idx on public.subscriptions (delivery_zone_id);
create index subscriptions_payment_method_id_idx on public.subscriptions (payment_method_id);
