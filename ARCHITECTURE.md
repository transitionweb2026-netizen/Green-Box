# Green Box — Architecture

Companion to [PROJECT_SPEC.md](PROJECT_SPEC.md) (what) and [DATABASE.md](DATABASE.md) (data model). This document covers stack, layering, and the specific architectural decisions the spec asked us to make deliberately (payments, boxes, subscriptions, search, bilingual, admin).

> **Revision note:** this version incorporates a Phase 0 architecture audit. Key changes from the first draft: admin routes are no longer locale-prefixed (§2), mutations touching money or loyalty points go through trusted database functions instead of direct client writes (§3), the payment abstraction accounts for retryable payment attempts (§4), search adds Arabic-specific normalization (§7), and bilingual content now has an explicit fallback rule (§8). Full rationale for each change is in [DECISIONS.md](DECISIONS.md) D17–D23.

## 1. Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | SSR/RSC for performance + SEO, file-system routing fits route-group split between customer/admin, mature Supabase integration |
| Language | TypeScript (strict) | Type safety across DB → server actions → UI |
| Styling | Tailwind CSS | Fast, consistent, RTL-friendly via logical properties |
| i18n | `next-intl` | Locale-prefixed routing (`/ar`, `/en`), message catalogs, RTL-aware, avoids duplicating components per language |
| Backend/DB | Supabase (PostgreSQL) | Managed Postgres + Auth + Storage + Row Level Security in one platform, matches the mandated stack |
| Auth | Supabase Auth | Email/password (+ optional phone/OTP later) with RLS-integrated `auth.uid()` |
| File storage | Supabase Storage | Product/category/banner images, public read buckets with admin-only write policies |
| Validation | `zod` | Shared schemas for server action input validation |
| Rich text (admin content) | plain fields first; evaluate a lightweight editor only if Content/CMS phase needs it | Avoid pulling in editor tooling before there's a confirmed need |

**Version note:** this machine already runs Next 16.2.10 / React 19.2.4 / Tailwind CSS 4 / next-intl 4.13.1 / `@supabase/supabase-js` 2.110.1 / TypeScript 5 cleanly (verified against an unrelated existing project on the same Desktop, Node v26.3.1). Phase 1 will pin Green Box to these same major versions to minimize first-run friction, re-verifying exact latest patch versions at setup time.

**Operational rule:** because the installed Next.js major version is new enough to diverge from training data, check `node_modules/next/dist/docs/` for the relevant API before writing routing/data-fetching/caching code that looks unfamiliar or errors unexpectedly (inherited instruction from the workstation-level `AGENTS.md`).

## 2. Layered Structure

Storefront and admin are deliberately split at the **routing root**, not just by route group, because they have different i18n needs (§8): the storefront is bilingual and locale-prefixed; the admin dashboard is operated by staff in one language and does not need `next-intl`'s routing machinery at all. Sharing one Next.js app (not two deployables) still holds — they share `lib/`, `components/ui`, and the Supabase project.

```
app/
  [locale]/                      # next-intl locale segment: ar (default) | en — storefront only
    page.tsx                     # home
    c/[categorySlug]/            # category listing
    p/[productSlug]/             # product detail
    search/
    cart/
    checkout/
    account/
      orders/[orderId]/
      addresses/
      loyalty/
      subscriptions/
    auth/ (login, register, ...)
  admin/                          # NOT under [locale] — single-language, staff-only
    dashboard/
    orders/
    customers/
    products/
    categories/
    boxes/
    delivery-zones/
    delivery-areas/
    delivery-slots/
    payments/
    loyalty/
    subscriptions/
    content/
    settings/
  api/                            # route handlers only where a Server Action doesn't fit (e.g. search suggestions GET, webhooks later)
components/
  ui/                             # generic design-system primitives (Button, Input, Card, Badge, Timeline...)
  storefront/                     # customer-facing composite components
  admin/                          # admin composite components
lib/
  supabase/                       # server client, browser client, proxy (route-boundary) client
  auth/                           # session + role helpers (getCurrentUser, requireAdmin, ...)
  validation/                     # zod schemas per domain
  services/                       # business logic per domain, framework-agnostic where possible
    catalog/ (categories, products, boxes)
    cart/
    checkout/
    orders/
    payments/                     # provider abstraction, see §4
    loyalty/
    subscriptions/
    delivery/
    search/
  utils/
i18n/
  routing.ts, request.ts          # next-intl config
messages/
  ar.json, en.json
types/
  database.ts                     # generated Supabase types
supabase/
  migrations/
  seed.sql
```

