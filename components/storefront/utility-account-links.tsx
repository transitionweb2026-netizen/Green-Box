"use client";

import { LogIn, UserPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AvatarInitial } from "@/components/ui/avatar-initial";
import { useAccountCartState } from "./account-cart-provider";

const pillClass =
  "flex items-center gap-1 rounded-full bg-brand-600 py-1 pe-3 ps-2.5 font-semibold text-white transition-colors hover:bg-brand-700";

/** The thin utility bar's account/login+register pills -- reads from
 * AccountCartProvider's context for the same reason as
 * AccountIconLink/CartLink/MobileNav. Unlike those (fixed-size icon
 * boxes), "Account" vs "Login + Register" are genuinely different
 * widths, but this bar is `justify-between` with free space on both
 * sides, so the swap only moves within this group's own flex item --
 * it doesn't push any other element on the page. Solid brand-green
 * pills (not bare text) sized to this bar's own text-xs scale. */
export function UtilityAccountLinks({
  accountLabel,
  loginLabel,
  registerLabel,
}: {
  accountLabel: string;
  loginLabel: string;
  registerLabel: string;
}) {
  const { isLoggedIn, firstName } = useAccountCartState();

  return isLoggedIn ? (
    <Link href="/account" className={pillClass}>
      <AvatarInitial name={firstName} className="h-4 w-4 text-[0.6rem]" />
      {accountLabel}
    </Link>
  ) : (
    <>
      <Link href="/auth/login" className={pillClass}>
        <LogIn className="h-3 w-3" strokeWidth={2} />
        {loginLabel}
      </Link>
      <Link href="/auth/register" className={pillClass}>
        <UserPlus className="h-3 w-3" strokeWidth={2} />
        {registerLabel}
      </Link>
    </>
  );
}
