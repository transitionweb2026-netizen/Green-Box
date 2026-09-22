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
    serverActions: {
      // Next's own default is 1MB. Every image upload in this app (product
      // photos, category/banner/recipe images) goes through a Server
      // Action, and lib/services/storage.ts's own validation already caps
      // uploads at 5MB -- without raising this, Next itself was silently
      // rejecting any upload over 1MB before that 5MB check (or the admin
      // action's own try/catch) ever ran, which is exactly why real
      // product photos (routinely 1-5MB) kept failing. Set comfortably
      // above 5MB to leave room for multipart/form-data overhead.
      bodySizeLimit: "8mb",
    },
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
      {
        // Temporary professional placeholder imagery until real product/
        // banner photography is uploaded through the CMS media library --
        // see lib/media/placeholders.ts, the single place these are
        // referenced from.
        protocol: "https",
        hostname: "loremflickr.com",
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
