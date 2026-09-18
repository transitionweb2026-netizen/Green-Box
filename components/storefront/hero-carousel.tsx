"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Check } from "lucide-react";
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

/**
 * Two-column split hero matching the reference exactly: an image pane and
 * a solid brand-gold text pane, side by side at roughly equal width, full
 * section height. The image pane is placed FIRST in DOM order and the text
 * pane SECOND -- in LTR that reads as image-left/text-right (matching the
 * reference precisely); in RTL the same DOM order naturally mirrors to
 * image-right/text-left, which is the correct reading-order equivalent for
 * Arabic rather than a hardcoded physical side.
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
  heroCta,
  trustLabels,
}: {
  banners: Banner[];
  locale: string;
  siteName: string;
  heroEyebrow: string;
  heroTitle: string;
  heroCta: string;
  trustLabels: [string, string, string, string];
}) {
  // Functions can't cross the Server -> Client Component boundary, so the
  // slide-label translator is looked up here directly (this component
  // already has "use client") rather than passed down as a prop.
  const t = useTranslations("home");
  const isAr = locale !== "en";
  const direction = isAr ? "rtl" : "ltr";

  const slides: HeroSlide[] = useMemo(() => {
    if (banners.length === 0) {
      return [{ title: heroTitle, image: placeholderImage("hero", { width: 1200, height: 1200 }), href: "/c" }];
    }
    return banners.map((banner) => ({
      title: pickLocalized(banner.title_ar ?? "", banner.title_en, locale) || heroTitle,
      image: banner.image_url || placeholderImage("hero", { width: 1200, height: 1200 }),
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
      className="grid w-full grid-cols-1 overflow-hidden lg:min-h-[26rem] lg:grid-cols-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Image pane */}
      <div className="relative h-64 overflow-hidden sm:h-80 lg:h-auto" ref={emblaImageRef}>
        <div className="flex h-full">
          {slides.map((slide, i) => (
            <div key={i} className="relative h-full min-w-0 flex-[0_0_100%]">
              <Image src={slide.image} alt={slide.title} fill priority={i === 0} sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Text pane -- solid brand-gold panel */}
      <div className="relative flex items-center bg-gold-400 px-6 py-10 sm:px-10 lg:px-14 lg:py-14" ref={emblaTextRef}>
        <div className="flex w-full">
          {slides.map((slide, i) => (
            <div key={i} className="min-w-0 flex-[0_0_100%]">
              <span className="inline-flex items-center rounded-full bg-white/60 px-3 py-1 text-xs font-bold tracking-wide text-deep-800 uppercase">
                {banners.length > 0 ? siteName : heroEyebrow}
              </span>
              <h1 className="mt-5 font-serif text-3xl leading-[1.15] font-extrabold text-deep-900 sm:text-4xl lg:text-5xl">
                {slide.title}
              </h1>
              <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {trustLabels.map((label) => (
                  <span key={label} className="flex items-center gap-2 text-sm font-semibold text-deep-800 sm:text-base">
                    <Check className="h-5 w-5 shrink-0 text-deep-700" />
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-8">
                <Link href={slide.href} className={buttonVariants({ variant: "secondary", size: "lg" })}>
                  {heroCta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {hasMultiple && (
          <div className="absolute bottom-6 start-10 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={t("heroSlideLabel", { n: i + 1 })}
                aria-current={i === selectedIndex}
                onClick={() => emblaImageApi?.scrollTo(i)}
                className={`h-2 rounded-full transition-all ${i === selectedIndex ? "w-6 bg-deep-800" : "w-2 bg-deep-800/25 hover:bg-deep-800/40"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
