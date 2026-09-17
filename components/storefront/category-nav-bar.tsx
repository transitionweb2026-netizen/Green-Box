import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/i18n/localized";
import type { Category } from "@/lib/services/catalog";

/**
 * The bold, always-visible row of every active category, sitting right
 * under the main header row -- distinct from the categories GRID further
 * down the homepage (app/[locale]/page.tsx), which is a browse destination
 * rather than a persistent nav element. Solid deep-green is a deliberate,
 * one-off exception to the site's usual translucent "glass" surfaces: this
 * is the site's single strongest wayfinding element and reads better as a
 * confident color block than another light panel.
 */
export async function CategoryNavBar({
  categories,
  greenBoxLabel,
  homeLabel,
}: {
  categories: Category[];
  greenBoxLabel: string;
  homeLabel: string;
}) {
  const locale = await getLocale();

  const linkClass =
    "shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold whitespace-nowrap text-white/90 transition-colors hover:bg-white/15 hover:text-white";

  return (
    <nav
      aria-label="categories"
      className="bg-deep-700 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-1">
        <Link href="/box" className={`${linkClass} text-brand-300 hover:text-brand-200`}>
          {greenBoxLabel}
        </Link>
        {categories.map((category) => (
          <Link key={category.id} href={`/c/${category.slug}`} className={linkClass}>
            {pickLocalized(category.name_ar, category.name_en, locale)}
          </Link>
        ))}
        <Link
          href="/"
          className="ms-auto shrink-0 rounded-lg bg-gold-400 px-3.5 py-2 text-sm font-bold whitespace-nowrap text-deep-900 transition-colors hover:bg-gold-500"
        >
          {homeLabel}
        </Link>
      </div>
    </nav>
  );
}
