"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/i18n/localized";
import type { Category, CategoryMenuProduct } from "@/lib/services/catalog";

export interface CategoryMenu {
  category: Category;
  products: CategoryMenuProduct[];
}

/**
 * The bold, always-visible row of every active category, sitting right
 * under the main header row -- distinct from the categories GRID further
 * down the homepage (app/[locale]/page.tsx), which is a browse destination
 * rather than a persistent nav element. Solid deep-green is a deliberate,
 * one-off exception to the site's usual translucent "glass" surfaces: this
 * is the site's single strongest wayfinding element and reads better as a
 * confident color block than another light panel.
 *
 * Hovering (or focusing) a category opens a full-width mega-menu below the
 * whole bar -- not anchored under the individual link -- listing that
 * category's products (flat, since the catalog has no subcategory tier
 * today). A client component because the open category is real interactive
 * state; every string/number here is pre-fetched and pre-localized in
 * site-header.tsx so no server data fetching happens on hover.
 *
 * Category links sit in a flex-1 `justify-evenly` group between the Green
 * Box link and the Home icon, so they spread across the bar's full width
 * instead of clumping at the start with a large empty gap before Home.
 */
export function CategoryNavBar({
  categoryMenus,
  locale,
  greenBoxLabel,
  homeLabel,
  viewAllLabel,
  noItemsLabel,
}: {
  categoryMenus: CategoryMenu[];
  locale: string;
  greenBoxLabel: string;
  homeLabel: string;
  viewAllLabel: string;
  noItemsLabel: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openMenu = categoryMenus.find((menu) => menu.category.id === openId) ?? null;
  const ArrowIcon = locale === "en" ? ArrowRight : ArrowLeft;

  // A short grace period before closing (cancelled by re-entering a
  // trigger or the panel itself) so a quick diagonal mouse path from the
  // row down into the panel, or a brief gap between adjacent triggers,
  // doesn't flicker the menu shut.
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
  }, []);
  const open = (id: string) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpenId(id);
  };
  const scheduleClose = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => setOpenId(null), 150);
  };

  const linkClass =
    "shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold whitespace-nowrap text-white/90 transition-colors hover:bg-white/15 hover:text-white";

  return (
    <nav
      aria-label="categories"
      className="relative bg-deep-700 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
      onMouseLeave={scheduleClose}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) scheduleClose();
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-1">
        <Link href="/box" className={`${linkClass} shrink-0 text-brand-300 hover:text-brand-200`}>
          {greenBoxLabel}
        </Link>
        <div className="flex flex-1 items-center justify-evenly gap-1">
          {categoryMenus.map(({ category }) => (
            <div key={category.id} onMouseEnter={() => open(category.id)}>
              <Link href={`/c/${category.slug}`} className={linkClass} onFocus={() => open(category.id)}>
                {pickLocalized(category.name_ar, category.name_en, locale)}
              </Link>
            </div>
          ))}
        </div>
        <Link
          href="/"
          aria-label={homeLabel}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-400 text-deep-900 transition-colors hover:bg-gold-500"
        >
          <Home className="h-4 w-4" />
        </Link>
      </div>

      {openMenu && (
        <div
          className="absolute inset-x-0 top-full z-50 border-t border-white/10 bg-background shadow-[var(--shadow-lifted)]"
          onMouseEnter={() => open(openMenu.category.id)}
        >
          <div className="mx-auto max-w-7xl px-6 py-6">
            <h3 className="mb-4 text-sm font-bold text-deep-800">
              {pickLocalized(openMenu.category.name_ar, openMenu.category.name_en, locale)}
            </h3>
            {openMenu.products.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {openMenu.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/p/${product.slug}`}
                    className="truncate rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-brand-50 hover:text-brand-700"
                    onClick={() => setOpenId(null)}
                  >
                    {pickLocalized(product.name_ar, product.name_en, locale)}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">{noItemsLabel}</p>
            )}
            <div className="mt-4 border-t border-border pt-4">
              <Link
                href={`/c/${openMenu.category.slug}`}
                className="flex w-fit items-center gap-1.5 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800"
                onClick={() => setOpenId(null)}
              >
                {viewAllLabel}
                <ArrowIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
