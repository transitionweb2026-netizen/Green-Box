-- Performance advisor finding (auth_rls_initplan, 13 policies): a bare
-- auth.uid() in an RLS USING/CHECK expression is re-evaluated per row;
-- wrapping it as (select auth.uid()) lets Postgres evaluate it once per
-- query (a stable scalar subquery gets init-plan'd) with identical
-- security semantics -- confirmed via pg_policies before writing this,
-- not guessed from the advisor summary alone.

alter policy addresses_owner_all on public.addresses
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

alter policy cart_items_owner_all on public.cart_items
  using (exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.profile_id = (select auth.uid())))
  with check (exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.profile_id = (select auth.uid())));

alter policy carts_owner_all on public.carts
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

alter policy loyalty_accounts_owner_select on public.loyalty_accounts
  using (profile_id = (select auth.uid()));

alter policy loyalty_transactions_owner_select on public.loyalty_transactions
  using (exists (
    select 1 from public.loyalty_accounts a
    where a.id = loyalty_transactions.loyalty_account_id and a.profile_id = (select auth.uid())
  ));

alter policy order_items_owner_select on public.order_items
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.profile_id = (select auth.uid())));

alter policy order_status_history_owner_select on public.order_status_history
  using (exists (select 1 from public.orders o where o.id = order_status_history.order_id and o.profile_id = (select auth.uid())));

alter policy orders_owner_select on public.orders
  using (profile_id = (select auth.uid()));

alter policy payments_owner_select on public.payments
  using (exists (select 1 from public.orders o where o.id = payments.order_id and o.profile_id = (select auth.uid())));

alter policy profiles_select_own on public.profiles
  using (id = (select auth.uid()));

alter policy profiles_update_own on public.profiles
  using (id = (select auth.uid()));

alter policy subscription_items_owner_all on public.subscription_items
  using (exists (
    select 1 from public.subscriptions s
    where s.id = subscription_items.subscription_id and s.profile_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.subscriptions s
    where s.id = subscription_items.subscription_id and s.profile_id = (select auth.uid())
  ));

alter policy subscriptions_owner_all on public.subscriptions
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
