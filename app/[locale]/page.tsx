import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { listActiveCategories, listProducts } from "@/lib/services/catalog";
import { listActiveBanners } from "@/lib/services/content";
import { pickLocalized } from "@/lib/i18n/localized";
import { ProductCard } from "@/components/storefront/product-card";

export default async function HomePage() {
  const t = await getTranslations();
  const locale = await getLocale();

  const [categories, featured, banners] = await Promise.all([
    listActiveCategories(),
    listProducts({ featured: true, pageSize: 8 }),
    listActiveBanners(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {banners.length > 0 ? (
        <section className="overflow-hidden rounded-2xl">
          {banners.slice(0, 1).map((banner) => {
            const title = pickLocalized(banner.title_ar ?? "", banner.title_en, locale);
            const content = (
              <div className="relative aspect-[16/7] w-full bg-brand-50 sm:aspect-[21/7]">
                {banner.image_url && (
                  <Image src={banner.image_url} alt={title} fill className="object-cover" priority />
                )}
                {title && (
                  <div className="absolute inset-0 flex items-center bg-black/20 px-6 sm:px-12">
                    <h1 className="max-w-xl text-2xl font-bold text-white sm:text-4xl">{title}</h1>
                  </div>
                )}
              </div>
            );
            return banner.link_url ? (
              <Link key={banner.id} href={banner.link_url}>
                {content}
              </Link>
            ) : (
              <div key={banner.id}>{content}</div>
            );
          })}
        </section>
      ) : (
        <section className="rounded-2xl bg-brand-50 px-6 py-16 text-center sm:px-12">
          <h1 className="text-3xl font-bold text-brand-900 sm:text-4xl">{t("home.heroTitle")}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-800">{t("home.heroSubtitle")}</p>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground">{t("home.categoriesTitle")}</h2>
        {categories.length === 0 ? (
          <Card className="mt-4 text-center text-muted">{t("home.categoriesComingSoon")}</Card>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/c/${category.slug}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center hover:border-brand-400 hover:bg-brand-50"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-brand-50">
                  {category.image_url && (
                    <Image
                      src={category.image_url}
                      alt={pickLocalized(category.name_ar, category.name_en, locale)}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {pickLocalized(category.name_ar, category.name_en, locale)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {featured.products.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-foreground">{t("home.featuredTitle")}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {featured.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {categories.length === 0 && featured.products.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted">{t("home.foundationNotice")}</p>
      )}

      <div className="mt-10 text-center">
        <Link href="/search" className={buttonVariants({ variant: "outline" })}>
          {t("home.heroCta")}
        </Link>
      </div>
    </div>
  );
}
