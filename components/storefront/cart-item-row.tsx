"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { pickLocalized, formatPrice } from "@/lib/i18n/localized";
import { removeCartItemAction, updateCartItemAction } from "@/app/[locale]/cart/actions";
import type { CartItemWithProduct } from "@/lib/services/cart";

export function CartItemRow({ item }: { item: CartItemWithProduct }) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const name = pickLocalized(item.products.name_ar, item.products.name_en, locale);
  const image = item.products.product_images.find((img) => img.is_primary) ?? item.products.product_images[0];

  function updateQuantity(quantity: number) {
    startTransition(() => updateCartItemAction(locale, item.id, quantity));
  }

  function remove() {
    startTransition(() => removeCartItemAction(locale, item.id));
  }

  return (
    <div className={`flex items-center gap-4 border-b border-border py-4 last:border-b-0 ${isPending ? "opacity-50" : ""}`}>
      <Link href={`/p/${item.products.slug}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-50">
        {image && <Image src={image.url} alt={name} fill className="object-cover" />}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/p/${item.products.slug}`} className="line-clamp-1 font-medium text-foreground hover:text-brand-700">
          {name}
        </Link>
        <p className="text-sm text-muted">{formatPrice(item.products.price, locale)}</p>
      </div>
      <div className="flex items-center rounded-lg border border-border">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center text-foreground disabled:opacity-40"
          onClick={() => updateQuantity(item.quantity - 1)}
          disabled={isPending}
          aria-label="-"
        >
          −
        </button>
        <span className="w-8 text-center text-sm">{item.quantity}</span>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center text-foreground disabled:opacity-40"
          onClick={() => updateQuantity(item.quantity + 1)}
          disabled={isPending}
          aria-label="+"
        >
          +
        </button>
      </div>
      <p className="w-24 text-end font-medium text-foreground">{formatPrice(item.products.price * item.quantity, locale)}</p>
      <button type="button" onClick={remove} disabled={isPending} className="text-sm text-danger hover:underline">
        {t("remove")}
      </button>
    </div>
  );
}
