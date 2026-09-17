"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Leaf, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppImage as Image } from "@/components/ui/app-image";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { pickLocalized } from "@/lib/i18n/localized";
import { placeholderImage } from "@/lib/media/placeholders";
import type { Banner } from "@/lib/services/content";

interface HeroSlide {
  title: string;
  image: string;
  href: string;
}

// Icon components can't cross the Server -> Client boundary as props (same
// restriction as functions), so these 3 are imported and matched
// positionally against the 3 short trust labels passed in as plain strings.
const TRUST_ICONS = [Leaf, ShieldCheck, Truck];

/**
 * Full-bleed hero: the image carousel is an absolutely-positioned
 * background spanning the ENTIRE section edge to edge (not a right-side
 * column), with the text carousel sitting directly on top of the raw photo
 * -- no card, box, or gradient scrim behind it. Legibility comes purely
 * from white text + a drop-shadow, matching the reference exactly.
 *
 * The reference keeps the image on the physical right and text on the
 * physical left regardless of it being an Arabic (RTL) site, so the image
 * pane is placed FIRST in DOM order and the text pane SECOND: in RTL that
 * puts DOM-first on the visual right (image) and DOM-second on the visual
 * left (text), matching the reference; in LTR the same order mirrors
 * naturally (image left, text right), which is the expected i18n behavior.
 *
 * Two embla-carousel instances share one selected index: the image pane is
 * the interactive one (drag, autoplay, dots all drive it), the text pane
 * only ever follows via `scrollTo()` from the image pane's own `select`
 * event (`watchDrag: false`, not itself draggable).
 *
 * With 0 or 1 real banners this renders a single synthetic slide with no
 * dots and loop disabled.
 */
export function HeroCarousel({
  banners,
  locale,
  siteName,
  heroEyebrow,
  heroTitle,
  heroSubtitle,
  heroCta,
  heroSecondaryCta,
  trustLabels,
}: {
  banners: Banner[];
  locale: string;
  siteName: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  heroSecondaryCta: string;
  trustLabels: [string, string, string];
}) {
  // Functions can't cross the Server -> Client Component boundary, so the
  // slide-label translator is looked up here directly (this component
  // already has "use client") rather than passed down as a prop.
  const t = useTranslations("home");
  const isAr = locale !== "en";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const direction = isAr ? "rtl" : "ltr";

  const slides: HeroSlide[] = useMemo(() => {
    if (banners.length === 0) {
      return [{ title: heroTitle, image: placeholderImage("hero", { width: 1600, height: 1200 }), href: "/c" }];
    }
    return banners.map((banner) => ({
      title: pickLocalized(banner.title_ar ?? "", banner.title_en, locale) || heroTitle,
      image: banner.image_url || placeholderImage("hero", { width: 1600, height: 1200 }),
      href: banner.link_url ?? "/c",
    }));
  }, [banners, locale, heroTitle]);

  const hasMultiple = slides.length > 1;

  const [emblaImageRef, emblaImageApi] = useEmblaCarousel({ loop: hasMultiple, direction });
  const [emblaTextRef, emblaTextApi] = useEmblaCarousel({ loop: hasMultiple, direction, watchDrag: false });
  const [isPaused, setIsPaused] = useState(false);

  // The image carousel's current slide is genuinely external state (embla
  // owns it, not React) -- useSyncExternalStore is the correct primitive
  // for that, rather than mirroring it into a setState call inside an
  // effect body.
  const subscribeToSelection = useCallback(
    (callback: () => void) => {
      if (!emblaImageApi) return () => {};
      emblaImageApi.on("select", callback);
      emblaImageApi.on("reInit", callback);
      return () => {
        emblaImageApi.off("select", callback);
        emblaImageApi.off("reInit", callback);
      };
    },
    [emblaImageApi],
  );
  const getSelectedIndex = useCallback(() => emblaImageApi?.selectedScrollSnap() ?? 0, [emblaImageApi]);
  const selectedIndex = useSyncExternalStore(subscribeToSelection, getSelectedIndex, () => 0);

  // Keeping the text pane in step with the image pane IS a genuine side
  // effect (an imperative call on a different carousel instance), so it
  // belongs in its own effect, separate from the state subscription above.
  useEffect(() => {
    emblaTextApi?.scrollTo(selectedIndex);
  }, [selectedIndex, emblaTextApi]);

  useEffect(() => {
    if (!emblaImageApi || !hasMultiple || isPaused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => emblaImageApi.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [emblaImageApi, hasMultiple, isPaused]);

  return (
    <div
      className="relative min-h-[34rem] w-full overflow-hidden sm:min-h-[40rem] lg:min-h-[46rem]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Image carousel -- full-bleed background, spans the entire hero */}
      <div className="absolute inset-0" ref={emblaImageRef}>
        <div className="flex h-full">
          {slides.map((slide, i) => (
            <div key={i} className="relative h-full min-w-0 flex-[0_0_100%]">
              <Image src={slide.image} alt={slide.title} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 py-10 sm:py-16 lg:py-20">
        <div className="animate-fade-up w-full max-w-xl overflow-hidden" ref={emblaTextRef}>
          <div className="flex">
            {slides.map((slide, i) => (
              <div key={i} className="min-w-0 flex-[0_0_100%] [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]">
                <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-bold tracking-wide text-brand-700 uppercase [text-shadow:none]">
                  {banners.length > 0 ? siteName : heroEyebrow}
                </span>
                <h1 className="mt-5 text-4xl leading-[1.1] font-extrabold text-white sm:text-6xl">{slide.title}</h1>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-white/90 sm:text-lg">{heroSubtitle}</p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href={slide.href} className={buttonVariants({ size: "lg" })}>
                    {heroCta}
                    <ArrowIcon className="h-4 w-4" />
                  </Link>
                  <Link href="/box" className={buttonVariants({ variant: "outline", size: "lg" })}>
                    <Sparkles className="h-4 w-4" />
                    {heroSecondaryCta}
                  </Link>
                </div>
                <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/30 pt-6">
                  {trustLabels.map((label, idx) => {
                    const TrustIcon = TRUST_ICONS[idx];
                    return (
                      <span key={label} className="flex items-center gap-2 text-sm font-semibold text-white">
                        <TrustIcon className="h-4 w-4 shrink-0 text-brand-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {hasMultiple && (
            <div className="mt-8 flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={t("heroSlideLabel", { n: i + 1 })}
                  aria-current={i === selectedIndex}
                  onClick={() => emblaImageApi?.scrollTo(i)}
                  className={`h-2 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.35)] transition-all ${i === selectedIndex ? "w-6 bg-brand-400" : "w-2 bg-white/50 hover:bg-white/80"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
