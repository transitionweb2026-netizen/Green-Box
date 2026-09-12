-- Explicit, auditable privilege matrix for the whole schema.
--
-- Why this file exists: a default Supabase project typically runs
-- something like `alter default privileges in schema public grant all on
-- tables to anon, authenticated` so PostgREST works out of the box for
-- tables created ad hoc in the SQL editor. That default would silently
-- undermine the trusted-function security model in 0006/0007 (anon/
-- authenticated getting a table-level INSERT/UPDATE grant regardless of
-- what each earlier migration explicitly granted). Rather than assume
-- either way, this migration revokes everything from anon/authenticated
-- across every table just created and re-grants exactly what's intended,
-- in one place that states the complete privilege model precisely
-- alongside the RLS design. It also updates default privileges for
-- objects created after this migration by the same role.

revoke all on all tables in schema public from anon, authenticated;

-- Public catalog data: anon + authenticated read; authenticated write
-- (gated by is_admin() in each table's RLS policy).
grant select on
  public.categories, public.products, public.product_images, public.box_items,
  public.delivery_zones, public.delivery_areas, public.delivery_time_slots,
  public.payment_methods, public.loyalty_settings, public.settings, public.banners
to anon, authenticated;

grant insert, update, delete on
  public.categories, public.products, public.product_images, public.box_items,
  public.delivery_zones, public.delivery_areas, public.delivery_time_slots,
  public.payment_methods, public.loyalty_settings, public.settings, public.banners
to authenticated;

-- profiles: self select; update restricted to the columns an app context
-- (self or admin) should ever change directly. role/email/id/timestamps
-- stay un-updatable via any client path -- a table-level `grant update`
-- with no column list would cover ALL columns and silently re-enable the
-- role column despite 0002's column-specific revoke, since GRANTs are
-- additive and column-unqualified UPDATE means "all columns". Promoting a
-- user to admin remains a manual SQL-editor action (see DATABASE.md,
-- profiles) since multi-admin management isn't built yet.
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Owned data: full CRUD for authenticated, gated by profile_id = auth.uid()
-- (or a join to it) in each table's RLS policy. No anon access at all.
grant select, insert, update, delete on
  public.addresses, public.carts, public.cart_items,
  public.subscriptions, public.subscription_items
to authenticated;

-- Money and loyalty: SELECT only for authenticated (RLS scopes to the
-- caller's own rows, or is_admin()). All writes go through the trusted
-- functions in 0008_trusted_functions.sql, which run as SECURITY DEFINER
-- and are therefore unaffected by these revokes. No anon access at all.
grant select on
  public.orders, public.order_items, public.order_status_history,
  public.payments, public.loyalty_accounts, public.loyalty_transactions
to authenticated;

-- Keep this the default for any table a future migration adds, until
-- explicitly granted otherwise.
alter default privileges in schema public revoke all on tables from anon, authenticated;
