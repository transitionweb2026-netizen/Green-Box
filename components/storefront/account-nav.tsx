"use client";

import { User, MapPin, Package, Sparkles, RefreshCw } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { LogoutButton } from "./logout-button";

const ICONS = {
  profile: User,
  addresses: MapPin,
  orders: Package,
  loyalty: Sparkles,
  subscriptions: RefreshCw,
} as const;

export function AccountNav({
  links,
  logoutLabel,
}: {
  links: { key: keyof typeof ICONS; href: string; label: string }[];
  logoutLabel: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="glass flex gap-1 overflow-x-auto !p-2 md:flex-col md:overflow-visible">
      {links.map((link) => {
        const Icon = ICONS[link.key];
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              isActive ? "bg-brand-gradient text-white shadow-sm" : "text-foreground hover:bg-brand-50",
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
      <div className="my-1 hidden divider-fade md:block" />
      <LogoutButton label={logoutLabel} />
    </nav>
  );
}
