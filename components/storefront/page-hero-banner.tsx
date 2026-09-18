"use client";

import { usePathname } from "@/i18n/navigation";
import { AppImage as Image } from "@/components/ui/app-image";

/**
 * A compact reprise of the homepage hero (same fixed photo, green panel,
 * diagonal seam, and rotated sticker -- see hero-carousel.tsx) shown at
 * roughly half the height atop every OTHER page, so the brand identity
 * carries through site-wide instead of the homepage being the only page
 * with a hero treatment. Drops the heading/checkmarks/CTA button (those
 * are homepage-specific selling points, not something to repeat on every
 * page) rather than literally clipping the full hero's DOM, which would
 * leave a half-cut button behind.
 *
 * usePathname() (not a route-group split) is what hides this on the
 * homepage itself -- "/" already has the full-size hero via HeroCarousel.
 */
export function PageHeroBanner({ locale, siteName }: { locale: string; siteName: string }) {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const isAr = locale !== "en";
  const imageClipClass = isAr ? "hero-image-clip--rtl" : "hero-image-clip--ltr";

  return (
    <div className="relative grid grid-cols-1 overflow-hidden bg-brand-200 lg:grid-cols-[54%_46%]">
      <div className={`relative h-20 overflow-hidden sm:h-24 lg:h-auto ${imageClipClass}`}>
        <Image src="/images/hero.jpg" alt="" fill priority sizes="(max-width: 1024px) 100vw, 54vw" className="object-cover" />
      </div>

      <div className="absolute top-[30%] start-1/2 z-20 -translate-x-1/2 -translate-y-1/2 -rotate-[9deg] rounded-md bg-deep-700 px-2.5 py-1 shadow-[0_4px_10px_rgba(0,0,0,0.3)] lg:start-[52%]">
        <p className="font-sticker text-[0.65rem] leading-[1.05] font-extrabold whitespace-nowrap text-white sm:text-xs">
          Unprocess
          <br />
          your food
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-4 lg:justify-start lg:px-12">
        <span className="font-serif text-lg font-extrabold text-deep-900 sm:text-xl">{siteName}</span>
      </div>
    </div>
  );
}
