"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Leaf } from "lucide-react";
import { AppImage as Image } from "@/components/ui/app-image";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/i18n/localized";
import type { Banner } from "@/lib/services/content";
import type { AvailableProduceImage } from "@/lib/media/produce";
import { GreenBoxGraphic } from "./green-box-graphic";

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
  /** Optional art-directed mobile crop, uploaded separately in
   * /admin/content -- falls back to `image` when not set. */
  imageMobile?: string;
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
  produceImages,
  cartSummary,
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
  produceImages: AvailableProduceImage[];
  /** Rendered server-side (it reads the real cart) and handed down as a
   * slot -- a client component can't import/invoke an async Server
   * Component itself, but it can render one passed in as a prop/child. */
  cartSummary: ReactNode;
}) {
  const isAr = locale !== "en";
  const direction = isAr ? "rtl" : "ltr";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  // No admin banners configured -> show the permanent branded "Green Box"
  // packaging + produce composition instead of a rotating promo photo.
  // A real admin banner (when the admin adds one) still takes priority.
  const showBoxComposition = banners.length === 0;

  const slides: HeroSlide[] = useMemo(() => {
    if (banners.length === 0) {
      return [{ subtitle: heroSubtitleFallback, image: FIXED_HERO_IMAGE, href: "/c" }];
    }
    return banners.map((banner) => ({
      subtitle: pickLocalized(banner.title_ar ?? "", banner.title_en, locale) || heroSubtitleFallback,
      image: banner.image_url || FIXED_HERO_IMAGE,
      imageMobile: banner.image_url_mobile ?? undefined,
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
      className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 py-8 sm:py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-6 xl:grid-cols-[1.05fr_1fr_0.62fr] xl:gap-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Text column -- static two-tone brand headline, never rotates */}
      <div className="relative z-10 order-2 lg:order-1">
        <p className="text-xs leading-relaxed font-bold tracking-[0.25em] text-muted-2 uppercase">
          {heroEyebrow.split("\n").map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </p>
        <h1 className="mt-3 leading-[0.95] font-black text-deep-900">
          <span className="font-sticker block text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem]">{heroHeadline}</span>
          <span className="font-script mt-2 block text-6xl leading-none text-brand-600 sm:text-7xl lg:text-8xl xl:text-9xl">
            {heroHeadlineAccent}
          </span>
        </h1>
        <p className="mt-5 max-w-md text-base text-muted sm:text-lg">{currentSlide.subtitle}</p>

        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Link
            href={currentSlide.href}
            className="group inline-flex items-center gap-4 rounded-full bg-brand-gradient py-2 ps-8 pe-2 text-lg font-bold text-deep-900 shadow-[0_14px_30px_-8px_rgba(84,120,41,0.6)] transition-transform hover:-translate-y-0.5 sm:text-xl"
          >
            {heroCta}
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-deep-800 text-white transition-transform group-hover:scale-110 sm:h-14 sm:w-14">
              <ArrowIcon className="h-5 w-5" />
            </span>
          </Link>
          <p className="font-script -rotate-3 text-xl leading-[1.1] text-deep-700 sm:text-2xl">
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

      {/* Box/produce column -- large, close to the headline, no dead gap */}
      <div className="relative order-1 lg:order-2">
        {showBoxComposition ? (
          <div className="relative aspect-square w-full sm:aspect-[6/5]">
            <GreenBoxGraphic className="absolute inset-x-0 bottom-0 h-[58%]" />
            {produceImages.map((item) => (
              <div
                key={item.name}
                className="absolute"
                style={{
                  top: item.top,
                  insetInlineStart: item.start,
                  width: item.width,
                  zIndex: item.zIndex,
                  transform: `rotate(${item.rotate})`,
                }}
              >
                <Image
                  src={item.src}
                  alt={item.name}
                  width={700}
                  height={700}
                  sizes="(max-width: 1024px) 45vw, 26vw"
                  className="h-auto w-full object-contain drop-shadow-[0_24px_28px_rgba(14,27,20,0.35)]"
                />
              </div>
            ))}

            {/* Small floating "paper" note -- tucked against the produce
                cluster's upper-right, like a tag physically clipped to it,
                rather than floating at the outer image corner. */}
            <div className="absolute end-[6%] top-[6%] z-20 max-w-[8.5rem] rotate-[6deg] rounded-2xl bg-[#fbf7ea] px-3.5 py-3 shadow-[0_12px_24px_-10px_rgba(28,55,40,0.35)]">
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
        ) : (
          <div
            className="relative aspect-[4/3] w-full overflow-hidden rounded-[2.5rem] shadow-[var(--shadow-lifted)] sm:aspect-square lg:aspect-[4/3]"
            ref={emblaRef}
          >
            <div className="flex h-full">
              {slides.map((slide, i) => (
                <div key={i} className="relative h-full min-w-0 flex-[0_0_100%]">
                  {/* Art-directed crop swap: a genuinely different mobile
                      image (not just a resize of the desktop one) when the
                      admin has uploaded one, else the same image both ways. */}
                  <Image
                    src={slide.imageMobile || slide.image}
                    alt={slide.subtitle}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className="object-cover sm:hidden"
                  />
                  <Image
                    src={slide.image}
                    alt={slide.subtitle}
                    fill
                    priority={i === 0}
                    sizes="50vw"
                    className="hidden object-cover sm:block"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cart-card column -- far right, vertically aligned with the box,
          part of the grid (not an absolute overlay) so it reflows properly
          instead of disappearing below a fixed breakpoint. */}
      <div className="relative order-3 hidden xl:block">{cartSummary}</div>
    </div>
  );
}
