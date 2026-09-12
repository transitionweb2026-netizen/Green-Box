-- Smart search V1: full-text rank (over the full name+description text) +
-- trigram fallback (over the name only) for typo tolerance, per
-- ARCHITECTURE.md "Smart Search". A single callable function keeps
-- ranking logic in one place rather than duplicated across client
-- query-builder calls.
--
-- The trigram comparison deliberately targets just the name (name_ar and
-- name_en compared *separately*, not the full search_text_normalized blob
-- and not concatenated together): trigram similarity is sensitive to
-- overall string length, so comparing a short, possibly-misspelled query
-- against a long or mixed-language string dilutes the score enough that
-- real matches don't clear the 0.3 default threshold. Typo tolerance is
-- what shoppers need on product *names*; full-text search already covers
-- description content. No dedicated index backs this expression --
-- acceptable for V1 at grocery-catalog scale (hundreds to low thousands
-- of products); revisit with a name-only trigram index if the catalog
-- grows enough for this to show up in query performance.

create or replace function public.search_products(
  p_query text,
  p_category_id uuid default null,
  p_limit integer default 20
)
returns setof public.products
language sql
stable
set search_path = public
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
  limit p_limit;
$$;

grant execute on function public.search_products(text, uuid, integer) to anon, authenticated;

-- Lightweight suggestions (product names + matching category) for
-- search-as-you-type, capped small since it's meant to render instantly.
create or replace function public.search_suggestions(
  p_query text,
  p_limit integer default 8
)
returns table (
  id uuid,
  slug text,
  name_ar text,
  name_en text,
  kind text
)
language sql
stable
set search_path = public
as $$
  (
    select p.id, p.slug, p.name_ar, p.name_en, 'product'::text as kind
    from public.products p
    join public.categories c on c.id = p.category_id
    where p.is_available = true
      and c.is_active = true
      and (
        public.normalize_arabic(p.name_ar) % public.normalize_arabic(p_query)
        or coalesce(p.name_en, '') % p_query
      )
    order by greatest(
      similarity(public.normalize_arabic(p.name_ar), public.normalize_arabic(p_query)),
      similarity(coalesce(p.name_en, ''), p_query)
    ) desc
    limit p_limit
  )
  union all
  (
    select cat.id, cat.slug, cat.name_ar, cat.name_en, 'category'::text as kind
    from public.categories cat
    where cat.is_active = true
      and (
        public.normalize_arabic(cat.name_ar) ilike '%' || public.normalize_arabic(p_query) || '%'
        or cat.name_en ilike '%' || p_query || '%'
      )
    limit 3
  )
$$;

grant execute on function public.search_suggestions(text, integer) to anon, authenticated;
