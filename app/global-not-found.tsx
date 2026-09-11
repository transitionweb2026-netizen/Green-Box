import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "الصفحة غير موجودة | Green Box",
  description: "الصفحة اللي بتدوّر عليها مش موجودة أو اتشالت.",
};

/**
 * True global 404 for the whole app (both the storefront's [locale] tree
 * and /admin) -- Next.js 16's global-not-found.js convention. A nested
 * not-found.tsx (see app/[locale]/not-found.tsx) only catches an explicit
 * notFound() call within its own segment; it does not catch a generic
 * unmatched route. This app has multiple root layouts plus a root layout
 * under a dynamic segment ([locale]), which Next's own docs identify as
 * exactly the case global-not-found.js exists for.
 *
 * This file bypasses normal app rendering, so it must be fully
 * self-contained (own <html>/<body>, own font/style imports) and can't use
 * next-intl -- single language (Arabic, matching the site default) with a
 * short English line for anyone who lands here from a mistyped English URL.
 */
export default function GlobalNotFound() {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col items-center justify-center gap-3 bg-background px-4 text-center font-sans text-foreground">
        <h1 className="text-2xl font-semibold">الصفحة غير موجودة</h1>
        <p className="max-w-md text-muted">
          الصفحة اللي بتدوّر عليها مش موجودة أو اتشالت.
        </p>
        <p className="max-w-md text-sm text-muted" dir="ltr">
          Page not found.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-4 font-medium text-white hover:bg-brand-700"
        >
          الرجوع للرئيسية
        </Link>
      </body>
    </html>
  );
}
