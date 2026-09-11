# Green Box — TODO

Living task list. Update at the end of every phase per [ROADMAP.md](ROADMAP.md). Only Phase 0 and the immediate next steps are broken into fine detail; later phases are detailed when they start (see `ROADMAP.md` for their checklists).

## Current Phase: 0 — Requirements & Architecture

- [x] Inspect `GREEN BOX` folder — confirmed empty, greenfield, not a git repo
- [x] Inspect environment (Node v26.3.1, npm 11.16, git 2.45.1 available; confirmed working Next 16.2.10/React 19.2.4/Tailwind 4/next-intl 4.13.1/supabase-js 2.110.1 versions on this machine via an unrelated project, for stack-version reference only)
- [x] Write `PROJECT_SPEC.md`
- [x] Write `ARCHITECTURE.md`
- [x] Write `DATABASE.md`
- [x] Write `ROADMAP.md`
- [x] Write `DECISIONS.md`
- [x] Write this `TODO.md`
- [ ] **Waiting on user approval before starting Phase 1** — do not scaffold the app until approved

## Next Up: Phase 1 — Project Foundation (not started)

- [ ] Confirm with user: proceed with Next 16.x / React 19.x / Tailwind 4 / next-intl, or pin different versions?
- [ ] `create-next-app` inside `GREEN BOX` (TypeScript, App Router, Tailwind, ESLint)
- [ ] `git init`, initial commit
- [ ] Install Supabase client libs, `next-intl`, `zod`
- [ ] Supabase project: obtain URL + anon key (+ service role, server-only) from user, wire into `.env.local`
- [ ] `next-intl` routing scaffold under `app/[locale]/` (`ar` default, `en`) for the **storefront only**; `app/admin/` stays outside the locale segment (single-language — [ARCHITECTURE.md](ARCHITECTURE.md) §2/§8)
- [ ] Base layout + RTL handling + minimal design-system primitives
- [ ] `loading.tsx`/`error.tsx` conventions
- [ ] Auth pages (login/register) wired to Supabase Auth, no protected data yet
- [ ] Run: `next build`/`dev`, `tsc --noEmit`, `eslint` — all clean

## Note: Phase 2 will additionally require (see updated ROADMAP.md)
- [ ] The `create_order` / `update_order_status` / `record_payment_verification` trusted functions and the `normalize_arabic()` helper — not just tables/RLS
- [ ] Manually provisioning the first admin account (no self-service path exists by design)

## Blocked / Needs Business Input Before Later Phases

See [DECISIONS.md](DECISIONS.md) §B for the full list. Highlights that will block real (not just structural) usage of specific phases:
- Delivery zones + fees + minimum order (blocks real checkout use — Phase 6)
- Real delivery time slot hours (blocks real checkout use — Phase 6)
- Payment confirmation workflow (reference/screenshot/manual/auto) (Phase 6)
- Subscription business rules (blocks Phase 9 entirely)
- Chicken reservation workflow details (Phase 4/6 functional completeness for that category)
- Brand colors/logo/visual references (blocks visual polish — Phase 4/11, not functional build)

## Documentation Maintenance

- [ ] Re-read `PROJECT_SPEC.md` against the implementation at the end of every phase (project rule)
- [ ] Keep `DECISIONS.md` in sync the moment any open question is answered
- [ ] Keep this file's "Current Phase" section pointed at the actual in-progress phase
