"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { getCartItemCountForUser, getCartSummaryForCurrentUser, type CartSummary } from "@/lib/services/cart";

export interface AccountCartState {
  isLoggedIn: boolean;
  cartCount: number;
}

/**
 * The one remaining per-user read the header needs (login state + cart
 * badge count) -- pulled out of SiteHeader's own render so the header
 * itself no longer calls cookies() on every page. A Server Action is
 * always on-demand/dynamic by nature regardless of how the PAGE that
 * calls it is rendered, so invoking this from a client component after
 * mount has zero effect on that page's own static-ness, unlike calling
 * getCurrentUser() directly inside a Server Component in the render tree.
 */
export async function getAccountCartStateAction(): Promise<AccountCartState> {
  const user = await getCurrentUser();
  const cartCount = user ? await getCartItemCountForUser() : 0;
  return { isLoggedIn: !!user, cartCount };
}

/** Same reasoning as getAccountCartStateAction, for HeroCartSummary's
 * richer "Your Box" widget (full items, not just a count). */
export async function getHeroCartSummaryAction(): Promise<CartSummary> {
  return getCartSummaryForCurrentUser();
}
