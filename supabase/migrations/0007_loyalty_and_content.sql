-- loyalty_settings (singleton) -----------------------------------------

create table public.loyalty_settings (
  id integer primary key default 1 check (id = 1),
  is_enabled boolean not null default true,
  -- Confirmed defaults per PROJECT_SPEC.md "Loyalty Program": 1000 EGP
  -- spent -> 100 points; 100 points -> 10 EGP. Fully admin-editable.
  spend_threshold numeric(10, 2) not null default 1000,
  points_per_threshold integer not null default 100,
  points_redemption_value numeric(10, 2) not null default 10,
  redemption_points_unit integer not null default 100,
  min_redeemable_points integer,
  updated_at timestamptz not null default now()
);

create trigger loyalty_settings_touch_updated_at
  before update on public.loyalty_settings
  for each row execute function public.touch_updated_at();

alter table public.loyalty_settings enable row level security;

create policy loyalty_settings_public_select on public.loyalty_settings
  for select using (true);

create policy loyalty_settings_admin_all on public.loyalty_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- loyalty_accounts / loyalty_transactions -------------------------------
-- Balance is always derived by writing a transaction row in the same
-- operation -- never mutated directly. No insert/update grant for
-- authenticated; writes go through the trusted functions (0008). See
-- DATABASE.md, Loyalty Timing Rules.

create table public.loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  points_balance integer not null default 0,
  lifetime_points_earned integer not null default 0,
  lifetime_points_redeemed integer not null default 0,
  updated_at timestamptz not null default now()
);

create trigger loyalty_accounts_touch_updated_at
  before update on public.loyalty_accounts
  for each row execute function public.touch_updated_at();

alter table public.loyalty_accounts enable row level security;

create policy loyalty_accounts_owner_select on public.loyalty_accounts
  for select using (profile_id = auth.uid());

create policy loyalty_accounts_admin_select on public.loyalty_accounts
  for select using (public.is_admin());

create table public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  loyalty_account_id uuid not null references public.loyalty_accounts (id) on delete cascade,
  -- Signed: positive for EARNED/REVERSED, negative for REDEEMED, either
  -- sign for ADJUSTED -- so sum(points) always equals the account balance.
  -- 'EXPIRED' was dropped from an earlier draft (no point-expiry policy
  -- has been requested); 'REVERSED' covers redemption-undone-on-
  -- cancellation, which is needed regardless of the still-unconfirmed
  -- general refund policy. See DATABASE.md, loyalty_transactions.
  type text not null check (type in ('EARNED', 'REDEEMED', 'ADJUSTED', 'REVERSED')),
  points integer not null,
  balance_after integer not null,
  order_id uuid references public.orders (id),
  reason text,
  created_at timestamptz not null default now()
);

create index loyalty_transactions_account_created_idx on public.loyalty_transactions (loyalty_account_id, created_at desc);

alter table public.loyalty_transactions enable row level security;

create policy loyalty_transactions_owner_select on public.loyalty_transactions
  for select using (
    exists (
      select 1 from public.loyalty_accounts a
      where a.id = loyalty_transactions.loyalty_account_id and a.profile_id = auth.uid()
    )
  );

create policy loyalty_transactions_admin_select on public.loyalty_transactions
  for select using (public.is_admin());

-- settings (generic key/value store) ------------------------------------

create table public.settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

create trigger settings_touch_updated_at
  before update on public.settings
  for each row execute function public.touch_updated_at();

alter table public.settings enable row level security;

create policy settings_public_select on public.settings
  for select using (true);

create policy settings_admin_all on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- banners (homepage content) ---------------------------------------------

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title_ar text,
  title_en text,
  image_url text,
  link_url text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger banners_touch_updated_at
  before update on public.banners
  for each row execute function public.touch_updated_at();

alter table public.banners enable row level security;

create policy banners_public_select on public.banners
  for select using (is_active = true);

create policy banners_admin_all on public.banners
  for all using (public.is_admin()) with check (public.is_admin());

-- Table privileges for every table in this migration are centralized in
-- 0010_privilege_lockdown.sql -- see that file's header for why.
