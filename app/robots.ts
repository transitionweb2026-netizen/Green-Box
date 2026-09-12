import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://greenbox.example";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/*/account", "/*/checkout", "/*/cart"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
