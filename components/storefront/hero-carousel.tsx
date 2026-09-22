"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
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

// The real, final "Green Box" packaging + produce composition (transparent
// background), replacing the earlier CSS-built box + individual produce
// cutout system entirely -- see hero-carousel.tsx git history for that.
const BOX_COMPOSITION_IMAGE = "/images/hero-green-box.webp";

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
      className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 py-8 sm:py-10 lg:grid-cols-[0.95fr_1.2fr] lg:gap-4 xl:grid-cols-[0.95fr_1.3fr_0.58fr] xl:gap-6"
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
        {/* The script accent font (Caveat) bakes a lot of extra vertical
            space into its own line box (room for tall ascenders/loops)
            even at leading-none, so closing the gap to the line above --
            and to the subtitle below -- takes negative margins, not just
            removing positive ones. */}
        <h1 className="mt-3 leading-[0.95] font-black text-deep-900">
          <span className="font-sticker block text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem]">{heroHeadline}</span>
          <span className="font-script -mt-3 block text-6xl leading-none text-brand-600 sm:-mt-4 sm:text-7xl lg:-mt-5 lg:text-8xl xl:-mt-7 xl:text-9xl">
            {heroHeadlineAccent}
          </span>
        </h1>
        <p className="-mt-3 max-w-md text-base text-muted sm:-mt-4 sm:text-lg lg:-mt-5 xl:-mt-6">{currentSlide.subtitle}</p>

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

      {/* Box/produce column -- the hero's focal object: sized to bleed
          slightly past its own grid cell so it dominates the composition
          rather than sitting politely inside it. */}
      <div className="relative order-1 lg:order-2 lg:-mx-6 xl:-mx-10">
        {showBoxComposition ? (
          <div className="relative aspect-[4/3] w-full" style={{ perspective: "1600px" }}>
            {/* Ambient glow -- a soft, wide halo behind the box so it
                separates from the botanical backdrop by light, not a hard
                edge, and reads as lit by the same soft daylight as the
                environment around it. Sized generously so the box reads as
                the hero's focal point at a glance. */}
            <div
              className="absolute inset-[2%] rounded-full bg-brand-200/45 blur-3xl"
              aria-hidden="true"
            />
            {/* Contact shadow -- grounds the box in the scene: soft,
                diffused, greenish-neutral (never black), widest right under
                the box and fading out, rather than a generic drop-shadow
                that would just outline the PNG. */}
            <div
              className="absolute inset-x-[10%] bottom-[6%] h-[12%] rounded-[50%] bg-deep-900/25 blur-2xl"
              aria-hidden="true"
            />
            <Image
              src={BOX_COMPOSITION_IMAGE}
              alt={heroHeadline}
              fill
              priority
              sizes="(max-width: 1024px) 95vw, 55vw"
              className="relative object-contain drop-shadow-[0_10px_12px_rgba(14,27,20,0.32)] drop-shadow-[0_40px_44px_rgba(14,27,20,0.3)]"
              style={{ transform: "rotateY(-4deg) rotateX(2deg)" }}
            />
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
