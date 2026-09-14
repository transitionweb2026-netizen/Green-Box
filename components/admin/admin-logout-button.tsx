"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

export function AdminLogoutButton({ tone = "light" }: { tone?: "light" | "dark" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50",
        tone === "dark" ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-danger hover:bg-danger-bg",
      )}
    >
      <LogOut className="h-4 w-4" />
      تسجيل الخروج
    </button>
  );
}
