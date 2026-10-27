-- weight display unit + prep notes -----------------------------------
--
-- 1. weight_unit: lets the admin choose whether a sold-by-weight product
--    is shown/bought in grams or kilograms (previously hardcoded to
--    grams everywhere, with no admin control). `products.price` keeps
--    meaning EGP-per-gram always, exactly as sold_by_weight's own doc
--    comment (0031_sold_by_weight.sql) established -- this column is
--    purely a display/input-granularity preference, converted at the
--    admin-form and storefront-input boundaries (lib/utils/weight-unit.ts),
--    never in cart/order math, so create_order and every existing
--    price*quantity call site need zero changes.
--
-- 2. prep_note_ar/prep_note_en: an optional free-text note ("متقورة",
--    "مقطع", "مقشر"...) describing how an item is prepared/ready. Added
--    to both products (a standalone "prepared" product can describe its
--    own prep, e.g. a فواكه محضرة item) and box_items (a specific item
--    *inside* a box, e.g. the zucchini in a stuffed-vegetables box, can
--    carry its own note distinct from the product's general one). Plain
--    nullable text, not an enum: the real examples given (coring a
--    zucchini, chopping a mixed tray, peeling garlic) are different verbs
--    for different produce, not one fixed list of states.

alter table public.products
  add column weight_unit text not null default 'gram' check (weight_unit in ('gram', 'kg')),
  add column prep_note_ar text,
  add column prep_note_en text;

alter table public.box_items
  add column prep_note_ar text,
  add column prep_note_en text;

create or replace function public.admin_set_box_contents(
  p_box_product_id uuid,
  p_items jsonb -- [{"productId": uuid, "quantity": numeric, "prepNoteAr": text?, "prepNoteEn": text?}, ...] in the desired order
)
returns void
language plpgsql
as $$
begin
  delete from public.box_items where box_product_id = p_box_product_id;

  insert into public.box_items (box_product_id, item_product_id, quantity, prep_note_ar, prep_note_en, display_order)
  select
    p_box_product_id,
    (item->>'productId')::uuid,
    coalesce((item->>'quantity')::numeric(10, 2), 1),
    nullif(item->>'prepNoteAr', ''),
    nullif(item->>'prepNoteEn', ''),
    ord - 1
  from jsonb_array_elements(p_items) with ordinality as t(item, ord);
end;
$$;
