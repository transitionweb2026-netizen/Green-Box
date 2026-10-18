"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Package, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AppImage as Image } from "@/components/ui/app-image";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/ui/price-display";

export interface BoxShowcaseItem {
  id: string;
  quantity: number;
  name: string;
  image: string | null;
}

export interface BoxShowcaseBox {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  contents: BoxShowcaseItem[];
}

/**
 * The homepage's "six Green Box" card grid plus a details popup -- this is
 * the one place on the storefront a box's contents are shown WITHOUT
 * navigating to its full product page (that page -- app/[locale]/p/
 * [productSlug]/page.tsx -- already lists contents inline for anyone who
 * does click through). Hand-rolled dialog, not a library: there is no
 * Dialog/Modal primitive anywhere in this codebase yet, so this copies the
 * one existing modal convention (components/storefront/mobile-nav.tsx) --
 * fixed inset-0, a click-to-close backdrop, Escape-key handling, and
 * returning focus to the trigger on close -- rather than introducing a new
 * dependency for a single use site.
 */
export function BoxShowcase({ boxes, placeholderImage }: { boxes: BoxShowcaseBox[]; placeholderImage: string }) {
  const locale = useLocale();
  const t = useTranslations("home");
  const tProduct = useTranslations("product");
  const tCommon = useTranslations("common");
  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight;

  const [openId, setOpenId] = useState<string | null>(null);
  const openBox = boxes.find((box) => box.id === openId) ?? null;
  const triggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function close() {
    const id = openId;
    setOpenId(null);
    if (id) triggerRefs.current.get(id)?.focus();
  }

  useEffect(() => {
    if (!openBox) return;
    closeButtonRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openBox]);

  if (boxes.length === 0) {
    return <p className="mt-6 text-center text-sm text-white/70">{t("boxesEmptyNotice")}</p>;
  }

  return (
    <>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3">
        {boxes.map((box) => (
          <button
            key={box.id}
            type="button"
            ref={(el) => {
              if (el) triggerRefs.current.set(box.id, el);
              else triggerRefs.current.delete(box.id);
            }}
            onClick={() => setOpenId(box.id)}
            aria-haspopup="dialog"
            className="group block rounded-[1.75rem] bg-white/10 p-2.5 text-start ring-1 ring-white/15 transition-colors hover:bg-white/15"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-[1.35rem] bg-white/10">
              <Image
                src={box.image || placeholderImage}
                alt={box.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 240px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex items-end justify-between gap-2 pt-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-bold text-white">{box.name}</span>
                <span className="line-clamp-2 text-xs text-white/60">{box.description}</span>
              </div>
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white transition-transform group-hover:scale-110"
              >
                <ArrowIcon className="h-4 w-4" />
              </span>
            </div>
          </button>
        ))}
      </div>

      {openBox && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={openBox.name}>
          <button
            aria-label={tCommon("close")}
            tabIndex={-1}
            className="absolute inset-0 bg-deep-900/60 backdrop-blur-sm"
            onClick={close}
          />
          <div className="absolute inset-x-4 top-1/2 max-h-[85vh] max-w-lg -translate-y-1/2 overflow-y-auto rounded-[1.75rem] bg-background p-6 shadow-2xl sm:mx-auto sm:p-8">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              aria-label={tCommon("close")}
              className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-deep-700 transition-colors hover:bg-brand-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-brand-50">
              <Image src={openBox.image || placeholderImage} alt={openBox.name} fill sizes="32rem" className="object-cover" />
            </div>

            <h3 className="mt-5 text-xl font-extrabold text-foreground">{openBox.name}</h3>
            {openBox.description && <p className="mt-2 text-sm text-muted">{openBox.description}</p>}
            <div className="mt-3">
              <PriceDisplay value={openBox.price} locale={locale} size="md" />
            </div>

            {openBox.contents.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-bold text-foreground">{tProduct("boxContents")}</h4>
                <ul className="mt-3 flex flex-col gap-2">
                  {openBox.contents.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-white/60 px-3 py-2"
                    >
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                        {entry.image ? (
                          <Image src={entry.image} alt={entry.name} fill sizes="40px" className="object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-brand-400">
                            <Package className="h-4 w-4" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{entry.name}</span>
                      <Badge tone="brand">×{entry.quantity}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link
              href={`/p/${openBox.slug}`}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-gradient py-3 text-sm font-bold text-deep-900 transition-transform hover:-translate-y-0.5"
            >
              {t("greenBoxCta")}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
