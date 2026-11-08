"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { useAccountCartState } from "./account-cart-provider";

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // SiteHeader's account icon/cart badge are client-fetched once on
  // mount (account-cart-provider.tsx) -- a client-side route change
  // (router.push below) doesn't remount that provider, so without this
  // the header would keep showing "logged in" after signing out.
  const { refresh: refreshAccountCartState } = useAccountCartState();

  function handleLogout() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
      refreshAccountCartState();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-start text-sm font-semibold whitespace-nowrap text-danger transition-colors hover:bg-danger-bg disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      {label}
    </button>
  );
}
