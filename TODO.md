# Green Box — TODO

Living task list. Update at the end of every phase per [ROADMAP.md](ROADMAP.md). Only the current/most recent phase is broken into fine detail; later phases are detailed when they start (see `ROADMAP.md` for their checklists).

## Phase 0 — Requirements & Architecture ✅ done

- [x] Inspect `GREEN BOX` folder, environment, and stack versions
- [x] Write `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `DATABASE.md`, `ROADMAP.md`, `DECISIONS.md`, `TODO.md`
- [x] Senior-architect audit pass (security, RLS, relationships, over-engineering, Arabic/English, loyalty, subscriptions, delivery, payments, admin usability) — findings D17–D23 in `DECISIONS.md`, docs revised accordingly
- [x] User approval to proceed to Phase 1

## Phase 1 — Project Foundation ✅ done

- [x] Scaffolded Next.js 16.3.5 / React 19.2.8 / TypeScript / Tailwind 4 (via `create-next-app` in an isolated staging dir, merged into `GREEN BOX` to avoid conflicting with the Phase 0 docs already there)
- [x] Installed `@supabase/supabase-js`, `@supabase/ssr`, `next-intl` 4.14.4, `zod` 4.6.2
- [x] `.env.local` / `.env.local.example` with placeholder Supabase credentials (real ones pending from user)
- [x] Route structure: `app/[locale]/...` (bilingual storefront, `next-intl`) and `app/admin/...` (single-language, outside the locale segment) as two separate Next.js root layouts
- [x] RTL: `dir`/`lang` set per locale on `<html>`, Cairo font (Arabic + Latin), Tailwind logical-property usage
- [x] Design-system primitives: `Button`/`buttonVariants`, `Input`, `Label`, `Card`, `FormMessage`
- [x] `loading.tsx` / `error.tsx` per route tree; `not-found.tsx` (segment-level) + `global-not-found.tsx` (app-wide — required because this app has multiple root layouts *and* a root layout under a dynamic segment, which Next.js docs identify as exactly the case a nested `not-found.tsx` can't handle alone)
- [x] Supabase client helpers (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- [x] Login/register pages: Server Actions (`app/[locale]/auth/actions.ts`) + zod validation (`lib/validation/auth.ts`) + `useActionState` forms
- [x] `proxy.ts` for locale routing (Next.js 16 renamed `middleware.ts` → `proxy.ts`; matcher excludes `/admin`, `/api`)
- [x] `git init` + initial commit
- [x] Validation: `npm run lint` clean, `npm run build` clean (TS + build), dev server driven with Playwright (screenshots reviewed) — see findings below

### Bugs found and fixed during Phase 1 verification (not just "it compiled")
- **`actions.ts` exported plain objects from a `"use server"` file** (`initialLoginState`/`initialRegisterState` alongside the action functions) — Next.js requires a `"use server"` file to export only async functions; this caused a runtime module-evaluation error visible in the browser console (not caught by `next build`). Fixed by moving the state constants/types to `app/[locale]/auth/auth-state.ts`.
- **Turbopack workspace-root ambiguity**: this project sits inside a Desktop folder containing an unrelated project with its own `package-lock.json`; Next.js inferred the wrong root. Fixed by pinning `turbopack.root` in `next.config.ts`.
- Confirmed via Playwright that a genuine app bug (the above) is distinct from a test-script race condition (using `waitForLoadState("networkidle")` instead of `waitForURL` to observe an SPA client-side navigation) — the language switcher itself was never broken.

### Explicitly deferred to later phases (not gaps — intentional scope boundaries)
- No session-refresh/role-gating logic in `proxy.ts` yet for `/admin` — depends on `profiles.role` + `is_admin()`, which don't exist until Phase 2; real protection is a named Phase 3 task (`requireAdmin()`).
- No `/account` pages yet (order history, addresses, etc.) — those need the database (Phase 2+).

## Next Up: Phase 2 — Database & Security (not started)

- [ ] Implement schema from `DATABASE.md` as ordered migrations
- [ ] `normalize_arabic()` + the `create_order` / `update_order_status` / `record_payment_verification` trusted `SECURITY DEFINER` functions (not just tables/RLS)
- [ ] Enable RLS everywhere; verify no `INSERT`/`UPDATE` grant exists for `authenticated` on `orders`/`order_items`/`payments`/`loyalty_accounts`/`loyalty_transactions`
- [ ] `handle_new_user` trigger (auto-create `profiles` row incl. denormalized `email`); `REVOKE UPDATE (role)` from `authenticated`
- [ ] Seed structural data only (6 categories, 2 payment methods, loyalty defaults)
- [ ] Manually provision the first admin account (no self-service path exists by design)
- [ ] Generate TypeScript types from the live schema
- [ ] Security test pass: second test account can't read/write another account's data; a forged-price `order_item` insert is rejected as a privilege error
- [ ] Get real Supabase project credentials from the user to replace the placeholders in `.env.local`

## Blocked / Needs Business Input Before Later Phases

See [DECISIONS.md](DECISIONS.md) §B for the full list. Highlights that will block real (not just structural) usage of specific phases:
- Delivery zones/areas + fees + minimum order (blocks real checkout use — Phase 6)
- Real delivery time slot hours (blocks real checkout use — Phase 6)
- Payment confirmation workflow (reference/screenshot/manual/auto) (Phase 6)
- Subscription business rules (blocks Phase 9 entirely)
- Chicken reservation workflow details (Phase 4/6 functional completeness for that category)
- Brand colors/logo/visual references (blocks visual polish — Phase 4/11, not functional build)

## Documentation Maintenance

- [ ] Re-read `PROJECT_SPEC.md` against the implementation at the end of every phase (project rule)
- [ ] Keep `DECISIONS.md` in sync the moment any open question is answered
- [ ] Keep this file's "Current Phase" section pointed at the actual in-progress phase
