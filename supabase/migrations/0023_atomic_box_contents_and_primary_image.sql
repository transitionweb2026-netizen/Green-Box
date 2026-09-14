-- Two admin write paths were previously multiple separate client-issued
-- statements with no transaction boundary between them, so a failure
-- partway through could leave a box with zero contents, or a product with
-- no primary image. A single Postgres function call is always atomic (if
-- it raises, every effect within it rolls back) -- no SECURITY DEFINER
-- needed here, since the caller still needs the same RLS admin_all grants
-- on box_items/product_images they already had; this only adds a
-- transaction boundary, not new privilege.

create or replace function public.admin_set_box_contents(
  p_box_product_id uuid,
  p_items jsonb -- [{"productId": uuid, "quantity": int}, ...] in the desired order
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
    coalesce((item->>'quantity')::integer, 1),
    ord - 1
  from jsonb_array_elements(p_items) with ordinality as t(item, ord);
end;
$$;

revoke execute on function public.admin_set_box_contents(uuid, jsonb) from public;
revoke execute on function public.admin_set_box_contents(uuid, jsonb) from anon;
grant execute on function public.admin_set_box_contents(uuid, jsonb) to authenticated;

create or replace function public.admin_set_primary_product_image(
  p_product_id uuid,
  p_image_id uuid
)
returns void
language plpgsql
as $$
begin
  update public.product_images set is_primary = false where product_id = p_product_id;
  update public.product_images set is_primary = true where id = p_image_id and product_id = p_product_id;
end;
$$;

revoke execute on function public.admin_set_primary_product_image(uuid, uuid) from public;
revoke execute on function public.admin_set_primary_product_image(uuid, uuid) from anon;
grant execute on function public.admin_set_primary_product_image(uuid, uuid) to authenticated;
