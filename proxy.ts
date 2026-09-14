import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Locale routing for the storefront only. The matcher below excludes
 * /admin and /api so this proxy (formerly "middleware" -- renamed in
 * Next.js 16, see node_modules/next/dist/docs file-conventions/proxy.md)
 * never touches those trees.
 *
 * /admin route protection (requireAdmin() + is_admin() RLS policies) has
 * existed since Phase 2 and lives in app/admin/(dashboard)/layout.tsx and
 * the database layer, not here -- this proxy still excludes /admin from
 * its matcher on purpose, since /admin is single-locale and doesn't need
 * next-intl's locale routing at all.
 */
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
