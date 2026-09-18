-- newsletter subscribers -------------------------------------------------
--
-- Footer email signup. Public (anonymous) insert only -- no public read,
-- so a submitted address can never be scraped back out through the same
-- form. Admin gets full access to view/manage the list.

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  locale text,
  created_at timestamptz not null default now()
);

create index newsletter_subscribers_created_at_idx on public.newsletter_subscribers (created_at desc);

alter table public.newsletter_subscribers enable row level security;

create policy newsletter_subscribers_public_insert on public.newsletter_subscribers
  for insert to anon, authenticated
  with check (true);

create policy newsletter_subscribers_admin_all on public.newsletter_subscribers
  for all using (public.is_admin()) with check (public.is_admin());

-- New tables get zero anon/authenticated privileges by default since
-- 0010_privilege_lockdown.sql's `alter default privileges` -- explicit
-- grants here, gated by the policies above (insert-only for anon,
-- everything for an admin via is_admin()).
grant insert on public.newsletter_subscribers to anon, authenticated;
grant select, update, delete on public.newsletter_subscribers to authenticated;
