"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Leaf } from "lucide-react";
import { AppImage as Image } from "@/components/ui/app-image";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/i18n/localized";
import type { Banner } from "@/lib/services/content";

// Fixed local asset (public/images/hero.jpg) -- deliberately NOT the live
// loremflickr placeholder used elsewhere on the site: that service can
// return a different underlying photo for the same lock value depending on
// requested dimensions/caching, which is exactly why the hero image kept
// changing. This one ships with the app and can never change on its own;
// swap the file (or add a real banner in /admin/content, which takes
// priority) once real Green Box photography is ready.
const FIXED_HERO_IMAGE = "/images/hero.jpg";

interface HeroSlide {
  subtitle: string;
  image: string;
  href: string;
}

/**
 * Editorial cream hero: a static two-tone brand headline (never rotates)
 * plus a single embla carousel that only drives the photo and its one-line
 * promo subtitle underneath the headline -- admin-managed banners (title +
 * image + link) still rotate, they just supply a supporting line rather
 * than the page's own H1, which reads better against a fixed headline. A
 * single carousel instance is enough now that the headline itself doesn't
 * change per slide (an earlier version needed two synced instances when
 * the whole H1 rotated).
 */
export function HeroCarousel({
  banners,
  locale,
  heroEyebrow,
  heroHeadline,
  heroHeadlineAccent,
  heroSubtitleFallback,
  heroCta,
  heroNote,
  heroPaperTag,
}: {
  banners: Banner[];
  locale: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroHeadlineAccent: string;
  heroSubtitleFallback: string;
  heroCta: string;
  heroNote: string;
  heroPaperTag: string;
}) {
  const isAr = locale !== "en";
  const direction = isAr ? "rtl" : "ltr";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const slides: HeroSlide[] = useMemo(() => {
    if (banners.length === 0) {
      return [{ subtitle: heroSubtitleFallback, image: FIXED_HERO_IMAGE, href: "/c" }];
    }
    return banners.map((banner) => ({
      subtitle: pickLocalized(banner.title_ar ?? "", banner.title_en, locale) || heroSubtitleFallback,
      image: banner.image_url || FIXED_HERO_IMAGE,
      href: banner.link_url ?? "/c",
    }));
  }, [banners, locale, heroSubtitleFallback]);

  const hasMultiple = slides.length > 1;
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: hasMultiple, direction });
  const [isPaused, setIsPaused] = useState(false);

  const subscribeToSelection = useCallback(
    (callback: () => void) => {
      if (!emblaApi) return () => {};
      emblaApi.on("select", callback);
      emblaApi.on("reInit", callback);
      return () => {
        emblaApi.off("select", callback);
        emblaApi.off("reInit", callback);
      };
    },
    [emblaApi],
  );
  const getSelectedIndex = useCallback(() => emblaApi?.selectedScrollSnap() ?? 0, [emblaApi]);
  const selectedIndex = useSyncExternalStore(subscribeToSelection, getSelectedIndex, () => 0);
  const currentSlide = slides[selectedIndex] ?? slides[0];

  useEffect(() => {
    if (!emblaApi || !hasMultiple || isPaused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [emblaApi, hasMultiple, isPaused]);

  return (
    <div
      className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 sm:py-14 lg:grid-cols-2 lg:gap-14"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Text column -- static two-tone brand headline, never rotates */}
      <div className="relative z-10 order-2 lg:order-1">
        <p className="text-xs font-bold tracking-[0.25em] text-muted-2 uppercase">{heroEyebrow}</p>
        <h1 className="mt-3 leading-[1.02] font-black text-deep-900">
          <span className="font-sticker block text-4xl sm:text-5xl lg:text-[3.4rem]">{heroHeadline}</span>
          <span className="font-script mt-1 block text-5xl leading-none text-brand-600 sm:text-6xl lg:text-7xl">
            {heroHeadlineAccent}
          </span>
        </h1>
        <p className="mt-5 max-w-md text-base text-muted sm:text-lg">{currentSlide.subtitle}</p>

        <div className="mt-7 flex flex-wrap items-center gap-6">
          <Link
            href={currentSlide.href}
            className="group inline-flex items-center gap-3 rounded-full bg-brand-gradient py-1.5 ps-6 pe-1.5 font-bold text-deep-900 shadow-[0_10px_24px_-8px_rgba(84,120,41,0.6)] transition-transform hover:-translate-y-0.5"
          >
            {heroCta}
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-deep-800 text-white transition-transform group-hover:scale-110">
              <ArrowIcon className="h-4 w-4" />
            </span>
          </Link>
          <p className="font-script -rotate-3 text-xl leading-[1.15] text-deep-700 sm:text-2xl">
            {heroNote.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
            <svg viewBox="0 0 90 12" className="mt-1 h-2.5 w-16 text-deep-700" aria-hidden="true">
              <path
                d="M2 8c8-8 14 2 22-4s14 4 22-2 14 3 22-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </p>
        </div>

        {hasMultiple && (
          <div className="mt-8 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}`}
                aria-current={i === selectedIndex}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-2 rounded-full transition-all ${i === selectedIndex ? "w-6 bg-brand-600" : "w-2 bg-brand-600/25 hover:bg-brand-600/40"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Image column -- floating rounded photo, no diagonal panel seam */}
      <div className="relative order-1 lg:order-2">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-[2.5rem] shadow-[var(--shadow-lifted)] sm:aspect-square lg:aspect-[4/3]"
          ref={emblaRef}
        >
          <div className="flex h-full">
            {slides.map((slide, i) => (
              <div key={i} className="relative h-full min-w-0 flex-[0_0_100%]">
                <Image
                  src={slide.image}
                  alt={slide.subtitle}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rotated "sticker" tag, hugging the image's bottom corner -- an
            irregular torn-paper outline (.sticker-tag) plus a gradient give
            it real depth instead of reading as a flat rounded box. Fixed
            English brand flourish, not translated (kept identical in both
            locales), set in a bold rounded display face distinct from the
            rest of the site's type system. */}
        <div className="sticker-tag absolute -bottom-5 start-6 z-10 -rotate-[9deg] bg-gradient-to-br from-deep-600 via-deep-700 to-deep-900 px-5 py-3 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.45)] sm:px-6 sm:py-3.5">
          <p className="font-sticker text-lg leading-[1.05] font-extrabold whitespace-nowrap text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] sm:text-2xl">
            Unprocess
            <br />
            your food
          </p>
        </div>

        {/* Small floating "paper" note -- warm off-white card, rotated,
            reads like a physical tag clipped to the produce rather than a
            UI tooltip. */}
        <div className="absolute -top-4 end-4 z-10 max-w-[9rem] rotate-[6deg] rounded-2xl bg-[#fbf7ea] px-3.5 py-3 shadow-[0_12px_24px_-10px_rgba(28,55,40,0.35)] sm:end-8">
          <Leaf className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
          <p className="font-script mt-1 text-sm leading-[1.15] font-semibold text-deep-800 sm:text-base">
            {heroPaperTag.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}
