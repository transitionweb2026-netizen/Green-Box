-- widen price precision -------------------------------------------------
--
-- products.price was numeric(10,2), fine for whole-currency per-kg/per-
-- unit prices but not precise enough for per-gram prices (e.g. 205.00/1000
-- = 0.2050 rounds to 0.21 at 2dp, a real ~2.4% pricing error). Widening to
-- 4 decimal places going forward; see DECISIONS.md-style note in the
-- session history about the incident this migration follows.

alter table public.products
  alter column price type numeric(10, 4);
