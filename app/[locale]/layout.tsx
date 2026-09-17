import type { Metadata } from "next";
import { Cairo, Playfair_Display } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getSiteOrigin } from "@/lib/seo/site-url";
import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import "../globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

// Latin-only -- used solely for the Contact page's hero headline (see
// globals.css --font-serif); every other heading on the site stays on
// Cairo so bilingual pages don't mix type systems.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  const locale = await getLocale();
  const origin = await getSiteOrigin();
  const siteName = t("siteName");
  const tagline = t("tagline");

  return {
    metadataBase: new URL(origin),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: tagline,
    openGraph: {
      siteName,
      title: siteName,
      description: tagline,
      locale: locale === "ar" ? "ar_EG" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: siteName,
      description: tagline,
    },
  };
}

/**
 * Root layout for the storefront (`/[locale]/...`). The admin dashboard has
 * its own separate root layout (app/admin/layout.tsx) -- Next.js supports
 * multiple root layouts when neither has a layout.tsx above it, which is
 * exactly the split ARCHITECTURE.md calls for (localized storefront vs.
 * single-language admin). See that file's "Internationalization" section.
 */
export default async function LocaleLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${cairo.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="bg-surface-gradient flex min-h-full flex-col font-sans text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
