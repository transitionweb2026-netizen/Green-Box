"use client";

import { LogIn } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AvatarInitial } from "@/components/ui/avatar-initial";
import { useAccountCartState } from "./account-cart-provider";

/**
 * Replaces SiteHeader's old inline {!user ? login : account} icon --
 * both branches were already the exact same h-10 w-10 box, just a
 * different href/icon/label, so swapping which one shows post-hydration
 * never shifts layout, only (briefly, for a first-time-this-session
 * visitor) the icon itself. See account-cart-provider.tsx.
 *
 * Logged-in state swapped from a generic User icon to the customer's own
 * initial avatar -- same h-10 w-10 footprint, no layout shift, but now
 * reads as "your account" rather than a stock icon.
 */
export function AccountIconLink({
  loginLabel,
  accountLabel,
  className,
}: {
  loginLabel: string;
  accountLabel: string;
  className?: string;
}) {
  const { isLoggedIn, firstName } = useAccountCartState();

  return isLoggedIn ? (
    <Link href="/account" className={className} aria-label={accountLabel}>
      <AvatarInitial name={firstName} className="h-8 w-8 text-sm" />
    </Link>
  ) : (
    <Link href="/auth/login" className={className} aria-label={loginLabel}>
      <LogIn className="h-4 w-4" strokeWidth={1.75} />
    </Link>
  );
}
