import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Locale routing for the storefront only. The matcher below excludes
 * /admin and /api so this proxy (formerly "middleware" -- renamed in
 * Next.js 16, see node_modules/next/dist/docs file-conventions/proxy.md)
 * never touches those trees.
 *
 * Session-refresh / role-gating logic for /admin is deliberately not added
 * yet -- it depends on the `profiles` table and `is_admin()` helper, which
 * do not exist until Phase 2 (see ROADMAP.md Phase 3: "Admin shell/layout +
 * requireAdmin() route protection"). Adding it now against placeholder
 * Supabase credentials would either fail open or fail closed for the wrong
 * reason. Tracked in TODO.md.
 */
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
