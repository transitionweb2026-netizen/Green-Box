import type { Metadata } from "next";
import { AppImage as Image } from "@/components/ui/app-image";
import { ArrowLeft, ArrowRight, Leaf, PackageCheck, ShieldCheck, Sparkles, Truck, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { listActiveCategories, listProducts } from "@/lib/services/catalog";
import { listActiveBanners, getSetting, type HomepageContent } from "@/lib/services/content";
import { pickLocalized, pickLocalizedOrDefault } from "@/lib/i18n/localized";
import { placeholderImage } from "@/lib/media/placeholders";
import { getSiteOrigin } from "@/lib/seo/site-url";
import { ProductCard } from "@/components/storefront/product-card";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: "/ar", en: "/en" },
    },
  };
}

export default async function HomePage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const isAr = locale === "ar";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [categories, featured, banners, content] = await Promise.all([
    listActiveCategories(),
    listProducts({ featured: true, pageSize: 8 }),
    listActiveBanners(),
    getSetting<HomepageContent>("homepage_content"),
  ]);

  const cms = (ar?: string, en?: string, fallback?: string) => pickLocalizedOrDefault(ar, en, locale, fallback ?? "");

  const heroBanner = banners[0];
  const heroTitle = heroBanner ? pickLocalized(heroBanner.title_ar ?? "", heroBanner.title_en, locale) : null;

  const origin = await getSiteOrigin();
  const siteName = t("common.siteName");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteName,
      url: `${origin}/${locale}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: `${origin}/${locale}`,
      potentialAction: {
        "@type": "SearchAction",
        target: `${origin}/${locale}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  const trustItems = [
    { icon: Leaf, title: t("home.trustFreshTitle"), description: t("home.trustFreshDescription") },
    { icon: Truck, title: t("home.trustDeliveryTitle"), description: t("home.trustDeliveryDescription") },
    { icon: Wallet, title: t("home.trustPaymentTitle"), description: t("home.trustPaymentDescription") },
    { icon: Sparkles, title: t("home.trustLoyaltyTitle"), description: t("home.trustLoyaltyDescription") },
  ];

  const whyItems = [
    { icon: Leaf, title: t("home.whyFreshnessTitle"), description: t("home.whyFreshnessDescription") },
    { icon: ShieldCheck, title: t("home.whyHygieneTitle"), description: t("home.whyHygieneDescription") },
    { icon: Truck, title: t("home.whySpeedTitle"), description: t("home.whySpeedDescription") },
    { icon: PackageCheck, title: t("home.whySupportTitle"), description: t("home.whySupportDescription") },
  ];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-deep-gradient relative">
          <div className="blob h-96 w-96 bg-brand-500/25 -top-20 -start-20 animate-float-slow" aria-hidden="true" />
          <div className="blob h-72 w-72 bg-deep-300/20 -bottom-10 end-0" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-2 lg:py-28">
            <div className="animate-fade-up">
              <Badge tone="brand" className="bg-white/10 text-brand-300 ring-brand-300/30">
                {heroBanner ? t("common.siteName") : t("home.heroEyebrow")}
              </Badge>
              <h1 className="mt-5 text-3xl leading-tight font-extrabold text-white sm:text-5xl">
                {heroTitle || t("home.heroTitle")}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
                {t("home.heroSubtitle")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={heroBanner?.link_url ?? "/c"} className={buttonVariants({ size: "lg" })}>
                  {t("home.heroCta")}
                  <ArrowIcon className="h-4 w-4" />
                </Link>
                <Link href="/box" className={buttonVariants({ variant: "dark", size: "lg" })}>
                  <Sparkles className="h-4 w-4" />
                  {t("home.heroSecondaryCta")}
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] shadow-2xl lg:aspect-square">
              <Image
                src={heroBanner?.image_url || placeholderImage("hero", { width: 1000, height: 1000 })}
                alt={heroTitle || t("home.heroTitle")}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/20" />
            </div>
          </div>
        </div>

        {/* Trust strip, straddling the hero/page boundary */}
        <div className="relative mx-auto -mt-10 max-w-7xl px-4">
          <div className="glass grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 sm:p-6">
            {trustItems.map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-start sm:gap-3 sm:text-start">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <item.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-foreground">{item.title}</span>
                  <span className="hidden text-xs text-muted sm:block">{item.description}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
        {/* Categories */}
        <section>
          <SectionHeader
            eyebrow={t("nav.categories")}
            title={t("home.categoriesTitle")}
            description={t("home.categoriesSubtitle")}
          />
          {categories.length === 0 ? (
            <Card className="mt-6 text-center text-muted">{t("home.categoriesComingSoon")}</Card>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {categories.map((category, i) => (
                <Link
                  key={category.id}
                  href={`/c/${category.slug}`}
                  className="glass glass-hover flex flex-col items-center gap-3 !rounded-2xl px-3 py-5 text-center"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-white">
                    <Image
                      src={category.image_url || placeholderImage("vegetables", { width: 200, height: 200, variant: i })}
                      alt={pickLocalized(category.name_ar, category.name_en, locale)}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {pickLocalized(category.name_ar, category.name_en, locale)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured products */}
        {featured.products.length > 0 && (
          <section className="mt-16 sm:mt-24">
            <SectionHeader
              eyebrow={t("home.featuredEyebrow")}
              title={t("home.featuredTitle")}
              description={t("home.featuredSubtitle")}
              action={
                <Link href="/c" className={buttonVariants({ variant: "outline" })}>
                  {t("home.heroCta")}
                </Link>
              }
            />
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {featured.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {categories.length === 0 && featured.products.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted">{t("home.foundationNotice")}</p>
        )}

        {/* Green Box teaser */}
        <section className="mt-16 sm:mt-24">
          <div className="glass-dark grid gap-8 overflow-hidden p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge tone="brand" className="bg-white/10 text-brand-300 ring-brand-300/30">
                {t("home.greenBoxEyebrow")}
              </Badge>
              <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">
                {cms(content?.greenBoxTitle_ar, content?.greenBoxTitle_en, t("home.greenBoxTitle"))}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
                {cms(content?.greenBoxDescription_ar, content?.greenBoxDescription_en, t("home.greenBoxDescription"))}
              </p>
              <Link href="/box" className={`${buttonVariants({ size: "lg" })} mt-6`}>
                {t("home.greenBoxCta")}
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-2xl lg:aspect-square">
              <Image
                src={placeholderImage("greenBox", { width: 800, height: 800 })}
                alt={t("home.greenBoxTitle")}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Loyalty + subscription teasers */}
        <section className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-2">
          <div className="glass glass-hover flex flex-col gap-4 p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <Badge tone="brand">{t("home.loyaltyEyebrow")}</Badge>
              <h3 className="mt-3 text-xl font-bold text-foreground">
                {cms(content?.loyaltyTitle_ar, content?.loyaltyTitle_en, t("home.loyaltyTitle"))}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {cms(content?.loyaltyDescription_ar, content?.loyaltyDescription_en, t("home.loyaltyDescription"))}
              </p>
            </div>
            <Link href="/account/loyalty" className={`${buttonVariants({ variant: "outline" })} mt-auto w-fit`}>
              {t("home.loyaltyCta")}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="glass glass-hover flex flex-col gap-4 p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-deep-700 text-white">
              <PackageCheck className="h-6 w-6" />
            </span>
            <div>
              <Badge tone="deep" className="bg-deep-100 text-deep-700">
                {t("home.subscriptionEyebrow")}
              </Badge>
              <h3 className="mt-3 text-xl font-bold text-foreground">
                {cms(content?.subscriptionTitle_ar, content?.subscriptionTitle_en, t("home.subscriptionTitle"))}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {cms(
                  content?.subscriptionDescription_ar,
                  content?.subscriptionDescription_en,
                  t("home.subscriptionDescription"),
                )}
              </p>
            </div>
            <Link href="/account/subscriptions/new" className={`${buttonVariants({ variant: "outline" })} mt-auto w-fit`}>
              {t("home.subscriptionCta")}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Why Green Box */}
        <section className="mt-16 sm:mt-24">
          <SectionHeader eyebrow={t("home.whyEyebrow")} title={t("home.whyTitle")} align="center" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyItems.map((item) => (
              <div key={item.title} className="glass glass-hover flex flex-col items-center gap-3 p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <item.icon className="h-6 w-6" />
                </span>
                <h3 className="font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-16 sm:mt-24">
          <div className="bg-brand-gradient relative overflow-hidden rounded-[var(--radius-card)] px-8 py-14 text-center shadow-[var(--shadow-lifted)] sm:px-16">
            <div className="blob h-64 w-64 bg-white/10 -top-20 start-1/4" aria-hidden="true" />
            <h2 className="relative text-2xl font-extrabold text-white sm:text-3xl">
              {cms(content?.finalCtaTitle_ar, content?.finalCtaTitle_en, t("home.finalCtaTitle"))}
            </h2>
            <p className="relative mx-auto mt-3 max-w-lg text-white/85">
              {cms(content?.finalCtaDescription_ar, content?.finalCtaDescription_en, t("home.finalCtaDescription"))}
            </p>
            <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/auth/register" className={buttonVariants({ variant: "dark", size: "lg" })}>
                {t("home.finalCtaPrimary")}
              </Link>
              <Link
                href="/c"
                className={`${buttonVariants({ variant: "outline", size: "lg" })} !border-white/50 !bg-white/10 !text-white hover:!bg-white/20`}
              >
                {t("home.finalCtaSecondary")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
