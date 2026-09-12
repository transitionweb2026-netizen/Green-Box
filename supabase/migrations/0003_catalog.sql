-- categories -----------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  -- Nullable, self-referential, unused by the current 6 flat categories.
  -- Added now because "Supermarket / Grocery" (a named future category)
  -- will very likely need subcategories -- see DECISIONS.md D21.
  parent_id uuid references public.categories (id) on delete set null,
  slug text not null unique,
  name_ar text not null,
  name_en text,
  description_ar text,
  description_en text,
  image_url text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  meta_title_ar text,
  meta_title_en text,
  meta_description_ar text,
  meta_description_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_parent_id_idx on public.categories (parent_id);
create index categories_display_order_idx on public.categories (display_order);

create trigger categories_touch_updated_at
  before update on public.categories
  for each row execute function public.touch_updated_at();

alter table public.categories enable row level security;

create policy categories_public_select on public.categories
  for select using (is_active = true);

create policy categories_admin_all on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- products ---------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  product_type text not null default 'standard' check (product_type in ('standard', 'box')),
  sku text unique,
  slug text not null unique,
  name_ar text not null,
  name_en text,
  description_ar text,
  description_en text,
  -- Free-text display unit only (e.g. "كجم"/"kg") -- not a weight/scale
  -- pricing engine. See DECISIONS.md Q9.
  unit_label_ar text,
  unit_label_en text,
  price numeric(10, 2) not null check (price >= 0),
  -- Stock/availability toggle, distinct from the parent category's
  -- is_active -- a product can be temporarily unavailable without
  -- deactivating its whole category.
  is_available boolean not null default true,
  -- Generic flag for Chicken's reservation-based flow; detailed rules TBD
  -- (DECISIONS.md Q11).
  requires_reservation boolean not null default false,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  meta_title_ar text,
  meta_title_en text,
  meta_description_ar text,
  meta_description_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
  add column search_text_normalized text generated always as (
    public.normalize_arabic(name_ar) || ' ' ||
    coalesce(name_en, '') || ' ' ||
    public.normalize_arabic(coalesce(description_ar, ''))
  ) stored;

-- Postgres does not allow a generated column to reference another
-- generated column, so this repeats the search_text_normalized expression
-- rather than reading that column. 'simple' is deliberate, not
-- 'arabic'/'english' -- Postgres ships no Arabic stemming dictionary, and
-- assuming English stemming for a bilingual field would be wrong. See
-- DATABASE.md, Full-Text & Fuzzy Search.
alter table public.products
  add column search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      public.normalize_arabic(name_ar) || ' ' ||
      coalesce(name_en, '') || ' ' ||
      public.normalize_arabic(coalesce(description_ar, ''))
    )
  ) stored;

create index products_category_id_idx on public.products (category_id);
create index products_is_available_is_featured_idx on public.products (is_available, is_featured);
create index products_search_vector_idx on public.products using gin (search_vector);
create index products_search_trgm_idx on public.products using gin (search_text_normalized gin_trgm_ops);

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

alter table public.products enable row level security;

-- Public visibility rule: available AND its category is active (both must
-- hold). See DATABASE.md, products.
create policy products_public_select on public.products
  for select using (
    is_available = true
    and exists (
      select 1 from public.categories c
      where c.id = products.category_id and c.is_active = true
    )
  );

create policy products_admin_all on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- product_images -----------------------------------------------------

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt_ar text,
  alt_en text,
  display_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id);

create trigger product_images_touch_updated_at
  before update on public.product_images
  for each row execute function public.touch_updated_at();

alter table public.product_images enable row level security;

-- Not gated by the parent product's active state -- image rows carry no
-- sensitive data, so unconditional public select is simpler with no
-- security cost (see DATABASE.md, product_images).
create policy product_images_public_select on public.product_images
  for select using (true);

create policy product_images_admin_all on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- box_items ----------------------------------------------------------

create table public.box_items (
  id uuid primary key default gen_random_uuid(),
  box_product_id uuid not null references public.products (id) on delete cascade,
  item_product_id uuid not null references public.products (id) on delete restrict,
  quantity numeric(10, 2) not null default 1 check (quantity > 0),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (box_product_id, item_product_id)
);

create index box_items_box_product_id_idx on public.box_items (box_product_id);

-- A box cannot contain another box: box_product_id must reference a
-- product_type = 'box' row, item_product_id must reference a
-- product_type = 'standard' row. Enforced via trigger (not a plain CHECK)
-- since it needs to look at other rows. See ARCHITECTURE.md, Green Box
-- Boxes.
create or replace function public.enforce_box_items_types()
returns trigger
language plpgsql
as $$
declare
  box_type text;
  item_type text;
begin
  select product_type into box_type from public.products where id = new.box_product_id;
  select product_type into item_type from public.products where id = new.item_product_id;

  if box_type is distinct from 'box' then
    raise exception 'box_items.box_product_id must reference a product with product_type = box';
  end if;

  if item_type is distinct from 'standard' then
    raise exception 'box_items.item_product_id must reference a product with product_type = standard (no nested boxes)';
  end if;

  return new;
end;
$$;

create trigger box_items_enforce_types
  before insert or update on public.box_items
  for each row execute function public.enforce_box_items_types();

alter table public.box_items enable row level security;

create policy box_items_public_select on public.box_items
  for select using (true);

create policy box_items_admin_all on public.box_items
  for all using (public.is_admin()) with check (public.is_admin());

-- Table privileges for every table in this migration are centralized in
-- 0010_privilege_lockdown.sql -- see that file's header for why.
