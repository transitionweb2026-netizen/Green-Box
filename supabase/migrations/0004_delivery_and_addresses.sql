-- delivery_zones -------------------------------------------------------

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  -- Null until admin sets it -- never defaulted to an invented number.
  -- See DECISIONS.md D16.
  delivery_fee numeric(10, 2),
  min_order_amount numeric(10, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger delivery_zones_touch_updated_at
  before update on public.delivery_zones
  for each row execute function public.touch_updated_at();

alter table public.delivery_zones enable row level security;

create policy delivery_zones_public_select on public.delivery_zones
  for select using (is_active = true);

create policy delivery_zones_admin_all on public.delivery_zones
  for all using (public.is_admin()) with check (public.is_admin());

-- delivery_areas -------------------------------------------------------
-- Replaces loose text-matching against delivery_zones (Phase 0 audit
-- finding D17): a zone's fee/rules apply to one or many areas without
-- duplicating the zone row. A customer picks a served area from this
-- admin-curated list when saving an address -- structural delivery-zone
-- validation, not fuzzy text matching.

create table public.delivery_areas (
  id uuid primary key default gen_random_uuid(),
  delivery_zone_id uuid not null references public.delivery_zones (id) on delete restrict,
  governorate text not null,
  city text not null,
  area text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (governorate, city, area)
);

create index delivery_areas_delivery_zone_id_idx on public.delivery_areas (delivery_zone_id);

create trigger delivery_areas_touch_updated_at
  before update on public.delivery_areas
  for each row execute function public.touch_updated_at();

alter table public.delivery_areas enable row level security;

-- Visible only when both the area and its parent zone are active.
create policy delivery_areas_public_select on public.delivery_areas
  for select using (
    is_active = true
    and exists (
      select 1 from public.delivery_zones z
      where z.id = delivery_areas.delivery_zone_id and z.is_active = true
    )
  );

create policy delivery_areas_admin_all on public.delivery_areas
  for all using (public.is_admin()) with check (public.is_admin());

-- delivery_time_slots --------------------------------------------------

create table public.delivery_time_slots (
  id uuid primary key default gen_random_uuid(),
  label_ar text not null,
  label_en text,
  start_time time not null,
  end_time time not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create trigger delivery_time_slots_touch_updated_at
  before update on public.delivery_time_slots
  for each row execute function public.touch_updated_at();

alter table public.delivery_time_slots enable row level security;

create policy delivery_time_slots_public_select on public.delivery_time_slots
  for select using (is_active = true);

create policy delivery_time_slots_admin_all on public.delivery_time_slots
  for all using (public.is_admin()) with check (public.is_admin());

-- addresses --------------------------------------------------------------

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text not null,
  -- Resolves governorate/city/area AND zone via one join -- no duplicated
  -- free-text location fields to drift out of sync. See DATABASE.md,
  -- addresses.
  delivery_area_id uuid not null references public.delivery_areas (id) on delete restrict,
  detailed_address text not null,
  landmark text,
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_profile_id_idx on public.addresses (profile_id);

create trigger addresses_touch_updated_at
  before update on public.addresses
  for each row execute function public.touch_updated_at();

-- Only one default address per customer -- enforced server-side rather
-- than left ambiguous.
create or replace function public.enforce_single_default_address()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_default then
    update public.addresses
      set is_default = false
      where profile_id = new.profile_id
        and id <> new.id
        and is_default = true;
  end if;
  return new;
end;
$$;

create trigger addresses_enforce_single_default
  after insert or update of is_default on public.addresses
  for each row
  when (new.is_default = true)
  execute function public.enforce_single_default_address();

alter table public.addresses enable row level security;

create policy addresses_owner_all on public.addresses
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Admin gets read-only visibility (for fulfillment) -- not edit rights
-- over a customer's own address. See DATABASE.md, RLS Strategy.
create policy addresses_admin_select on public.addresses
  for select using (public.is_admin());

-- Table privileges for every table in this migration are centralized in
-- 0010_privilege_lockdown.sql -- see that file's header for why.
