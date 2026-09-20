-- recipes --------------------------------------------------------------
--
-- Admin-authored recipes shown on the public /recipes list + /recipes/[slug]
-- detail pages, added alongside the new "Our Story"/"Recipes"/
-- "Sustainability" header nav. Same admin-authored-content shape as
-- reviews/banners (0029_customer_reviews.sql) -- not user-submitted.

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_ar text not null,
  title_en text,
  description_ar text,
  description_en text,
  image_url text,
  prep_minutes integer,
  servings integer,
  ingredients_ar text,
  ingredients_en text,
  steps_ar text,
  steps_en text,
  is_published boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipes_display_order_idx on public.recipes (display_order);

create trigger recipes_touch_updated_at
  before update on public.recipes
  for each row execute function public.touch_updated_at();

alter table public.recipes enable row level security;

create policy recipes_public_select on public.recipes
  for select using (is_published = true);

create policy recipes_admin_all on public.recipes
  for all using (public.is_admin()) with check (public.is_admin());

-- New tables get zero anon/authenticated privileges by default since
-- 0010_privilege_lockdown.sql's `alter default privileges` -- explicit
-- grants here, gated by is_admin() in the policy above, same matrix
-- shape as 0029_customer_reviews.sql.
grant select on public.recipes to anon, authenticated;
grant insert, update, delete on public.recipes to authenticated;
