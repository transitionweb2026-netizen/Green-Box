-- Structural/confirmed data only -- see DATABASE.md, "Seeding Policy".
-- Delivery zones/areas/slots, banners, and the product catalog are
-- deliberately NOT seeded: they are real business data the admin enters,
-- not invented here.

insert into public.categories (slug, name_ar, name_en, display_order) values
  ('fresh-vegetables', 'خضروات طازجة', 'Fresh Vegetables', 1),
  ('fresh-fruits', 'فواكه طازجة', 'Fresh Fruits', 2),
  ('fresh-chicken', 'فراخ طازجة', 'Fresh Chicken', 3),
  ('prepared-vegetables', 'خضروات محضرة', 'Prepared Vegetables', 4),
  ('prepared-fruits', 'فواكه محضرة', 'Prepared Fruits', 5),
  ('green-box-boxes', 'صناديق جرين بوكس', 'Green Box Boxes', 6);

insert into public.payment_methods (code, name_ar, name_en, display_order) values
  ('vodafone_cash', 'فودافون كاش', 'Vodafone Cash', 1),
  ('instapay', 'إنستاباي', 'InstaPay', 2);

insert into public.loyalty_settings (id, is_enabled, spend_threshold, points_per_threshold, points_redemption_value, redemption_points_unit)
values (1, true, 1000, 100, 10, 100);
