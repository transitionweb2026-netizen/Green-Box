import { Link } from "@/i18n/navigation";

export function CartLink({ count, label }: { count: number; label: string }) {
  return (
    <Link href="/cart" className="relative hover:text-brand-700" aria-label={label}>
      {label}
      {count > 0 && (
        <span className="absolute -end-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-medium text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
