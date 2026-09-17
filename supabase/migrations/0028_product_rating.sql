-- product rating -----------------------------------------------------
--
-- Admin-set display rating (not a customer review system): a single
-- editable numeric rating + review count per product, shown as stars on
-- the storefront. Nullable rating -- null means "no rating set", so the
-- product card can simply omit the stars rather than showing a fake 0.

alter table public.products
  add column rating numeric(2, 1) check (rating is null or (rating >= 0 and rating <= 5)),
  add column rating_count integer not null default 0 check (rating_count >= 0);