**Rule of thumb:** Server Components + Server Actions call into `lib/services/*`, never talk to Supabase directly from a page/component. Components stay presentational; validation and business rules live in `lib/services` and `lib/validation`, so admin and customer surfaces that touch the same domain (e.g., products) share one implementation.

## 3. Authentication, Authorization & Trusted Mutations

- Supabase Auth issues sessions; `profiles` table (1:1 with `auth.users`) carries `role` (`customer` | `admin`) plus display data (including a denormalized `email` — see [DATABASE.md](DATABASE.md) §2, needed because `auth.users` isn't safely queryable by the app under RLS).
- `proxy.ts` (Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts` -- same mechanism, new name) reads the session on every request to: (a) resolve/redirect locale for `/[locale]/**` (storefront only), (b) protect `/admin/**` by checking `role = admin` server-side, (c) protect `/[locale]/account/**` by requiring a session.
- Proxy/route protection is **defense in depth only** — the actual authorization boundary is Postgres RLS (see [DATABASE.md](DATABASE.md) §8), so a bug in a route guard can never expose another user's row.
- **Money and loyalty points never go through a plain client-authenticated table write.** The Phase 0 audit found that a naive RLS policy ("customer can insert an order row where `profile_id = auth.uid()`") does not stop the client from also supplying an arbitrary `unit_price` on the order's line items — RLS constrains *which rows*, not *which values*. Instead, `orders`, `order_items`, `payments`, `loyalty_accounts`, and `loyalty_transactions` have no direct `INSERT`/`UPDATE` grant for authenticated users at all; every mutation goes through one of the narrow `SECURITY DEFINER` Postgres functions defined in [DATABASE.md](DATABASE.md) §7 (`create_order`, `update_order_status`, `record_payment_verification`), each of which recomputes prices/points from live data and is scoped to exactly one task.
- This also means the Supabase **service-role key is not used in application code at all** for these flows — a scoped `SECURITY DEFINER` database function is a much smaller blast radius than a service-role client that bypasses RLS on every table. The service-role key is reserved for genuine infrastructure needs only (e.g., one-off admin/migration scripts), never imported into request-handling code.
- `lib/services/orders`, `lib/services/loyalty`, and `lib/services/payments` are thin wrappers that call these Postgres functions via RPC (`supabase.rpc(...)`) — the business logic lives in the database function, not duplicated in TypeScript, so there is exactly one place that computes an order total.
- **First admin bootstrap:** there is no self-service path to becoming an admin anywhere in the product. The first admin account is created by directly setting `role = 'admin'` for a specific user via the Supabase SQL editor as a one-time Phase 2 operational step, not through any application UI.

## 4. Payment Abstraction

Checkout must not hardcode "Vodafone Cash" / "InstaPay" logic into UI flow, since methods, and eventually confirmation workflow, will change.

```
lib/services/payments/
  types.ts        # PaymentMethodDefinition, PaymentSubmissionInput, PaymentVerificationResult
  registry.ts     # maps payment_methods.code -> provider implementation
  providers/
    manual-wallet.ts   # generic "pay to this number, submit a reference" provider used by both Vodafone Cash and InstaPay today
```

- `payment_methods` (DB) holds the admin-editable identity of a method: code, display name (ar/en), instructions, account details (JSON — e.g., wallet number), active flag, ordering, and a `requires_proof` flag.
- Both current methods are simple "manual wallet transfer" methods, so they share one generic provider today (`manual-wallet`) parameterized by DB config — no need for two near-duplicate code paths.
- The checkout flow calls `paymentRegistry.get(method.code)` and renders/collects whatever that provider declares it needs, instead of branching on method name in the UI.
- The `payments` table records amount, status, optional `transaction_reference`, optional `proof_image_url`, and optional verification metadata — all nullable, so the still-undecided confirmation workflow (reference vs. screenshot vs. manual approval vs. automatic) can be turned on later by changing admin configuration/service logic, not the schema or checkout structure.
- **`payments` is 1:N with `orders`, not 1:1** (a Phase 0 audit correction) — a manual wallet transfer can be rejected and resubmitted with a corrected reference, and the schema needs to preserve that history rather than overwrite a single row. `orders.payment_status` remains the one authoritative "current state" field the rest of the app reads; `payments` rows are the attempt log behind it.
- `record_payment_verification` (a trusted database function, [DATABASE.md](DATABASE.md) §7) is the only path that changes a payment's verification status — the admin UI calls it rather than issuing a raw `UPDATE`, so an order's `payment_status` can never fall out of sync with its latest payment attempt.
- Adding a real gateway later = add a new provider module + a new `payment_methods` row; checkout, cart, and order code do not change.

## 5. Green Box Boxes — Architectural Decision

**Options considered:**
1. A fully separate `boxes` + `box domain` parallel to `products` (own listing pages, own cart handling, own admin section).
2. Model a box **as a product** (`products.product_type = 'box'`) with a join table for contents.

**Decision: Option 2.** A box already needs everything a product needs — name (ar/en), description, image(s), price, availability, active state, category, SEO fields, and a place in the cart/order/loyalty pipeline. Duplicating that would duplicate cart logic, order-item logic, pricing/snapshot logic, and search indexing for no benefit. Contents are the only genuinely new concept, modeled as a `box_items` table linking a box product to its constituent products with quantities. The "Green Box Boxes" category already exists in the confirmed category list, so a box is simply a product in that category with `product_type = 'box'` and rows in `box_items`. Admin product screens gain a conditional "Contents" section when `product_type = 'box'`; nothing else in the customer flow needs to know boxes are special.

A box's price is a fixed value set by the admin, not a computed sum of its contents' current prices — this keeps box pricing simple and matches how these are actually sold (a bundle price, not a live aggregate). A database trigger (see the `box_items` entry in [DATABASE.md](DATABASE.md) §2) prevents a box from containing another box, since nothing in the requirements asks for nested bundles and allowing it would force a recursive-resolution problem into cart/order pricing for no requested benefit.

## 6. Subscriptions — Architecture Only

Per [PROJECT_SPEC.md](PROJECT_SPEC.md) §12, renewal, payment timing, pause/skip, cancellation, and refund rules are unconfirmed. Phase 9 will therefore ship only:
- `subscriptions` (who, delivery zone/address/slot/payment method, a generic `status` of `ACTIVE`/`PAUSED`/`CANCELLED`, cadence fields left minimal) and `subscription_items` (product + quantity).
- Admin read/list visibility.
- **No** automated renewal job, no automatic charging, no skip/pause UI logic, and no cancellation/refund workflow — these require business decisions first (tracked in [DECISIONS.md](DECISIONS.md)). Implementing any of them without confirmation would be inventing a business rule, which is explicitly disallowed.
- `orders.subscription_id` (nullable) is added to the schema in Phase 2, before any subscription automation exists, purely so a subscription-generated order is traceable back to its subscription from day one — retrofitting this column after real orders exist would mean an unrecoverable backfill gap for anything created before the column existed.

## 7. Smart Search (V1)

- Postgres `tsvector` generated column on `products`, built with the `simple` text search configuration rather than an English/Arabic-stemming one — Postgres has no bundled Arabic dictionary, so pretending to stem Arabic would silently degrade relevance rather than improve it.
- **Arabic-specific normalization is required for typo tolerance to actually work**, not just full-text + trigram on raw text (a gap found in the Phase 0 audit): a `normalize_arabic()` SQL function strips diacritics/tatweel and unifies common letter variants (أ/إ/آ → ا, ى → ي, ة → ه) before either index is built, so e.g. a search that differs only by one of these variants still matches. See [DATABASE.md](DATABASE.md) §3–4 for the exact implementation.
- A single `lib/services/search` function ranks by a blend of full-text rank and trigram similarity over the normalized text, scoped to visible products/categories (the compound visibility rule in [DATABASE.md](DATABASE.md) §2).
- Suggestions endpoint is a small route handler (`/api/search/suggest`) called with debounce from a client component; result composition (products vs. categories) happens server-side.
- No external search service (e.g., Algolia/Meilisearch/Elasticsearch) or AI ranking in V1 — the service-layer boundary (`lib/services/search`) means one can be introduced later by swapping the implementation behind the same function signature.
- Product listings use keyset (cursor-based) pagination rather than offset pagination once catalogs grow past a page or two — cheap to do from the start, avoids a rewrite when offset pagination starts costing real query time on a large catalog.

## 8. Internationalization (Arabic-first)

- Routes are locale-prefixed for the **storefront only** (`/ar/...` default, `/en/...`); `next-intl` supplies UI-string translation via `messages/ar.json` / `messages/en.json`. The admin dashboard (§2) deliberately sits outside this — it's operated by staff in one language, and forcing every internal admin label through a bilingual message catalog would be effort spent on a requirement that was never asked for (the bilingual requirement in [PROJECT_SPEC.md](PROJECT_SPEC.md) §16 is scoped to "the website," i.e. the customer-facing storefront).
- **Business data** (product names, descriptions, category names, SEO metadata) is not UI-string translation — it's stored as paired DB columns (`name_ar`, `name_en`, etc.) as detailed in [DATABASE.md](DATABASE.md), selected per active locale at query time.
- **Fallback rule (a Phase 0 audit fix — previously unspecified):** when rendering the `en` locale and a bilingual field's `*_en` value is null, fall back to the `*_ar` value rather than rendering blank content. Arabic is the guaranteed baseline since `*_ar` columns are `not null`; English content is added incrementally by the admin without ever producing an empty product name/description on the English site in the meantime.
- RTL is driven by `dir="rtl"` on `<html>` for the `ar` locale plus Tailwind's logical-property utilities (`ms-*`/`me-*`/`ps-*`/`pe-*` instead of `ml-*`/`mr-*`), so components do not need Arabic/English variants — one component tree, direction-aware styling.
- Numbers, prices, and dates are rendered with Western (Arabic numeral) digits in both locales via `next-intl`'s formatting utilities, not the Arabic-Indic digit set — the common convention on Egyptian e-commerce sites and avoids a subtle source of user confusion around prices specifically.

## 9. Admin Dashboard

- Same Next.js app, `/admin` route (outside `[locale]`, §2), gated by proxy.ts + RLS as above — not a separate deployable, to avoid duplicated auth/data-access code.
- Each admin section (`orders`, `products`, `categories`, `boxes`, `delivery-zones`, `delivery-areas`, `delivery-slots`, `payments`, `loyalty`, `subscriptions`, `content`, `settings`) maps 1:1 to a `lib/services/*` domain module and reuses the same validation schemas as any customer-facing mutation touching the same table (e.g., product editing).
- No mock data: every admin list/detail view reads live Supabase data from the first implementation in Phase 3, per [PROJECT_SPEC.md](PROJECT_SPEC.md) §22.
- **Soft delete only, for anything a historical order can reference.** "Delete" in the admin UI for categories, products, delivery zones/areas, delivery time slots, and payment methods sets `is_active = false`; it never issues a hard `DELETE`. This isn't optional polish — `orders`/`order_items` hold live FKs (in addition to their JSON snapshots) back to several of these tables specifically so admin can filter/report by them, and a hard delete would either fail loudly (FK `RESTRICT`, the default per [DATABASE.md](DATABASE.md) §0) or, worse, silently null out that reference. Hard deletion is only ever exposed for a row that genuinely has zero historical references, and is not a Phase 3 priority.
- **Every admin list view** (orders, products, customers, etc.) ships with filtering, sorting, and pagination as a baseline, not an enhancement added later — "powerful but extremely easy to understand" (spec §13) fails quickly on an unfiltered, unpaginated order list once there are more than a few dozen rows.
- Order and payment status changes in the admin UI call the same trusted database functions the rest of the app uses ([DATABASE.md](DATABASE.md) §7) rather than editing `orders`/`payments` rows directly — this guarantees a status-history row and any loyalty side-effect (§6 of DATABASE.md) are never forgotten by a dashboard edit.

## 10. Error/Loading/Empty States

Standard Next.js conventions used consistently: `loading.tsx` (skeletons) and `error.tsx` (recoverable error boundary) per route segment where data fetching occurs, plus shared `components/ui` empty-state and error-state components so admin and storefront look consistent rather than each screen inventing its own.

## 11. Future Extension Points (do not build now, but do not block later)

Kept possible without rework because of the boundaries above:
- New payment providers → new `lib/services/payments/providers/*` + DB row.
- New categories (Herbs & Spices, Local Meat, Supermarket) → pure data, zero code. `categories.parent_id` (added in Phase 2, unused by the current flat 6) means Supermarket can gain subcategories (dairy, snacks, cleaning, ...) without a schema migration when that's needed.
- Coupons/promotions → new domain module + new tables (`coupons`, `order_discounts`), does not touch existing order snapshot logic.
- Notifications (WhatsApp/SMS/email/push) → new `lib/services/notifications` triggered from existing order/status-change points, not a rewrite of order logic.
- Multiple admins / permission tiers → extend `profiles.role` into a proper roles/permissions table when needed; every admin check already goes through one `requireAdmin()` helper, so this is a localized change.
- Multiple branches → `branches` table + `branch_id` FK added to orders/inventory when the business needs it; deferred because inventing branch rules now would be speculative.
