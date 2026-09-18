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
 * Two-column split hero: an image pane and a light-green text pane, side
 * by side at roughly equal width. The image pane is placed FIRST in DOM
 * order and the text pane SECOND -- in LTR that reads as image-left/
 * text-right; in RTL the same DOM order naturally mirrors to
 * image-right/text-left, which is the correct reading-order equivalent for
 * Arabic rather than a hardcoded physical side.
 *
 * The seam between the two panes is a diagonal cut (via `clip-path` on the
 * image, mirrored per direction below) rather than a hard vertical line,
 * and the image's own column is widened slightly past 50% so its
 * uncut edge genuinely encroaches into the text pane's nominal half --
 * the two panes blend across that band instead of butting into each other.
 * The light-green backdrop lives on the outer container itself, so
 * wherever the diagonal clip cuts the image away, that same green shows
 * through underneath rather than needing a separate layered background.
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

  // Diagonal seam on the image's trailing edge (the edge facing the text
  // pane) -- only applied at lg: (see globals.css .hero-image-clip--*),
  // since the seam only exists once the panes sit side by side; on the
  // stacked mobile layout there's no adjacent pane for a diagonal cut to
  // relate to, so applying it there would just look like a stray notch.
  const imageClipClass = isAr ? "hero-image-clip--rtl" : "hero-image-clip--ltr";

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
      className="relative grid w-full grid-cols-1 overflow-hidden bg-brand-200 lg:min-h-[16rem] lg:grid-cols-[54%_46%]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Image pane -- widened past 50% and diagonally clipped on its
          trailing edge, so it genuinely overlaps the text pane's nominal
          half instead of meeting it on a hard vertical line. */}
      <div className={`relative h-44 overflow-hidden sm:h-56 lg:h-auto ${imageClipClass}`}>
        {/* Embla's ref must land on an element whose only child is the
            slide track -- the sticker below is a sibling of this, one
            level up, so it can't interfere with embla's own layout math. */}
        <div className="h-full" ref={emblaImageRef}>
          <div className="flex h-full">
            {slides.map((slide, i) => (
              <div key={i} className="relative h-full min-w-0 flex-[0_0_100%]">
                <Image src={slide.image} alt={slide.title} fill priority={i === 0} sizes="(max-width: 1024px) 100vw, 54vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Rotated "sticker" tag -- stays on the image, hugging its
            trailing edge (the one facing the diagonal seam) without
            crossing over onto the text pane. Colored to match the deep
            green category nav bar rather than gold. A fixed English brand
            flourish, not translated (kept identical in both locales,
            matching what was asked for verbatim), set in a bold rounded
            display face distinct from the rest of the site's type system. */}
        <div className="absolute top-[35%] end-10 z-10 -translate-y-1/2 -rotate-[9deg] rounded-lg bg-deep-700 px-4 py-2 shadow-[0_4px_10px_rgba(0,0,0,0.3)] sm:end-12 sm:px-5 sm:py-2.5">
          <p className="font-sticker text-xl leading-[1.05] font-extrabold whitespace-nowrap text-white sm:text-3xl">
            Unprocess
            <br />
            your food
          </p>
        </div>
      </div>

      {/* Text pane -- light brand-green panel */}
      <div className="relative flex items-center px-6 py-5 sm:px-10 lg:px-12 lg:py-6" ref={emblaTextRef}>
        <div className="flex w-full">
          {slides.map((slide, i) => (
            <div key={i} className="min-w-0 flex-[0_0_100%]">
              <span className="inline-flex items-center rounded-full bg-white/60 px-3 py-1 text-xs font-bold tracking-wide text-deep-800 uppercase">
                {banners.length > 0 ? siteName : heroEyebrow}
              </span>
              <h1 className="mt-3 font-serif text-2xl leading-[1.15] font-extrabold text-deep-900 sm:text-3xl lg:text-4xl">
                {slide.title}
              </h1>
              <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {trustLabels.map((label) => (
                  <span key={label} className="flex items-center gap-2 text-sm font-semibold text-deep-800 sm:text-base">
                    <Check className="h-5 w-5 shrink-0 text-deep-700" />
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-5">
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
