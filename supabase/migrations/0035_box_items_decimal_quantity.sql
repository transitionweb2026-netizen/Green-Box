-- box_items.quantity is already numeric(10,2) (see 0003_catalog.sql) --
-- genuinely decimal-capable at the column level. admin_set_box_contents
-- (0023_atomic_box_contents_and_primary_image.sql) never was: it casts
-- the incoming JSON value straight to `::integer`, which errors on any
-- decimal input ("invalid input syntax for type integer: \"1.5\"").
-- This is what breaks saving a weight-based quantity (e.g. "1.5" kg for
-- a sold-by-weight item, see components/admin/box-contents-editor.tsx)
-- even though the column itself always supported it. Fixes the cast to
-- `::numeric`, matching the column's actual type -- no other behavior
-- changes (same delete-then-bulk-insert body, same atomicity, same
-- grants).
create or replace function public.admin_set_box_contents(
  p_box_product_id uuid,
  p_items jsonb -- [{"productId": uuid, "quantity": numeric}, ...] in the desired order
)
returns void
language plpgsql
as $$
begin
  delete from public.box_items where box_product_id = p_box_product_id;

  insert into public.box_items (box_product_id, item_product_id, quantity, display_order)
  select
    p_box_product_id,
    (item->>'productId')::uuid,
    coalesce((item->>'quantity')::numeric(10, 2), 1),
    ord - 1
  from jsonb_array_elements(p_items) with ordinality as t(item, ord);
end;
$$;
