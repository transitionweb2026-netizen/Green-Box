create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  -- Denormalized from auth.users.email (kept in sync by trigger below) --
  -- auth.users is not safely queryable by the app under RLS, and admin
  -- needs to list/search customers by email. See DATABASE.md, profiles.
  email text,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (email);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Auto-create a profile row whenever a new auth.users row is created,
-- copying the signup metadata (full_name/phone) our register Server
-- Action already passes today.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync if the auth email changes.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Authorization helper used throughout RLS policies. SECURITY DEFINER so it
-- can read profiles without being subject to the very RLS policies it
-- backs (avoids recursion) -- standard Supabase pattern.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- A customer must never be able to self-promote to admin. Primary defense
-- is revoking the grant itself (independent of RLS); the trigger below is
-- a defense-in-depth backstop in case a future migration re-grants it.
revoke update (role) on public.profiles from authenticated;

-- The column-level revoke above already fully blocks the authenticated
-- role from updating this column at all -- Postgres checks column
-- privileges before a trigger ever runs, so this trigger's practical
-- purpose is defense-in-depth against a future mistake (e.g. someone
-- re-granting UPDATE on this column without realizing the implications).
-- It must NOT block the legitimate manual bootstrap path (an admin
-- promoting a user via the Supabase SQL editor / migrations, which
-- connect as the `postgres` role) -- otherwise there would be no way to
-- create the first admin at all, since is_admin() can never be true
-- before one exists. Checking current_user directly (not just the
-- is_superuser GUC) because a managed Postgres's `postgres` role is not
-- always flagged a true superuser even though it's the role Supabase's
-- SQL editor and migrations connect as.
create or replace function public.prevent_role_self_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and not public.is_admin()
     and current_user <> 'postgres'
     and current_setting('is_superuser', true) is distinct from 'on' then
    raise exception 'Only an admin can change a profile role';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_self_change
  before update on public.profiles
  for each row execute function public.prevent_role_self_change();

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid());

create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Table privileges (GRANT/REVOKE) for every table are centralized in
-- 0010_privilege_lockdown.sql, not scattered per-table -- see that file's
-- header for why. The role-column-specific revoke above is the one
-- exception, kept here since it's tied directly to the column it protects.
