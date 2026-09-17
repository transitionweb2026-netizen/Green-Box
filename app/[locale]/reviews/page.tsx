import type { Metadata } from "next";
import { MessageSquareQuote, Star } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { listActiveReviews } from "@/lib/services/reviews";
import { pickLocalized } from "@/lib/i18n/localized";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reviewsPage");
  return { title: t("title"), description: t("metaDescription") };
}

export default async function ReviewsPage() {
  const t = await getTranslations("reviewsPage");
  const locale = await getLocale();
  const reviews = await listActiveReviews();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} align="center" />

      <div className="mt-10">
        {reviews.length === 0 ? (
          <EmptyState
            icon={<MessageSquareQuote className="h-7 w-7" />}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <Card key={review.id} tone="flat">
                <div className="flex items-center gap-1 text-gold-500" aria-hidden="true">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground">
                  &ldquo;{pickLocalized(review.quote_ar, review.quote_en, locale)}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {review.customer_name.charAt(0)}
                  </span>
                  <span className="text-sm font-bold text-deep-800">{review.customer_name}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
