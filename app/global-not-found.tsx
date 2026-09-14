import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import Link from "next/link";
import { Compass } from "lucide-react";
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
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="bg-surface-gradient flex min-h-full flex-col items-center justify-center gap-4 px-4 text-center font-sans text-foreground">
        <div className="glass flex flex-col items-center gap-3 px-8 py-12">
          <div className="bg-brand-gradient flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_-10px_rgba(84,120,41,0.6)]">
            <Compass className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold">الصفحة غير موجودة</h1>
          <p className="max-w-md text-muted">الصفحة اللي بتدوّر عليها مش موجودة أو اتشالت.</p>
          <p className="max-w-md text-sm text-muted" dir="ltr">
            Page not found.
          </p>
          <Link
            href="/"
            className="bg-brand-gradient mt-2 inline-flex h-11 items-center justify-center rounded-xl px-5 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(84,120,41,0.6)] transition-transform hover:-translate-y-0.5"
          >
            الرجوع للرئيسية
          </Link>
        </div>
      </body>
    </html>
  );
}
