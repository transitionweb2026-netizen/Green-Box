"use client";

import { Search } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

export interface PillNavLink {
  href: string;
  label: string;
}

/**
 * The header's centered pill-shaped primary nav, per the reference design.
 * A client component only because "which item is active" depends on the
 * current pathname -- every label/href is pre-resolved server-side in
 * site-header.tsx. The trailing search icon lives inside the same glass
 * capsule (per the reference) and links straight to the real /search page
 * -- the header's own full SearchBox (with its live suggestions) is kept
 * separately for large screens rather than replaced by this icon.
 */
export function PillNav({ links, searchLabel }: { links: PillNavLink[]; searchLabel: string }) {
  const pathname = usePathname();

  return (
    <nav className="pill-nav hidden lg:inline-flex" aria-label="primary">
      {links.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn("pill-nav-link", isActive && "pill-nav-link--active")}
          >
            {link.label}
          </Link>
        );
      })}
      <Link
        href="/search"
        aria-label={searchLabel}
        className="ms-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-deep-700 transition-colors hover:bg-brand-50"
      >
        <Search className="h-4 w-4" strokeWidth={2} />
      </Link>
    </nav>
  );
}
