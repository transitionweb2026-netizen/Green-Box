import { ShoppingCart } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function CartLink({ count, label }: { count: number; label: string }) {
  return (
    <Link
      href="/cart"
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border-strong bg-white/70 text-deep-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
      aria-label={label}
    >
      <ShoppingCart className="h-5 w-5" strokeWidth={2} />
      {count > 0 && (
        <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white shadow-sm">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
