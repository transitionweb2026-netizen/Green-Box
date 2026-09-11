# Green Box — Development Roadmap

Each phase follows the same closing checklist (from [PROJECT_SPEC.md](PROJECT_SPEC.md) §22 / project rules):
run the app → check TypeScript → check lint → check migrations apply → verify RLS behavior → check responsive behavior → review against `PROJECT_SPEC.md` → fix issues found → update `TODO.md` and docs. A phase is not complete until this checklist passes, not merely when code compiles.

Status legend: ✅ done · 🔜 next · ⏳ pending · 🧊 blocked on business decision

---

## Phase 0 — Requirements & Architecture ✅ (this phase)
- [x] Inspect repository (empty, greenfield) and environment
- [x] `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `DATABASE.md`, `ROADMAP.md`, `DECISIONS.md`, `TODO.md`
- [x] Architectural decisions requiring upfront judgment: payment abstraction, boxes-as-products, subscriptions-as-data-only, search approach
- **Exit criteria:** user has reviewed and approved this plan before any code is written.

## Phase 1 — Project Foundation ✅ done
- [x] `create-next-app` (TypeScript, App Router, Tailwind) inside `GREEN BOX` — landed on Next 16.3.5 / React 19.2.8 / Tailwind 4
- [x] `git init` + initial commit
- [x] Install `@supabase/supabase-js`, `@supabase/ssr`, `next-intl`, `zod`
- [x] `.env.local` / `.env.local.example` scaffolding (placeholder Supabase credentials, no secrets committed)
- [x] `next-intl` routing: `ar` (default) + `en`, message catalogs scaffolded — storefront only, `app/admin` deliberately excluded
- [x] Base layout, RTL (`dir`/`lang` per locale), design-system primitives (Button, Input, Label, Card, FormMessage)
- [x] `loading.tsx` / `error.tsx` conventions, plus `not-found.tsx` and `global-not-found.tsx` (the latter required by this app's multiple-root-layout shape, per Next.js 16 docs)
- [x] Supabase project client helpers wired (URL + anon key via env, service-role key untouched by application code per [ARCHITECTURE.md](ARCHITECTURE.md) — real credentials still pending from the user)
- [x] Auth foundation: login/register pages wired to Supabase Auth via Server Actions (no protected data yet)
- **Exit criteria:** ✅ app runs locally with no TS/lint errors, locale switch + RTL works, a user gets a graceful (not crashed) error on invalid login credentials against the placeholder project — verified with `npm run build`/`lint` and a Playwright pass against the running dev server (screenshots reviewed). Two real bugs found during that verification (an invalid `"use server"` export, a Turbopack workspace-root ambiguity) were fixed, not just noted — see `TODO.md`.

## Phase 2 — Database & Security ⏳
- [ ] Implement schema from [DATABASE.md](DATABASE.md) as ordered migrations
- [ ] Implement `normalize_arabic()` and the `create_order` / `update_order_status` / `record_payment_verification` trusted functions ([DATABASE.md](DATABASE.md) §3, §7)
- [ ] Enable RLS on every table; implement `is_admin()` and all policies; explicitly confirm no `INSERT`/`UPDATE` grant exists for `authenticated` on `orders`/`order_items`/`payments`/`loyalty_accounts`/`loyalty_transactions`
- [ ] `handle_new_user` trigger → auto-create `profiles` row with denormalized `email`; `REVOKE UPDATE (role)` from `authenticated` + defense-in-depth trigger
- [ ] Address `is_default` single-default trigger; `box_items` no-nested-boxes trigger
- [ ] Seed structural data only (categories, payment methods, loyalty defaults) per DATABASE.md §10
- [ ] Manually provision the first admin account (one-time SQL, no self-service path — [ARCHITECTURE.md](ARCHITECTURE.md) §3)
- [ ] Generate TypeScript types from the live schema
- [ ] Security test pass: second test user cannot read/write another user's addresses/orders/loyalty/subscriptions, **and** a direct attempt to `INSERT` a forged-price `order_item` or a self-granted `loyalty_transactions` row is rejected as a privilege error, not just filtered by a policy
- **Exit criteria:** migrations apply cleanly from empty, RLS + trusted-function boundary verified with real tests, types generated and used.

## Phase 3 — Admin Dashboard ⏳
- [ ] Admin shell/layout + `requireAdmin()` route protection
- [ ] Dashboard (key metrics from real data)
- [ ] Orders (list, detail, status update + history)
- [ ] Products (CRUD, images, availability, featured, box contents editor)
- [ ] Categories (CRUD, reorder, activate/deactivate)
- [ ] Customers (list/detail, read-only initially)
- [ ] Delivery Zones (CRUD) and Delivery Areas (CRUD, assign to a zone)
- [ ] Delivery Time Slots (CRUD, reorder)
- [ ] Payment settings (edit method details/instructions, activate/deactivate)
- [ ] Loyalty settings (edit formula, enable/disable)
- [ ] Subscriptions (read/list only — no automation yet)
- [ ] Content/CMS (banners, store settings)
- **Exit criteria:** every admin screen reads/writes real Supabase data; no mock data remains anywhere.

## Phase 4 — Customer Store ⏳
- [ ] Home page (featured products, categories, banners — real data)
- [ ] Category listing (paginated)
- [ ] Product detail page (incl. structured data, SEO metadata)
- [ ] Search + suggestions (Postgres FTS/trigram per ARCHITECTURE.md §7)
- [ ] Responsive navigation (mobile-first)
- **Exit criteria:** a visitor can browse the full catalog from real data, in Arabic and English, on mobile and desktop.
- 🧊 **Blocked partially on:** final brand colors/visual references for full visual polish (functional UI can proceed with a neutral placeholder theme).

## Phase 5 — Cart ⏳
- [ ] Add to cart / adjust quantity / remove
- [ ] Order notes
- [ ] Totals calculation (live pricing)
- [ ] Cart persistence for logged-in users
- [ ] Edge cases: product removed/deactivated while in cart, price changed while in cart, quantity limits
- **Exit criteria:** cart behaves correctly across refresh, login/logout, and catalog changes.

## Phase 6 — Checkout ⏳
- [ ] Address selection + inline creation, picking a served area from `delivery_areas` (structural zone validation, not fuzzy matching — [DATABASE.md](DATABASE.md) §2)
- [ ] Delivery time slot selection
- [ ] Payment method selection (Vodafone Cash, InstaPay only)
- [ ] Order notes, order review screen
- [ ] Order creation exclusively via the `create_order` trusted function — no direct client insert into `orders`/`order_items` ([DATABASE.md](DATABASE.md) §7)
- **Exit criteria:** a full checkout produces a correctly snapshotted order; no card payment option present anywhere; attempting to bypass `create_order` with a direct table write is rejected.
- 🧊 **Blocked partially on:** actual delivery area list/zone fees and time slot hours (admin will enter via Phase 3 tools before real launch; checkout works structurally without them).

## Phase 7 — Orders & Tracking ⏳
- [ ] Customer order history + detail
- [ ] Visual tracking timeline from `order_status_history`
- [ ] Admin status updates (writes history)
- [ ] Full lifecycle test: PENDING → ... → DELIVERED, and the CANCELLED path
- **Exit criteria:** status changes in admin are immediately reflected in the customer tracking view, with full history retained.

## Phase 8 — Loyalty ⏳
- [ ] Earn points via `update_order_status` on transition to `DELIVERED` only, never at order creation ([DATABASE.md](DATABASE.md) §6)
- [ ] Redeem points via `create_order` at checkout (respecting `min_redeemable_points`)
- [ ] Reverse redeemed points via `update_order_status` on transition to `CANCELLED`
- [ ] Transaction history UI (customer) + configuration UI (admin, already scaffolded in Phase 3)
- **Exit criteria:** points balance always reconciles with the sum of its transactions — including after a redeem-then-cancel sequence; formula changes in admin affect new orders only, never past ones.

## Phase 9 — Subscriptions 🧊 (blocked on business rules)
- [ ] Confirm renewal, payment, pause/skip, cancellation, and refund rules with the business (tracked in [DECISIONS.md](DECISIONS.md))
- [ ] Only after confirmation: implement the corresponding automation/UI on top of the Phase-0-designed schema
- **Exit criteria:** none until rules are confirmed; do not start implementation before then.

## Phase 10 — Advanced Search ⏳
- [ ] Tune ranking (weights, Arabic normalization edge cases)
- [ ] Expand typo tolerance coverage
- [ ] Category-aware and synonym-aware matching if needed
- **Exit criteria:** search quality validated against a real product catalog, not just seed data.

## Phase 11 — Polish ⏳
- [ ] UI consistency pass, RTL audit, accessibility audit, responsiveness audit
- [ ] Loading/error/empty states audit across all screens
- [ ] SEO audit (sitemap, robots.txt, structured data, metadata coverage)
- [ ] Performance audit (image optimization, query/index review, bundle size)
- **Exit criteria:** issues found are fixed, not just listed.

## Phase 12 — Production Audit ⏳
- [ ] Full security review: auth, authorization, RLS, server actions, env vars, secrets
- [ ] Business-logic review: payments, orders, loyalty calculations, cart, checkout
- [ ] Mobile pass, SEO pass, performance pass, accessibility pass, error handling pass
- **Exit criteria:** every discovered issue is fixed before calling the project production-ready; this phase produces fixes, not just a report.

---

## Notes on Ordering

- Phase 4 (storefront) depends on Phase 2 (schema) and benefits from Phase 3 (admin) existing first, since there is no catalog to browse without an admin able to create products/categories — Phase 3 is intentionally before Phase 4.
- Phase 9 is the only phase with a hard external blocker (business decisions). All other phases can proceed once their prerequisite phase is approved.
