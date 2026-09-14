-- orders.total and products.search_text_normalized are generated from
-- columns that are all themselves NOT NULL, so they can never actually be
-- null -- but Postgres doesn't infer that automatically for generated
-- columns, and the real `generate_typescript_types` output correctly
-- reflected that gap (total/search_text_normalized came back nullable).
-- Making the constraint explicit matches reality and removes an
-- unnecessary null-check from application code.
alter table public.orders alter column total set not null;
alter table public.products alter column search_text_normalized set not null;
