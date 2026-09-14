import { headers } from "next/headers";

/**
 * Absolute site origin derived from the live request when available (works
 * correctly in any environment without extra configuration), falling back
 * to NEXT_PUBLIC_SITE_URL for contexts with no request (sitemap.ts/robots.ts
 * can be statically evaluated at build time with no live request).
 */
export async function getSiteOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() throws outside a request scope (e.g. static generation) --
    // fall through to the env var below.
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://greenbox.example";
}
