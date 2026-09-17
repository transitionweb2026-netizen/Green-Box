-- customer reviews -----------------------------------------------------
--
-- Admin-authored customer testimonials shown on the homepage teaser and
-- the dedicated /reviews page. Not tied to a real order/profile -- this is
-- curated marketing content the admin writes and edits, not a customer-
-- submitted review system.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  quote_ar text not null,
  quote_en text,
  rating integer not null default 5 check (rating >= 1 and rating <= 5),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_display_order_idx on public.reviews (display_order);

create trigger reviews_touch_updated_at
  before update on public.reviews
  for each row execute function public.touch_updated_at();

alter table public.reviews enable row level security;

create policy reviews_public_select on public.reviews
  for select using (is_active = true);

create policy reviews_admin_all on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- New tables get zero anon/authenticated privileges by default since
-- 0010_privilege_lockdown.sql's `alter default privileges` -- explicit
-- grants here, gated by is_admin() in the policy above, same matrix
-- shape as that migration's "Public catalog data" block.
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
