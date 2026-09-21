-- banners: separate mobile image ------------------------------------
--
-- Lets the admin upload a different crop/version of a hero banner image
-- for mobile than for desktop (art direction, not just a resize) --
-- see components/storefront/hero-carousel.tsx, which renders image_url on
-- sm+ screens and falls back to it on mobile when image_url_mobile is unset.

alter table public.banners add column image_url_mobile text;
