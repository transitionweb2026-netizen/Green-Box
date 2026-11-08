"use client";

import { Link } from "@/i18n/navigation";
import { useAccountCartState } from "./account-cart-provider";

/** The thin utility bar's text account/login+register links -- reads
 * from AccountCartProvider's context for the same reason as
 * AccountIconLink/CartLink/MobileNav. Unlike those (fixed-size icon
 * boxes), "Account" vs "Login + Register" are genuinely different
 * widths, but this bar is `justify-between` with free space on both
 * sides, so the swap only moves within this group's own flex item --
 * it doesn't push any other element on the page. */
export function UtilityAccountLinks({
  accountLabel,
  loginLabel,
  registerLabel,
}: {
  accountLabel: string;
  loginLabel: string;
  registerLabel: string;
}) {
  const { isLoggedIn } = useAccountCartState();

  return isLoggedIn ? (
    <Link href="/account" className="transition-colors hover:text-brand-700">
      {accountLabel}
    </Link>
  ) : (
    <>
      <Link href="/auth/login" className="transition-colors hover:text-brand-700">
        {loginLabel}
      </Link>
      <Link href="/auth/register" className="font-semibold text-brand-700 transition-colors hover:text-brand-800">
        {registerLabel}
      </Link>
    </>
  );
}
