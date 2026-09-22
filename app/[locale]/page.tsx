import type { Metadata } from "next";
import { AppImage as Image } from "@/components/ui/app-image";
import { ArrowLeft, ArrowRight, ClipboardCheck, CreditCard, Gift, Leaf, Package, ShieldCheck, ShoppingBasket, Star, Truck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { listActiveCategories, listProducts } from "@/lib/services/catalog";
import { listActiveBanners, getSetting, type HomepageContent } from "@/lib/services/content";
import { listActiveReviews } from "@/lib/services/reviews";
import { pickLocalized, pickLocalizedOrDefault } from "@/lib/i18n/localized";
import { placeholderImage, categoryPlaceholderKey } from "@/lib/media/placeholders";
import { getSiteOrigin } from "@/lib/seo/site-url";
import { ProductCard } from "@/components/storefront/product-card";
import { HeroCarousel } from "@/components/storefront/hero-carousel";
import { HeroCartSummary } from "@/components/storefront/hero-cart-summary";

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

  const [categories, featured, banners, content, testimonials] = await Promise.all([
    listActiveCategories(),
    listProducts({ featured: true, pageSize: 8 }),
    listActiveBanners(),
    getSetting<HomepageContent>("homepage_content"),
    listActiveReviews(6),
  ]);

  const cms = (ar?: string, en?: string, fallback?: string) => pickLocalizedOrDefault(ar, en, locale, fallback ?? "");

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

  const vegetablesCategory = categories.find((c) => c.slug === "fresh-vegetables");
  const fruitsCategory = categories.find((c) => c.slug === "fresh-fruits");
  const heroCategoryShortcuts = [
    vegetablesCategory && {
      href: `/c/${vegetablesCategory.slug}`,
      name: pickLocalized(vegetablesCategory.name_ar, vegetablesCategory.name_en, locale),
      image: vegetablesCategory.image_url || placeholderImage("vegetables", { width: 80, height: 80 }),
    },
    fruitsCategory && {
      href: `/c/${fruitsCategory.slug}`,
      name: pickLocalized(fruitsCategory.name_ar, fruitsCategory.name_en, locale),
      image: fruitsCategory.image_url || placeholderImage("fruits", { width: 80, height: 80 }),
    },
    {
      href: "/search?q=herbs",
      name: t("home.herbsShortcut"),
      image: placeholderImage("herbs", { width: 80, height: 80 }),
    },
  ].filter((x): x is { href: string; name: string; image: string } => Boolean(x));

  const trustItems = [
    { icon: Leaf, title: t("home.trustFreshTitle") },
    { icon: Truck, title: t("home.trustDeliveryTitle") },
    { icon: CreditCard, title: t("home.trustPaymentTitle") },
    { icon: Gift, title: t("home.trustLoyaltyTitle") },
  ];

  const processSteps = [
    { icon: ShoppingBasket, title: t("home.processOrderTitle"), description: t("home.processOrderDescription") },
    { icon: Leaf, title: t("home.processPickTitle"), description: t("home.processPickDescription") },
    { icon: ClipboardCheck, title: t("home.processCheckTitle"), description: t("home.processCheckDescription") },
    { icon: ShieldCheck, title: t("home.processPrepareTitle"), description: t("home.processPrepareDescription") },
    { icon: Package, title: t("home.processPackTitle"), description: t("home.processPackDescription") },
    { icon: Truck, title: t("home.processDeliverTitle"), description: t("home.processDeliverDescription") },
  ];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero -- cream, editorial, carousel-driven image + text */}
      <section className="relative overflow-hidden">
        {/* Botanical backdrop, local to the hero only (the sitewide
            .site-atmosphere layer is untouched) -- gives the area directly
            behind the Green Box real leaf/droplet/glass depth instead of
            three flat CSS blobs, so the box has an actual environment to
            sit inside rather than an empty gap between it and the page's
            plain cream canvas. */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/hero-bg-botanical.webp)", filter: "saturate(1.55) contrast(1.12) brightness(0.95)" }}
          aria-hidden="true"
        />
        <HeroCarousel
          banners={banners}
          locale={locale}
          heroEyebrow={t("home.heroEyebrow")}
          heroHeadline={t("home.heroHeadline")}
          heroHeadlineAccent={t("home.heroHeadlineAccent")}
          heroSubtitleFallback={t("home.heroSubtitle")}
          heroCta={t("home.heroCta")}
          heroNote={t("home.heroNote")}
          cartSummary={<HeroCartSummary />}
        />

        {/* Category shortcuts -- exactly 3, matching the reference
            (Vegetables / Fruits / Herbs). Vegetables and Fruits link to the
            real matching categories; there is no dedicated "Herbs" category
            in the catalog today, so that pill goes to a real search result
            instead of a fabricated category link. */}
        <div className="relative mx-auto max-w-7xl px-4 pb-10">
          <div className="flex flex-wrap justify-center gap-3">
            {heroCategoryShortcuts.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="glass glass-hover flex items-center gap-3 !rounded-full py-2 pe-6 ps-2"
              >
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-brand-50">
                  <Image src={item.image} alt={item.name} fill sizes="44px" className="object-cover" />
                </span>
                <span className="text-base font-bold text-deep-800">{item.name}</span>
                <ArrowIcon className="h-4 w-4 text-brand-600" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Compact trust strip */}
      <section className="border-y border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-4 sm:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item.title} className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold text-deep-800 sm:text-sm">{item.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Compact process tagline -- transition between hero and shopping content */}
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-3.5">
          <Leaf className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          <p className="text-center text-sm font-bold text-deep-800 sm:text-base">{t("home.processTagline")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
        {/* Shop by category -- large, image-led cards */}
        <section>
          <SectionHeader
            eyebrow={t("nav.categories")}
            title={t("home.categoriesTitle")}
            description={t("home.categoriesSubtitle")}
          />
          {categories.length === 0 ? (
            <Card className="mt-6 text-center text-muted">{t("home.categoriesComingSoon")}</Card>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
              {categories.map((category) => {
                const name = pickLocalized(category.name_ar, category.name_en, locale);
                const description = pickLocalized(category.description_ar ?? "", category.description_en, locale);
                return (
                  <Link key={category.id} href={`/c/${category.slug}`} className="card-blob group block bg-brand-50 p-2.5">
                    <div className="relative aspect-square w-full overflow-hidden rounded-[1.35rem] bg-white/50">
                      <Image
                        src={category.image_url || placeholderImage(categoryPlaceholderKey(category.slug))}
                        alt={name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-end justify-between gap-2 pt-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-deep-800">{name}</span>
                        {description && <span className="line-clamp-2 text-xs text-muted">{description}</span>}
                      </div>
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white transition-transform group-hover:scale-110"
                      >
                        <ArrowIcon className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* The Green Box Difference -- the order -> deliver process, as a visual sequence */}
        <section className="mt-20 sm:mt-28">
          <SectionHeader
            eyebrow={t("home.processEyebrow")}
            title={t("home.processTitle")}
            description={t("home.processSubtitle")}
          />
          <div className="mt-10 flex flex-wrap items-start justify-center gap-x-2 gap-y-8">
            {processSteps.map((step, i) => (
              <div key={step.title} className="flex items-start">
                <div className="flex w-28 flex-col items-center text-center sm:w-32">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-[var(--shadow-soft)]">
                    <step.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-sm font-bold text-deep-800">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{step.description}</p>
                </div>
                {i < processSteps.length - 1 && (
                  <ArrowIcon className="mt-5 hidden h-5 w-5 shrink-0 text-brand-400 sm:block" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link href="/reviews" className={buttonVariants({ variant: "outline" })}>
              <Star className="h-4 w-4" />
              {t("home.testimonialsCta")}
            </Link>
          </div>
        </section>

        {/* Featured products */}
        {featured.products.length > 0 && (
          <section className="mt-20 sm:mt-28">
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
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {featured.products.map((product) => (
                <div key={product.id} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}

        {categories.length === 0 && featured.products.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted">{t("home.foundationNotice")}</p>
        )}

        {/* Green Box Boxes -- signature, editorial, dominant section */}
        <section className="mt-20 sm:mt-28">
          <div className="bg-deep-gradient relative grid gap-8 overflow-hidden rounded-[var(--radius-card)] p-8 sm:p-14 lg:grid-cols-2 lg:items-center lg:gap-14 lg:p-20">
            <div className="blob h-72 w-72 bg-brand-500/20 -top-16 -start-16 animate-float-slow" aria-hidden="true" />
            <div className="relative order-2 lg:order-1">
              <Badge tone="brand" className="bg-white/10 text-brand-300 ring-brand-300/30">
                {t("home.greenBoxEyebrow")}
              </Badge>
              <h2 className="mt-5 text-3xl leading-tight font-extrabold text-white sm:text-4xl">
                {cms(content?.greenBoxTitle_ar, content?.greenBoxTitle_en, t("home.greenBoxTitle"))}
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
                {cms(content?.greenBoxDescription_ar, content?.greenBoxDescription_en, t("home.greenBoxDescription"))}
              </p>
              <Link href="/box" className={`${buttonVariants({ size: "lg" })} mt-8`}>
                {t("home.greenBoxCta")}
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative order-1 aspect-[4/3] overflow-hidden rounded-2xl lg:order-2 lg:aspect-square">
              <Image
                src={placeholderImage("greenBox", { width: 900, height: 900 })}
                alt={t("home.greenBoxTitle")}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Fresh vs Prepared -- large split composition, visually distinct from the grids above */}
        <section className="mt-20 sm:mt-28">
          <SectionHeader eyebrow={t("home.freshVsPreparedEyebrow")} title={t("home.freshVsPreparedTitle")} />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="group relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-2xl">
              <Image
                src={placeholderImage("farmHarvest")}
                alt={t("home.freshTitle")}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden="true" />
              <div className="relative p-6 sm:p-7">
                <h3 className="text-xl font-extrabold text-white">{t("home.freshTitle")}</h3>
                <Link href="/c/fresh-vegetables" className={`${buttonVariants({ size: "sm" })} mt-3`}>
                  {t("home.freshCta")}
                </Link>
              </div>
            </div>
            <div className="group relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-2xl">
              <Image
                src={placeholderImage("kitchen")}
                alt={t("home.preparedTitle")}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden="true" />
              <div className="relative p-6 sm:p-7">
                <h3 className="text-xl font-extrabold text-white">{t("home.preparedTitle")}</h3>
                <Link href="/c/prepared-vegetables" className={`${buttonVariants({ size: "sm" })} mt-3`}>
                  {t("home.preparedCta")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Customer stories */}
        {testimonials.length > 0 && (
          <section className="mt-20 sm:mt-28">
            <SectionHeader
              eyebrow={t("home.testimonialsEyebrow")}
              title={t("home.testimonialsTitle")}
              action={
                <Link href="/reviews" className={buttonVariants({ variant: "outline" })}>
                  {t("home.testimonialsCta")}
                </Link>
              }
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {testimonials.map((item) => (
                <Card key={item.id} tone="flat">
                  <div className="flex items-center gap-1 text-gold-500" aria-hidden="true">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    &ldquo;{pickLocalized(item.quote_ar, item.quote_en, locale)}&rdquo;
                  </p>
                  <div className="mt-4 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                      {item.customer_name.charAt(0)}
                    </span>
                    <span className="text-sm font-bold text-deep-800">{item.customer_name}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="mt-20 sm:mt-28">
          <div className="bg-deep-gradient relative overflow-hidden rounded-[var(--radius-card)] px-8 py-16 text-center shadow-[var(--shadow-lifted)] sm:px-16 sm:py-24">
            <div className="blob h-72 w-72 bg-brand-500/20 -top-20 start-1/4" aria-hidden="true" />
            <h2 className="relative text-3xl font-extrabold text-white sm:text-4xl">
              {cms(content?.finalCtaTitle_ar, content?.finalCtaTitle_en, t("home.finalCtaTitle"))}
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-lg text-white/85">
              {cms(content?.finalCtaDescription_ar, content?.finalCtaDescription_en, t("home.finalCtaDescription"))}
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/auth/register" className={buttonVariants({ size: "lg" })}>
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
