-- Extensions
create extension if not exists pg_trgm;

-- Generic updated_at maintenance, attached per-table in later migrations.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Arabic text normalization for search: strips diacritics/tatweel and
-- unifies common letter variants (alef forms, ya/alef-maksura, ta-marbuta)
-- so typo-tolerant search actually works for Arabic. See DATABASE.md,
-- "Arabic Text Normalization" -- Postgres ships no Arabic stemming
-- dictionary, so this plus trigram similarity carries the fuzziness
-- instead of linguistic stemming.
create or replace function public.normalize_arabic(input text)
returns text
language sql
immutable
parallel safe
as $$
  select regexp_replace(
    translate(coalesce(input, ''), 'أإآىة', 'ااايه'),
    '[ًٌٍَُِّْـ]',
    '',
    'g'
  );
$$;
