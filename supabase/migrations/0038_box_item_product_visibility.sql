-- box-item product visibility -----------------------------------------
--
-- products_public_select (0003_catalog.sql) only allows the public to
-- read a product row when is_available = true. A box's own ingredient
-- products are frequently created unavailable on purpose (the
-- quick-create-box-item flow in products/actions.ts always sets
-- is_available: false, since that ingredient is never meant to be sold
-- standalone) -- getBoxContents's join `item:products!...(*, ...)` was
-- silently returning null for every such row under RLS, which crashed
-- every page that renders a box's contents (homepage box showcase, a
-- box's own product page) with "Cannot read properties of null (reading
-- 'product_images')" the moment a box contained at least one
-- unavailable-by-design ingredient. getBoxContents's own doc comment
-- already says box contents render "regardless of a contained product's
-- own availability" -- this was the intended behavior, just broken by
-- RLS underneath it.
--
-- This adds a second permissive SELECT policy (OR'd with the existing
-- one) that makes a product row readable when it's referenced by a
-- box_items row, regardless of is_available. It does not make the
-- product purchasable or listed/searchable on its own -- every storefront
-- listing/search/product-detail query still filters is_available = true
-- explicitly at the query level (lib/services/catalog.ts), independent
-- of RLS.
create policy products_box_item_visible on public.products
  for select using (
    exists (
      select 1 from public.box_items bi
      where bi.item_product_id = products.id
    )
  );
