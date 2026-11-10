import { cn } from "@/lib/utils/cn";

/**
 * A customer's identity, reduced to one letter -- no photo upload exists
 * (or is needed) for this account system, so the avatar is this instead of
 * a silhouette/placeholder icon: same brand-gradient treatment already
 * used for AccountNav's active pill and primary buttons, so it reads as
 * "this site's own" rather than a generic UI-kit avatar.
 */
export function AvatarInitial({ name, className }: { name?: string | null; className?: string }) {
  const letter = name?.trim()?.[0]?.toUpperCase() ?? "";
  return (
    <span
      className={cn(
        "bg-brand-gradient ring-background inline-flex shrink-0 items-center justify-center rounded-full font-serif font-bold text-white shadow-[var(--shadow-lifted)] ring-2",
        className,
      )}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}
