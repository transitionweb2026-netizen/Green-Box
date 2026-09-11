# Green Box — Decisions Log

Two kinds of entries: **confirmed** decisions (with rationale, so they can be revisited deliberately) and **open questions** the business must answer before the related feature can be fully implemented. Nothing in the "open" list should be implemented speculatively — see [PROJECT_SPEC.md](PROJECT_SPEC.md) §24.

## A. Confirmed Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Stack: Next.js (App Router) + TypeScript + Tailwind + Supabase (Postgres/Auth/Storage/RLS) | Mandated by project instructions; versions aligned to Next 16.2.10 / React 19.2.4 / Tailwind 4 / next-intl 4.13.1 / supabase-js 2.110.1, already proven on this machine (Node v26.3.1) |
| D2 | `next-intl` for `ar`/`en` locale routing; business content stored as paired DB columns, not duplicated components | Matches rule "do not duplicate entire components just for Arabic/English"; separates UI-string i18n from business-data i18n |
| D3 | Order statuses fixed to: `PENDING, CONFIRMED, PREPARING, PACKING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED` | Explicitly given in requirements |
| D4 | Status/type columns use `text + CHECK` instead of native Postgres `enum` | Easier and safer to extend later without `ALTER TYPE` transaction restrictions |
| D5 | Green Box Boxes modeled as `products.product_type = 'box'` + `box_items` join table, not a parallel model | Boxes need everything a product needs (price, image, availability, cart/order/loyalty integration); avoids duplicating that pipeline. See [ARCHITECTURE.md](ARCHITECTURE.md) §5 |
| D6 | Payment methods at launch: Vodafone Cash and InstaPay only, both implemented as one generic "manual wallet" provider parameterized by DB config | Both are operationally identical today (pay to a number, submit proof); avoids duplicate near-identical code while still allowing divergent providers later |
| D7 | Loyalty default formula seeded as 1000 EGP → 100 points, 100 points → 10 EGP, fully admin-editable | Explicitly given as the current business rule; stored in a single-row configurable `loyalty_settings` table, not hardcoded |
| D8 | Loyalty balance is derived from an append-only `loyalty_transactions` ledger, never a single mutable counter | Explicit requirement; also gives auditability |
| D9 | Search V1 = Postgres full-text (`tsvector`) + `pg_trgm`, no external search service or AI ranking | Explicit instruction not to over-engineer V1; service-layer boundary keeps a future swap non-breaking |
| D10 | Subscriptions: data model only in Phase 9; no renewal/payment/pause/skip/cancel/refund automation until business rules are confirmed | Explicit instruction not to invent these rules |
| D11 | Categories kept flat (no parent/child hierarchy) | No current or future category in scope needs subcategories; avoids speculative complexity |
| D12 | Guest checkout/guest cart not built now; schema leaves `carts.profile_id` nullable so it is a non-breaking future addition | Explicit instruction: every order requires an account; avoid unnecessary complexity now |
| D13 | Admin authorization via single `profiles.role` column + `is_admin()` helper, not a full roles/permissions table | Multiple admin roles are listed as future scalability, not current scope; the single `requireAdmin()` choke point makes upgrading to granular roles later a localized change |
| D14 | Middleware-level route protection is defense-in-depth only; Postgres RLS is the actual authorization boundary everywhere | Explicit security requirement: never rely on frontend-only protection |
| D15 | `orders` stores both a normalized `address_id`/`delivery_zone_id`/`delivery_time_slot_id` reference **and** a JSON snapshot of the address/slot at order time | Explicit requirement that historical orders must never change when the source data changes later |
| D16 | Delivery zones/time slots/fees are not seeded with any real values; example slot times in the spec are illustrative only | Explicit instruction not to invent delivery zones, fees, or slot data |

### Added by the Phase 0 architecture audit

| # | Decision | Rationale |
|---|---|---|
| D17 | Delivery zones are split into `delivery_zones` (fee/rules) and `delivery_areas` (the admin-curated list of served governorate/city/area combinations, each belonging to one zone); a customer's address must pick a served area rather than free-typing a location that gets fuzzy-matched | The original single-table design had both a direct zone FK on addresses *and* separate free-text matching fields on the zone itself — ambiguous, couldn't let one zone/fee cover multiple areas without duplicating rows, and "matching" could silently fail. Picking from a finite list is also what actually implements the "delivery zone selection/validation" requirement, rather than approximating it |
| D18 | `orders`, `order_items`, `payments`, `loyalty_accounts`, and `loyalty_transactions` have no direct client `INSERT`/`UPDATE` grant; all writes happen through narrow `SECURITY DEFINER` Postgres functions (`create_order`, `update_order_status`, `record_payment_verification`) that recompute prices/points from live data | A plain "customer can insert where `profile_id = auth.uid()`" RLS policy restricts *which rows* a client can touch, not *which values* — it would have let a client submit a forged `unit_price` or fabricate a loyalty-earning transaction. This is the single most important fix from the audit |
| D19 | Loyalty points are earned only when an order transitions to `DELIVERED` (not at order creation); points redeemed at checkout are reversed via a `REVERSED` ledger entry if the order is later `CANCELLED` | Previously unspecified. Prevents crediting points for orders that never actually complete, and defines a concrete (not invented-business-rule) behavior for the one loyalty edge case that's unavoidable regardless of the still-unconfirmed general cancellation/refund policy (Q8) |
| D20 | The admin dashboard is single-language and not routed through `next-intl`'s locale prefixes; only the customer-facing storefront is locale-prefixed | The bilingual requirement (spec §16) is scoped to "the website" customers see. Forcing every internal admin label through a bilingual message catalog is effort spent on a requirement never asked for, and was flagged as unnecessary complexity in the audit |
| D21 | `categories.parent_id` (nullable, self-referential) is added in Phase 2 even though it's unused by the current 6 flat categories | "Supermarket / Grocery" is an explicitly named future category (spec §1) that will very likely need subcategories; adding the column now avoids a breaking migration later. This is judged as directly justified by a named requirement, not speculative gold-plating |
| D22 | `profiles.email` is denormalized from `auth.users.email`, kept in sync by trigger | `auth.users` is a protected schema the app can't safely query directly under RLS; the admin "Customers" section needs to list/search by email, which is a stated admin requirement (spec §13/§15) |
| D23 | Anything a historical order can reference (categories, products, delivery zones/areas, time slots, payment methods) is soft-deleted (`is_active = false`) from the admin UI; hard `DELETE` is not exposed for referenced rows | Historical orders carry live FKs back to several of these tables (in addition to JSON snapshots) specifically so admin can filter/report by them; a hard delete would break that referential integrity for no benefit over deactivating |

