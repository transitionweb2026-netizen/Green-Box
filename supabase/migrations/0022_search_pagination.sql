-- Search results were hard-capped at 20 with no way to see more or know
-- how many total matches existed. Adds an offset param to search_products
-- (additive default, so the existing call site keeps working unchanged)
-- and a matching count function so the frontend can render real
-- pagination instead of silently truncating results.

drop function if exists public.search_products(text, uuid, integer);

create or replace function public.search_products(
  p_query text,
  p_category_id uuid default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns setof public.products
language sql
stable
set search_path = public, extensions
as $$
  select p.*
  from public.products p
  join public.categories c on c.id = p.category_id
  where p.is_available = true
    and c.is_active = true
    and (p_category_id is null or p.category_id = p_category_id)
    and (
      p.search_vector @@ websearch_to_tsquery('simple', public.normalize_arabic(p_query))
      or public.normalize_arabic(p.name_ar) % public.normalize_arabic(p_query)
      or coalesce(p.name_en, '') % p_query
    )
  order by
    ts_rank(p.search_vector, websearch_to_tsquery('simple', public.normalize_arabic(p_query))) desc,
    greatest(
      similarity(public.normalize_arabic(p.name_ar), public.normalize_arabic(p_query)),
      similarity(coalesce(p.name_en, ''), p_query)
    ) desc
  limit p_limit
  offset p_offset;
$$;

revoke execute on function public.search_products(text, uuid, integer, integer) from public;
revoke execute on function public.search_products(text, uuid, integer, integer) from anon, authenticated;
grant execute on function public.search_products(text, uuid, integer, integer) to anon, authenticated;

-- Same WHERE clause as search_products, just counting instead of paging --
-- kept as a separate function (not a window-function column on
-- search_products) so the common case of "just fetch a page" doesn't pay
-- for a count() it isn't always going to use.
create or replace function public.count_search_products(
  p_query text,
  p_category_id uuid default null
)
returns integer
language sql
stable
set search_path = public, extensions
as $$
  select count(*)::integer
  from public.products p
  join public.categories c on c.id = p.category_id
  where p.is_available = true
    and c.is_active = true
    and (p_category_id is null or p.category_id = p_category_id)
    and (
      p.search_vector @@ websearch_to_tsquery('simple', public.normalize_arabic(p_query))
      or public.normalize_arabic(p.name_ar) % public.normalize_arabic(p_query)
      or coalesce(p.name_en, '') % p_query
    );
$$;

revoke execute on function public.count_search_products(text, uuid) from public;
revoke execute on function public.count_search_products(text, uuid) from anon, authenticated;
grant execute on function public.count_search_products(text, uuid) to anon, authenticated;
