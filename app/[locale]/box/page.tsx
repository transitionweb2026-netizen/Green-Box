import { AppImage as Image } from "@/components/ui/app-image";
import type { Metadata } from "next";
import { CheckCircle2, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { listProducts } from "@/lib/services/catalog";
import { placeholderImage } from "@/lib/media/placeholders";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { ProductCard } from "@/components/storefront/product-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("greenBoxPage");
  return { title: t("title"), description: t("subtitle") };
}

export default async function GreenBoxPage() {
  const t = await getTranslations("greenBoxPage");
  const { products } = await listProducts({ productType: "box", pageSize: 48 });

  const benefits = [t("benefitCurated"), t("benefitValue"), t("benefitTime")] as const;

  return (
    <div>
      <section className="bg-deep-gradient relative overflow-hidden">
        <div className="blob h-96 w-96 bg-brand-500/25 -top-24 -start-16 animate-float-slow" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-2">
          <div>
            <Badge tone="brand" className="bg-white/10 text-brand-300 ring-brand-300/30">
              <Sparkles className="h-3.5 w-3.5" /> {t("eyebrow")}
            </Badge>
            <h1 className="mt-5 text-3xl leading-tight font-extrabold text-white sm:text-5xl">{t("title")}</h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">{t("subtitle")}</p>
            <ul className="mt-7 flex flex-col gap-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2.5 text-white/85">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-400" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] shadow-2xl">
            <Image
              src={placeholderImage("greenBox", { width: 900, height: 900 })}
              alt={t("title")}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/20" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
        <SectionHeader eyebrow={t("eyebrow")} title={t("gridTitle")} description={t("gridSubtitle")} />

        <div className="mt-8">
          {products.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-7 w-7" />}
              title={t("emptyTitle")}
              description={t("emptyDescription")}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
