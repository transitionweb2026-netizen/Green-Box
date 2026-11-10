import { Sparkles } from "lucide-react";
import { AvatarInitial } from "@/components/ui/avatar-initial";

/**
 * Sits above AccountNav in the account sidebar -- same bg-deep-gradient +
 * blob treatment the loyalty page's own balance hero already uses, so the
 * account section opens on that same "VIP card" language instead of
 * dropping straight into a plain settings form. Points are optional (the
 * loyalty program can be disabled, or a customer may not have an account
 * row yet -- see getMyLoyaltyAccount's own doc comment) and simply don't
 * render when absent, rather than showing a misleading "0".
 */
export function AccountProfileCard({
  name,
  email,
  points,
  pointsLabel,
}: {
  name: string;
  email: string;
  points?: number | null;
  pointsLabel?: string;
}) {
  return (
    <div className="bg-deep-gradient relative overflow-hidden rounded-[var(--radius-card)] p-5 text-white">
      <div className="blob -top-10 -end-10 h-32 w-32 bg-brand-500/25" aria-hidden="true" />
      <div className="relative flex items-center gap-3">
        <AvatarInitial name={name} className="h-14 w-14 text-xl" />
        <div className="min-w-0">
          {/* dir="auto" (not a hardcoded ltr/rtl) -- a customer's name can
              be typed in Arabic or Latin script regardless of site locale,
              and text-overflow: ellipsis truncates from the paragraph's
              OWN direction, not the script of the text inside it. Without
              this, a Latin name inside the ambient dir="rtl" page clipped
              from the wrong end (showed "...n Eltanany" instead of "Akram
              Ayman E..."). */}
          <p dir="auto" className="truncate font-serif text-lg font-bold">
            {name}
          </p>
          <p dir="ltr" className="truncate text-end text-xs text-white/60">
            {email}
          </p>
        </div>
      </div>
      {typeof points === "number" && (
        <div className="relative mt-4 flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-brand-200">
          <Sparkles className="h-3.5 w-3.5" />
          {points} {pointsLabel}
        </div>
      )}
    </div>
  );
}
