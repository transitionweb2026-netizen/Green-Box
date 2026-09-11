# Green Box

Arabic-first fresh food / grocery e-commerce platform. Built in phases -- see
[PROJECT_SPEC.md](PROJECT_SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md),
[DATABASE.md](DATABASE.md), [ROADMAP.md](ROADMAP.md), [DECISIONS.md](DECISIONS.md),
and [TODO.md](TODO.md) for the full plan, current phase, and open questions.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in real Supabase credentials when available
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) -- it redirects to the
default locale (`/ar`). The admin dashboard lives at
[http://localhost:3000/admin](http://localhost:3000/admin) and is not
localized (see ARCHITECTURE.md, Internationalization).

## Structure

- `app/[locale]/...` -- bilingual (`ar`/`en`) storefront, routed via `next-intl`.
- `app/admin/...` -- single-language admin dashboard, outside the locale segment.
- `lib/` -- Supabase clients, validation schemas, business-logic services.
- `components/ui/` -- shared design-system primitives; `components/storefront/`
  -- storefront-specific composites.
- `i18n/`, `messages/` -- `next-intl` routing config and translation catalogs.

## Status

Phase 1 (project foundation) -- see [TODO.md](TODO.md) for what's done and
what's next. Supabase credentials are placeholders until a real project is
connected; no database tables exist yet (Phase 2).

## Checks

```bash
npm run lint
npm run build   # also type-checks the whole project
```
