-- sold-by-weight pricing --------------------------------------------
--
-- Lets the admin price a product per gram instead of per whole unit: when
-- true, `products.price` is interpreted as EGP-per-gram (not EGP-per-kg
-- or per-piece), and the storefront quantity stepper collects a gram
-- amount directly. No separate "price per gram" column is needed --
-- reusing `price` this way means cart/order totals (already
-- unit_price * quantity) need zero changes and can never drift out of
-- sync with what the product page calculated and showed the customer.

alter table public.products
  add column sold_by_weight boolean not null default false;
