"use client";

import { ShoppingCart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAccountCartState } from "./account-cart-provider";

/** count no longer a prop -- read from AccountCartProvider's context so
 * SiteHeader doesn't have to fetch it server-side (see
 * account-cart-provider.tsx). The badge is `absolute`, taken out of
 * normal flow, so this icon's own h-10 w-10 box never shifts size
 * whether the badge is showing yet or not. */
export function CartLink({ label }: { label: string }) {
  const { cartCount } = useAccountCartState();

  return (
    <Link
      href="/cart"
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border-strong bg-white/70 text-deep-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
      aria-label={label}
    >
      <ShoppingCart className="h-5 w-5" strokeWidth={2} />
      {cartCount > 0 && (
        <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white shadow-sm">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </Link>
  );
}
