import type { Metadata } from "next";
import { Baloo_2, Cairo, Caveat, Playfair_Display } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getSiteOrigin } from "@/lib/seo/site-url";
import { getSetting, type StoreInfo } from "@/lib/services/content";
import { pickStrictLocalized } from "@/lib/i18n/localized";
import { SiteHeader } from "@/components/storefront/site-header";
import { PageHeroBanner } from "@/components/storefront/page-hero-banner";
import { FaqSection } from "@/components/storefront/faq-section";
import { TermsSection } from "@/components/storefront/terms-section";
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
  weight: ["700", "800", "900"],
});

// Latin-only -- used solely for the hero's rotated "sticker" tag (a bold,
// rounded display face matching that badge's reference design), never for
// running text.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["700", "800"],
});

// Latin-only -- the casual bold script accent on the homepage hero headline
// ("reimagined."). Arabic falls back to Cairo like the other display faces.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
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
  const [t, storeInfo] = await Promise.all([getTranslations("common"), getSetting<StoreInfo>("store_info")]);
  const siteName = pickStrictLocalized(storeInfo?.store_name_ar, storeInfo?.store_name_en, locale, t("siteName"));

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${cairo.variable} ${playfair.variable} ${baloo.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="bg-background flex min-h-full flex-col font-sans text-foreground">
        <div className="site-atmosphere" aria-hidden="true" />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteHeader />
          <PageHeroBanner locale={locale} siteName={siteName} />
          <main className="flex-1">{children}</main>
          <FaqSection />
          <TermsSection />
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
