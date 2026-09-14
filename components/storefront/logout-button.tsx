"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
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
