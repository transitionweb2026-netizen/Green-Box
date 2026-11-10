"use client";

import { LogIn, UserPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AvatarInitial } from "@/components/ui/avatar-initial";
import { useAccountCartState } from "./account-cart-provider";

/** The thin utility bar's text account/login+register links -- reads
 * from AccountCartProvider's context for the same reason as
 * AccountIconLink/CartLink/MobileNav. Unlike those (fixed-size icon
 * boxes), "Account" vs "Login + Register" are genuinely different
 * widths, but this bar is `justify-between` with free space on both
 * sides, so the swap only moves within this group's own flex item --
 * it doesn't push any other element on the page. Small icons/avatar
 * added for a touch more weight than bare text, sized to this bar's own
 * text-xs scale rather than the header's full-size icons. */
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
    <Link href="/account" className="flex items-center gap-1.5 transition-colors hover:text-brand-700">
      <AvatarInitial name={firstName} className="h-4 w-4 text-[0.6rem]" />
      {accountLabel}
    </Link>
  ) : (
    <>
      <Link href="/auth/login" className="flex items-center gap-1 transition-colors hover:text-brand-700">
        <LogIn className="h-3 w-3" strokeWidth={2} />
        {loginLabel}
      </Link>
      <Link
        href="/auth/register"
        className="flex items-center gap-1 font-semibold text-brand-700 transition-colors hover:text-brand-800"
      >
        <UserPlus className="h-3 w-3" strokeWidth={2} />
        {registerLabel}
      </Link>
    </>
  );
}