## B. Open Business Decisions (do not implement until answered)

These are tracked so they are visible, not forgotten — each maps to a specific schema/service hook already prepared so the answer can be dropped in without a redesign.

| # | Question | Why it matters | Where it plugs in |
|---|---|---|---|
| Q1 | What are the actual delivery zones, and what fee/minimum order applies to each? | Needed before checkout can be used for a real order | `delivery_zones.delivery_fee` / `.min_order_amount` (nullable until set) |
| Q2 | What are the real delivery time slot hours and days of availability? | Needed before checkout can offer real slots | `delivery_time_slots` (admin-created in Phase 3, not seeded) |
| Q3 | What is the store-wide minimum order amount, if any (separate from per-zone minimums)? | Affects checkout validation | Not yet modeled; add a `settings` key once confirmed, or fold into per-zone `min_order_amount` if that's sufficient |
| Q4 | What is the payment confirmation workflow — transaction reference, screenshot upload, manual admin approval, automatic verification, or some combination? | Determines what checkout must collect and what admin must review | `payment_methods.requires_proof`, `payments.transaction_reference` / `.proof_image_url` / `.verified_by` are all nullable/optional pending this answer |
| Q5 | Subscription renewal behavior: does it auto-charge, auto-create orders, or require customer confirmation each cycle? | Core to whether subscriptions need a scheduled job at all | `subscriptions` table exists; no job/automation built |
| Q6 | Subscription pause/skip-a-week rules | Affects `next_delivery_date` logic | `subscriptions.next_delivery_date` reserved, logic not implemented |
| Q7 | Subscription cancellation policy (notice period, penalties, etc.) | Affects allowed `status` transitions | `subscriptions.status` enum reserved (`ACTIVE/PAUSED/CANCELLED`), transition rules not implemented |
| Q8 | Refund policy (subscriptions and regular orders) | No refund flow exists yet | `payments.status` includes `REFUNDED` as a placeholder value only |
| Q9 | Product units / custom weights — can a customer order 750g of something, or only fixed units/packs? | Affects cart quantity semantics and pricing | `products.unit_label_ar/en` is display-only today; `cart_items.quantity`/`order_items.quantity` are `numeric` (not `int`) specifically to avoid blocking a future fractional-quantity answer, but no weight-based pricing UI exists |
| Q10 | Stock/inventory behavior — is `is_available` (simple on/off) sufficient, or is real stock-count tracking needed? | Affects whether an inventory module is needed | `products.is_available` boolean only; no stock table |
| Q11 | Chicken reservation rules — lead time, cutoff, confirmation method, cancellation | Chicken is explicitly reservation-based | `products.requires_reservation` flag exists as a marker; no reservation workflow/UI built |
| Q12 | Brand colors, logo, and visual reference assets | Needed for real visual design pass, not just functional UI | Blocks the visual (not functional) part of Phase 4/11 |
| Q13 | Bilingual scope: is English a "nice to have" or a launch requirement? | Affects how much English content must exist at launch | Architecture supports both regardless; affects content workload, not code |

### Added by the Phase 0 architecture audit

| # | Question | Why it matters | Where it plugs in |
|---|---|---|---|
| Q14 | Can a customer cancel their own order themselves, and up to which status (e.g., only while `PENDING`)? | Currently only `is_admin()` can change `orders.status` via `update_order_status`; without an answer, a customer who wants to cancel must contact the business directly | Would be added as a second, narrower entry point into `update_order_status` (or a dedicated `cancel_own_order` function) once confirmed — the trusted-function boundary (D18) already accommodates this without a redesign |
| Q15 | Do delivery time slots need to vary by zone or by day, or is one global slot list (as in the spec's illustrative example) correct for V1? | Affects whether `delivery_time_slots` needs a join to zones/days or stays a flat admin-managed list | Implemented as a flat global list for V1 per the spec's own framing ("these are examples only," not "these vary by zone"); revisit if the business says otherwise |
| Q16 | Does each delivery time slot need a maximum order capacity, to avoid overbooking a given window? | Spec §5 says admin must be able to "define availability" for slots, which could mean just active/inactive or could mean a capacity limit | Not built — `delivery_time_slots.is_active` covers simple on/off; a capacity column/check would be a small addition if confirmed, not a redesign |

## C. How to Resolve an Open Decision

When the business confirms an answer:
1. Update this file — move the item from §B to §A with the confirmed value and rationale.
2. Implement it as **configuration/data**, not a hardcoded rule, unless it is a one-time structural fact (e.g., a fixed enum value already agreed in the spec).
3. Note the change in `TODO.md` under the relevant phase.
