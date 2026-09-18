"use client";

import { useState, useTransition } from "react";
import { AppImage as Image } from "@/components/ui/app-image";
import { Minus, Plus, Trash2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { pickLocalized, formatPrice } from "@/lib/i18n/localized";
import { categoryPlaceholderKey, placeholderImage } from "@/lib/media/placeholders";
import { cn } from "@/lib/utils/cn";
import { removeCartItemAction, updateCartItemAction, updateCartItemNotesAction } from "@/app/[locale]/cart/actions";
import type { CartItemWithProduct } from "@/lib/services/cart";

export function CartItemRow({ item }: { item: CartItemWithProduct }) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(item.notes ?? "");
  const name = pickLocalized(item.products.name_ar, item.products.name_en, locale);
  const image = item.products.product_images.find((img) => img.is_primary) ?? item.products.product_images[0];
  const isUnavailable = !item.products.is_available;

  const unit = pickLocalized(item.products.unit_label_ar ?? "", item.products.unit_label_en, locale);

  // Same 0.1-step, floating-point-safe rounding as ProductPurchaseForm, so
  // a fractional quantity set at add-to-cart time (e.g. 1.2 kg) keeps
  // adjusting in matching increments here rather than jumping by whole
  // units.
  function updateQuantity(quantity: number) {
    startTransition(() => updateCartItemAction(locale, item.id, Number(quantity.toFixed(1))));
  }

  function remove() {
    startTransition(() => removeCartItemAction(locale, item.id));
  }

  function saveNotes() {
    if (notes.trim() === (item.notes ?? "")) return;
    startTransition(() => updateCartItemNotesAction(locale, item.id, notes));
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 border-b border-border/70 py-4 transition-opacity last:border-b-0 sm:flex-nowrap",
        isPending && "opacity-50",
      )}
    >
      <Link href={`/p/${item.products.slug}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-50">
        <Image
          src={image?.url ?? placeholderImage(categoryPlaceholderKey(item.products.categories?.slug), { width: 100, height: 100 })}
          alt={name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/p/${item.products.slug}`} className="line-clamp-1 font-semibold text-foreground hover:text-brand-700">
          {name}
        </Link>
        {isUnavailable ? (
          <Badge tone="danger" className="mt-1">
            <TriangleAlert className="h-3 w-3" />
            {t("itemUnavailable")}
          </Badge>
        ) : (
          <p className="text-sm text-muted">{formatPrice(item.products.price, locale)}</p>
        )}
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder={t("notesPlaceholder")}
          aria-label={t("notesPlaceholder")}
          className="mt-1.5 h-8 w-full max-w-xs rounded-lg border border-border bg-white/60 px-2.5 text-xs text-foreground placeholder:text-muted-2 focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300"
        />
      </div>
      <div className="flex items-center overflow-hidden rounded-xl border border-border-strong bg-white/70">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:bg-brand-50 disabled:opacity-40"
          onClick={() => updateQuantity(Math.max(0.1, item.quantity - 0.1))}
          disabled={isPending || isUnavailable || item.quantity <= 0.1}
          aria-label={t("decreaseQuantity")}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="flex w-12 items-baseline justify-center gap-1 text-center text-sm font-semibold">
          {item.quantity.toFixed(1)}
          {unit && <span className="text-[0.65rem] font-medium text-muted-2">{unit}</span>}
        </span>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:bg-brand-50 disabled:opacity-40"
          onClick={() => updateQuantity(item.quantity + 0.1)}
          disabled={isPending || isUnavailable}
          aria-label={t("increaseQuantity")}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="w-24 text-end font-bold text-deep-700">{formatPrice(item.products.price * item.quantity, locale)}</p>
      <button
        type="button"
        onClick={remove}
        disabled={isPending}
        aria-label={t("remove")}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-2 transition-colors hover:bg-danger-bg hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
