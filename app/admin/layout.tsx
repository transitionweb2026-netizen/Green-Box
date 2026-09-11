import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "../globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "لوحة تحكم جرين بوكس",
  description: "لوحة تحكم إدارة متجر جرين بوكس",
};

/**
 * Separate root layout for /admin -- single-language (Arabic), not routed
 * through next-intl (see ARCHITECTURE.md, Internationalization / Admin
 * Dashboard). This is a sibling root layout to app/[locale]/layout.tsx:
 * Next.js supports multiple root layouts as long as neither has a
 * layout.tsx above it, which is exactly this split.
 *
 * No auth/role gate yet -- requireAdmin() route protection is a Phase 3
 * task once profiles.role and is_admin() exist (see ROADMAP.md, TODO.md).
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 font-sans text-foreground">
        <header className="border-b border-border bg-background">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
            <span className="text-lg font-bold text-brand-700">
              جرين بوكس · الإدارة
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
