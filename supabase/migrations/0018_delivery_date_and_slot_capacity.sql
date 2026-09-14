-- Phase 1 production-readiness: delivery-slot capacity + delivery date.
-- See DECISIONS.md Q16 (capacity was explicitly left unbuilt pending
-- confirmation) -- now confirmed and implemented.

-- NULL = unlimited (backward compatible with the one pre-existing slot,
-- which has no capacity set until an admin configures one from
-- /admin/delivery-slots).
alter table public.delivery_time_slots add column max_orders integer;
alter table public.delivery_time_slots
  add constraint delivery_time_slots_max_orders_check check (max_orders is null or max_orders > 0);

-- Orders previously carried only a recurring time-of-day window with no
-- calendar day attached (DECISIONS.md gap, closed here). Backfill existing
-- test orders to current_date, then drop the default so every future
-- insert (only ever via create_order()) must pass an explicit value.
alter table public.orders add column delivery_date date not null default current_date;
alter table public.orders alter column delivery_date drop default;

-- Capacity checks and admin/date-based lookups both filter by
-- (delivery_time_slot_id, delivery_date); cancelled orders don't hold a
-- slot booking, so they're excluded from the index.
create index orders_slot_date_idx on public.orders (delivery_time_slot_id, delivery_date)
  where status <> 'CANCELLED';
