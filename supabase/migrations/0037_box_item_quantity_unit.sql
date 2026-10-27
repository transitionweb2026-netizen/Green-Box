-- box item quantity unit --------------------------------------------
--
-- box_items.quantity previously had its unit implied entirely by the
-- *product's* own sold_by_weight flag (kilograms if true, a piece count
-- otherwise -- see box-contents-editor.tsx's prior doc comment), so an
-- admin could never type "250 جرام" for a box item unless the contained
-- product itself happened to be sold by weight on the storefront. This
-- makes the unit an explicit per-box-item choice (piece / gram / kg),
-- independent of the contained product's own sold_by_weight setting.

alter table public.box_items
  add column quantity_unit text not null default 'piece' check (quantity_unit in ('piece', 'gram', 'kg'));

-- Backfill: items on a sold-by-weight product were always kilograms,
-- everything else stayed a piece count -- preserves exactly how
-- existing data already rendered before this column existed.
update public.box_items bi
set quantity_unit = 'kg'
from public.products p
where p.id = bi.item_product_id and p.sold_by_weight = true;

create or replace function public.admin_set_box_contents(
  p_box_product_id uuid,
  p_items jsonb -- [{"productId": uuid, "quantity": numeric, "quantityUnit": "piece"|"gram"|"kg", "prepNoteAr": text?, "prepNoteEn": text?}, ...] in the desired order
)
returns void
language plpgsql
as $$
begin
  delete from public.box_items where box_product_id = p_box_product_id;

  insert into public.box_items (box_product_id, item_product_id, quantity, quantity_unit, prep_note_ar, prep_note_en, display_order)
  select
    p_box_product_id,
    (item->>'productId')::uuid,
    coalesce((item->>'quantity')::numeric(10, 2), 1),
    coalesce(nullif(item->>'quantityUnit', ''), 'piece'),
    nullif(item->>'prepNoteAr', ''),
    nullif(item->>'prepNoteEn', ''),
    ord - 1
  from jsonb_array_elements(p_items) with ordinality as t(item, ord);
end;
$$;
