# Green Box — TODO

Living task list. Update after significant work per [ROADMAP.md](ROADMAP.md).

## Phase 0 — Requirements & Architecture ✅ done
See git history for detail. Full audit findings in [DECISIONS.md](DECISIONS.md) D17–D23.

## Phase 1 — Project Foundation ✅ done
See git history for detail. Two real bugs found via Playwright verification and fixed (invalid `"use server"` export, Turbopack workspace-root ambiguity).

## Phase 2 — Database & Security ✅ code complete, 🟡 not yet applied to the live project
- [x] Full schema as 12 migration files (`supabase/migrations/0001`–`0012`): all tables, indexes, constraints, RLS policies, triggers, the three trusted `SECURITY DEFINER` functions (`create_order`, `update_order_status`, `record_payment_verification`), smart-search functions, storage bucket + policies
- [x] Tested against a local embedded Postgres (`@electric-sql/pglite`, no Docker needed) with a stub `auth`/`storage` schema: full migration apply, then functional + adversarial tests simulating real client requests via `SET ROLE authenticated` + `auth.uid()`
  - Confirmed: correct order pricing/snapshotting, cart lifecycle, full status progression with illegal stage-skipping rejected, loyalty earn-on-delivered/redeem-at-checkout/reverse-on-cancel, box-nesting prevention, single-default-address enforcement, unconfigured-zone checkout blocking, cross-customer RLS isolation, forged-price and role-self-promotion both rejected with a hard privilege error (not just filtered by policy)
  - Found and fixed 3 real bugs this way: a generated column illegally referencing another generated column, the role-change-prevention trigger blocking the legitimate admin-bootstrap path, and Arabic trigram similarity being diluted by comparing against the full search blob instead of the name alone
- [x] Hand-authored `types/database.ts` (no live DB to run `supabase gen types` against yet) — found and fixed a real, non-obvious bug here too: omitting `Relationships: []` on each table silently breaks insert/update/rpc type inference project-wide while `select()` still looks fine, because `@supabase/postgrest-js`'s `GenericSchema` constraint requires it
- [ ] 🟡 **BLOCKED**: apply these migrations to the real Supabase project. Direct Postgres access from this machine is impossible (confirmed via two independent tests: DNS resolves the direct-connection host to IPv6-only, and a direct connection attempt to that IPv6 address returns `ENETUNREACH` — this network has no IPv6 route at all). The Supabase MCP server is registered (`.mcp.json`) but sits at "pending approval" — approving it requires running `claude` interactively in this project directory (a step only the user can do) and completing Supabase's OAuth login. **Exact next external action**: user runs `claude` in `GREEN BOX`, approves the `supabase` MCP server, completes the OAuth prompt if one appears. Once connected, apply migrations 0001–0012 in order, generate real TypeScript types, and run the RLS/privilege verification checklist below against the live project (not just the local simulation).
- [ ] Manually provision the first admin account once live (no self-service path exists by design)

## Phase 3 — Admin Dashboard ✅ code complete (untested against live data)
Full admin UI built against the tested schema: dashboard overview (stats + recent orders), products (CRUD, multi-image upload, box-contents editor), categories (CRUD), customers (list/detail), orders (list/filter/detail, status control respecting legal transitions, payment verification), delivery zones + areas (CRUD, area-per-zone management), delivery time slots (CRUD), payment methods (edit instructions/account details/active/requires-proof), loyalty (settings form + per-customer balances), subscriptions (read-only list, per architecture), CMS (banners with image upload, store settings). `requireAdmin()` gates every admin page except `/admin/login` via a nested route group layout; the real authorization boundary remains `is_admin()` RLS, per `ARCHITECTURE.md`.

## Phase 4–8 — Customer Storefront, Cart, Checkout, Orders, Loyalty ✅ code complete (untested against live data)
Home (real categories/featured products/banners, honest empty states), category listing + pagination, product detail (gallery, box contents, related products, JSON-LD product schema), smart search (full-text + Arabic-aware trigram typo tolerance, debounced suggestions dropdown), cart (add/update/remove, real-time subtotal from live prices), full checkout (address/slot/payment/notes/loyalty-redemption selection → `create_order()` RPC, nothing client-trusted), order confirmation + detail + visual tracking timeline, account section (profile, addresses CRUD, orders, loyalty balance + ledger, subscriptions).

## Phase 9 — Subscriptions 🧊 architecture + basic CRUD only, by design
Customer can create a subscription from their current cart, view, pause/resume/cancel; admin can view. No automatic weekly order generation, renewal, or payment-on-renewal — those need business rules that are still unconfirmed (see [DECISIONS.md](DECISIONS.md) Q5–Q7). Implementing them now would mean inventing a business rule, which the project's own ground rules explicitly prohibit.

## Phase 10 — Advanced Search ✅ V1 complete
Postgres full-text + Arabic-normalized trigram fallback, ranked, with a debounced suggestions endpoint. Tuning ranking further is a "later, with real usage data" task, not a blocker.

## Cross-cutting status
- **TypeScript**: `npx tsc --noEmit` clean across the entire codebase (service layer, 50+ pages/components, admin + customer).
- **Lint**: `npm run lint` clean.
- **Build**: `npm run build` succeeds — 53 routes (21 customer, 30 admin, 1 API route, sitemap, robots).
- **SEO**: dynamic per-page metadata (category/product), Open Graph on product pages, JSON-LD Product schema, dynamic `sitemap.xml` from live categories/products, `robots.txt`. Not yet done: hreflang alternates, breadcrumb schema, a real production domain (`NEXT_PUBLIC_SITE_URL` is still a placeholder).
- **Not yet done because they need a live database to test against for real**: actual end-to-end flow verification (signup → browse → cart → checkout → order → tracking, in both languages), RLS verification against the real project, storage upload verification, accessibility pass, responsive/visual QA pass, performance audit, production deployment.

## Blocked / Needs Business Input

See [DECISIONS.md](DECISIONS.md) §B for the full list (Q1–Q16). Highlights that block *real* (not structural) usage once the database is live:
- Delivery zones/areas + fees + minimum order — admin enters via the now-built delivery-zones UI
- Real delivery time slot hours — admin enters via the now-built delivery-slots UI
- Payment confirmation workflow specifics (reference vs. screenshot vs. auto) — the schema/UI supports any of these; which one is a business decision
- Subscription renewal/pause/cancel rules — architecture ready, automation intentionally not built
- Brand colors/logo — the UI currently uses a placeholder green palette (see `app/globals.css`)

## Documentation Maintenance
- [ ] Re-read `PROJECT_SPEC.md` against the implementation once live-tested
- [ ] Keep `DECISIONS.md` in sync the moment any open question is answered
- [ ] Regenerate `types/database.ts` from the live schema once connected (see Phase 2)
