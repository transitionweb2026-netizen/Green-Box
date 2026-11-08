"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getAccountCartStateAction, type AccountCartState } from "./account-cart-state";

const DEFAULT_STATE: AccountCartState = { isLoggedIn: false, cartCount: 0 };
const STORAGE_KEY = "gb_account_cart_state";

/**
 * Sessionless per-viewer hint only -- never the source of truth (the
 * server action call in the provider below always overwrites it once it
 * resolves). Lets a returning visitor who was logged in / had cart items
 * see the right icon immediately instead of the generic default while
 * waiting for that round-trip.
 *
 * Read via useSyncExternalStore (same pattern hero-carousel.tsx already
 * uses for Embla's selectedIndex), not useState+useEffect: that's the
 * one hook React provides specifically for a value that can legitimately
 * differ between the server render and the client's first read of an
 * external store, with an explicit getServerSnapshot -- it avoids both
 * the hydration-mismatch risk of reading localStorage during a plain
 * lazy useState initializer and the "setState synchronously in an
 * effect" issue of reading it in a useEffect body.
 */
function subscribe() {
  return () => {};
}

// getSnapshot must return a STABLE reference when nothing has actually
// changed -- useSyncExternalStore compares successive snapshots with
// Object.is, and JSON.parse() returns a brand-new object every call even
// for the identical string. Returning a fresh object on every call (the
// original bug here) makes it conclude "changed" on every single check,
// forever, which is an infinite render loop (React error #185, "Maximum
// update depth exceeded") the moment localStorage actually has a value
// to parse -- it crashed the tab for any returning visitor, confirmed
// live. Caching the last raw string alongside its parsed result, and
// only re-parsing when the raw string itself differs, is what makes
// repeated calls return the SAME reference when the stored value hasn't
// changed.
let cachedRaw: string | null = null;
let cachedSnapshot: AccountCartState = DEFAULT_STATE;

function getSnapshot(): AccountCartState {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;

  if (!raw) {
    cachedSnapshot = DEFAULT_STATE;
    return cachedSnapshot;
  }
  try {
    const parsed = JSON.parse(raw);
    cachedSnapshot =
      typeof parsed?.isLoggedIn === "boolean" && typeof parsed?.cartCount === "number" ? parsed : DEFAULT_STATE;
  } catch {
    cachedSnapshot = DEFAULT_STATE;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): AccountCartState {
  return DEFAULT_STATE;
}

function writeCachedState(state: AccountCartState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing / storage disabled -- the provider still works,
    // every visit just waits for the real fetch instead of the hint.
  }
}

interface AccountCartContextValue extends AccountCartState {
  /** Re-runs the server action and pushes the result to every consumer --
   * call after add/remove/update-cart so the header's badge updates
   * without a full page reload. */
  refresh: () => void;
}

const AccountCartContext = createContext<AccountCartContextValue>({ ...DEFAULT_STATE, refresh: () => {} });

/**
 * Wraps the header (see site-header.tsx) so the account icon and cart
 * badge can read real login/cart state without SiteHeader itself being a
 * Server Component that calls cookies() -- that single call used to force
 * every storefront page into fully dynamic rendering.
 */
export function AccountCartProvider({ children }: { children: ReactNode }) {
  const cachedState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [liveState, setLiveState] = useState<AccountCartState | null>(null);
  const pathname = usePathname();

  function refresh() {
    getAccountCartStateAction().then((fresh) => {
      setLiveState(fresh);
      writeCachedState(fresh);
    });
  }

  useEffect(() => {
    refresh();
    // Re-runs on every pathname change too, not just mount: login and
    // logout redirect server-side (redirect() in a Server Action /
    // router.push after signOut), which Next.js turns into a client-side
    // route transition that does NOT remount this provider (it lives in
    // the root layout, above every page) -- without this, the header
    // would keep showing the pre-auth-change state after either one.
    // Cart mutations don't navigate, so they still call refresh()
    // explicitly themselves (add-to-cart-button.tsx, cart-item-row.tsx).
  }, [pathname]);

  // liveState (the server action's real answer) wins once it resolves;
  // cachedState (the localStorage hint) only covers the gap before that.
  const state = liveState ?? cachedState;

  return <AccountCartContext.Provider value={{ ...state, refresh }}>{children}</AccountCartContext.Provider>;
}

export function useAccountCartState(): AccountCartContextValue {
  return useContext(AccountCartContext);
}
