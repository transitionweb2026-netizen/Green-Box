-- payment_methods --------------------------------------------------------

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_ar text not null,
  name_en text,
  instructions_ar text,
  instructions_en text,
  account_details jsonb not null default '{}'::jsonb,
  requires_proof boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger payment_methods_touch_updated_at
  before update on public.payment_methods
  for each row execute function public.touch_updated_at();

alter table public.payment_methods enable row level security;

create policy payment_methods_public_select on public.payment_methods
  for select using (is_active = true);

create policy payment_methods_admin_all on public.payment_methods
  for all using (public.is_admin()) with check (public.is_admin());

-- subscriptions / subscription_items ---------------------------------
-- Architecture only -- see ARCHITECTURE.md "Subscriptions" and
-- DECISIONS.md D10/Q5-Q7. No renewal/payment/pause/skip/cancel/refund
-- automation exists; this is data storage + admin visibility.

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PAUSED', 'CANCELLED')),
  address_id uuid references public.addresses (id) on delete set null,
  delivery_zone_id uuid references public.delivery_zones (id) on delete set null,
  delivery_time_slot_id uuid references public.delivery_time_slots (id) on delete set null,
  payment_method_id uuid references public.payment_methods (id) on delete set null,
  day_of_week integer check (day_of_week between 0 and 6),
  start_date date,
  next_delivery_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_profile_id_idx on public.subscriptions (profile_id);

create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

alter table public.subscriptions enable row level security;

create policy subscriptions_owner_all on public.subscriptions
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy subscriptions_admin_select on public.subscriptions
  for select using (public.is_admin());

create table public.subscription_items (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity numeric(10, 2) not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (subscription_id, product_id)
);

create index subscription_items_subscription_id_idx on public.subscription_items (subscription_id);

alter table public.subscription_items enable row level security;

create policy subscription_items_owner_all on public.subscription_items
  for all using (
    exists (
      select 1 from public.subscriptions s
      where s.id = subscription_items.subscription_id and s.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.subscriptions s
      where s.id = subscription_items.subscription_id and s.profile_id = auth.uid()
    )
  );

create policy subscription_items_admin_select on public.subscription_items
  for select using (public.is_admin());

-- Table privileges for every table in this migration are centralized in
-- 0010_privilege_lockdown.sql -- see that file's header for why.
