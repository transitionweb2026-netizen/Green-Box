"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, ChevronUp, PackagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormMessage } from "@/components/ui/form-message";
import { setBoxContentsAction } from "@/app/admin/(dashboard)/products/actions";
import type { Product } from "@/lib/services/catalog";

interface BoxItemEntry {
  productId: string;
  quantity: number;
  prepNoteAr: string;
  prepNoteEn: string;
}

/**
 * box_items.quantity is numeric(10,2) -- already decimal-capable, no
 * migration needed. What was missing was purely this input: a plain
 * whole-number stepper for every item regardless of what it actually
 * is. For a product the admin has marked "sold by weight" (same flag
 * grocery pricing already uses, product-form.tsx), quantity here means
 * kilograms directly (e.g. 1.5 = "1.5 كجم") -- a different unit than
 * the live gram-stepper purchase flow (product-purchase-form.tsx, which
 * steps in whole grams since quantity there IS the live order amount
 * tied to a per-gram price), but this is a purely descriptive "how much
 * of this is in the box" label with no price calculation behind it, so
 * kg at 2-decimal precision (matching the column) is the natural unit
 * for an admin typing it in. Everything else keeps the original
 * whole-number piece count.
 */

export function BoxContentsEditor({
  boxProductId,
  availableProducts,
  initialItems,
}: {
  boxProductId: string;
  availableProducts: Product[];
  initialItems: { productId: string; quantity: number; prepNoteAr?: string | null; prepNoteEn?: string | null }[];
}) {
  const [items, setItems] = useState<BoxItemEntry[]>(
    initialItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      prepNoteAr: item.prepNoteAr ?? "",
      prepNoteEn: item.prepNoteEn ?? "",
    })),
  );
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addItem() {
    if (!selectedProductId || items.some((i) => i.productId === selectedProductId)) return;
    setItems([...items, { productId: selectedProductId, quantity: 1, prepNoteAr: "", prepNoteEn: "" }]);
    setSelectedProductId("");
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems(items.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }

  function updatePrepNote(productId: string, field: "prepNoteAr" | "prepNoteEn", value: string) {
    setItems(items.map((i) => (i.productId === productId ? { ...i, [field]: value } : i)));
  }

  function removeItem(productId: string) {
    setItems(items.filter((i) => i.productId !== productId));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await setBoxContentsAction(
        boxProductId,
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          prepNoteAr: item.prepNoteAr.trim() || null,
          prepNoteEn: item.prepNoteEn.trim() || null,
        })),
      );
      if (result.status === "error") {
        setError(result.message ?? "فشل حفظ محتويات الصندوق");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  const productById = new Map(availableProducts.map((p) => [p.id, p]));

  return (
    <Card tone="glass">
      <h2 className="mb-4 flex items-center gap-2 font-bold text-foreground">
        <PackagePlus className="h-4 w-4 text-brand-600" /> محتويات الصندوق
      </h2>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted">لا توجد منتجات في هذا الصندوق بعد.</p>}
        {items.map((item, index) => {
          const product = productById.get(item.productId);
          return (
            <div key={item.productId} className="rounded-xl border border-border bg-white/60 p-2.5">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="flex h-5 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-30"
                    aria-label="نقل لأعلى"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    className="flex h-5 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-30"
                    aria-label="نقل لأسفل"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="flex-1 text-sm font-medium text-foreground">{product?.name_ar ?? item.productId}</span>
                {product?.sold_by_weight ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0.05}
                      step={0.05}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, Math.max(0.05, Number(e.target.value) || 0))}
                      className="h-9 w-20 rounded-lg border border-border bg-white px-2 text-sm"
                    />
                    <span className="text-xs font-medium text-muted-2">كجم</span>
                  </div>
                ) : (
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, Math.max(1, Math.round(Number(e.target.value) || 1)))}
                    className="h-9 w-20 rounded-lg border border-border bg-white px-2 text-sm"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger-bg"
                  aria-label="إزالة"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Optional prep note ("متقورة", "مقطع"...) -- a label for
                  HOW this specific item is prepared inside this box, shown
                  to the customer next to the item on the storefront. */}
              <div className="mt-2 grid gap-1.5 ps-9 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="ملاحظة تحضير بالعربي (اختياري، مثال: مقورة)"
                  value={item.prepNoteAr}
                  onChange={(e) => updatePrepNote(item.productId, "prepNoteAr", e.target.value)}
                  className="h-8 rounded-lg border border-border bg-white/70 px-2.5 text-xs text-foreground placeholder:text-muted-2"
                />
                <input
                  type="text"
                  placeholder="Prep note in English (optional)"
                  value={item.prepNoteEn}
                  onChange={(e) => updatePrepNote(item.productId, "prepNoteEn", e.target.value)}
                  className="h-8 rounded-lg border border-border bg-white/70 px-2.5 text-xs text-foreground placeholder:text-muted-2"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <Select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="flex-1">
          <option value="">اختر منتج لإضافته</option>
          {availableProducts
            .filter((p) => p.product_type === "standard" && !items.some((i) => i.productId === p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name_ar}
              </option>
            ))}
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          إضافة
        </Button>
      </div>

      <Button type="button" size="sm" className="mt-4" onClick={save} disabled={isPending} loading={isPending}>
        {!isPending && (saved ? <Check className="h-4 w-4" /> : null)}
        {isPending ? "جارٍ الحفظ..." : saved ? "تم الحفظ" : "حفظ المحتويات"}
      </Button>
      {saved && (
        <Badge tone="success" className="ms-2">
          محفوظ
        </Badge>
      )}
      {error && <FormMessage className="mt-1.5">{error}</FormMessage>}
    </Card>
  );
}
