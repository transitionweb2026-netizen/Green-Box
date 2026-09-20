"use client";

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
 * site-header.tsx.
 */
export function PillNav({ links }: { links: PillNavLink[] }) {
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
    </nav>
  );
}
