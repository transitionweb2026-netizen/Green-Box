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
 * Dashboard). This is a sibling root layout to app/[locale]/layout.tsx.
 *
 * Deliberately minimal (no header/nav, no auth check): /admin/login must
 * render under this same root layout without being redirected by the
 * auth gate, which lives one level down in app/admin/(dashboard)/layout.tsx
 * instead -- that route group covers every admin page except login.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-50 font-sans text-foreground">{children}</body>
    </html>
  );
}
