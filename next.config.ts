import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  experimental: {
    // Needed because this app has multiple root layouts (app/[locale] and
    // app/admin) plus a root layout under a dynamic segment ([locale]) --
    // Next's own docs identify this combination as exactly the case a
    // nested not-found.tsx can't handle for generic unmatched routes. See
    // app/global-not-found.tsx.
    globalNotFound: true,
  },
  images: {
    // Product/category/banner images are served from the real Supabase
    // project's Storage bucket (see supabase/migrations/0012_storage.sql).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yvmfzvsahjfjxymnjxzk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  turbopack: {
    // Pinned explicitly: this project sits inside a Desktop folder that
    // also contains an unrelated project with its own package-lock.json,
    // which otherwise makes Next.js infer the wrong workspace root.
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
