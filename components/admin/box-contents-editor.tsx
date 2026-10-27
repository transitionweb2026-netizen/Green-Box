"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, ChevronUp, PackagePlus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormMessage } from "@/components/ui/form-message";
import { setBoxContentsAction, quickCreateBoxItemProductAction } from "@/app/admin/(dashboard)/products/actions";
import type { Product } from "@/lib/services/catalog";
import type { BoxItemQuantityUnit } from "@/types/database";

interface BoxItemEntry {
  productId: string;
  quantity: number;
  unit: BoxItemQuantityUnit;
  prepNoteAr: string;
  prepNoteEn: string;
}

/**
 * box_items.quantity is numeric(10,2) -- already decimal-capable, no
 * migration needed for the number itself. The unit (`quantity_unit`,
 * 0037_box_item_quantity_unit.sql) is a per-box-item choice the admin
 * sets explicitly here -- piece count ("×2"), grams, or kilograms --
 * independent of whether the contained product is itself sold by weight
 * on the storefront (that's product-form.tsx's unrelated `sold_by_weight`
 * flag). This is a purely descriptive "how much of this is in the box"
 * label with no price calculation behind it, unlike the live gram-stepper
 * purchase flow (product-purchase-form.tsx, where quantity IS the actual
 * order amount tied to a per-gram price).
 */
const UNIT_CONFIG: Record<BoxItemQuantityUnit, { min: number; step: number; round: boolean }> = {
  piece: { min: 1, step: 1, round: true },
  gram: { min: 1, step: 50, round: true },
  kg: { min: 0.05, step: 0.05, round: false },
};

const UNIT_LABELS: Record<BoxItemQuantityUnit, string> = {
  piece: "قطعة",
  gram: "جرام",
  kg: "كجم",
};

export function BoxContentsEditor({
  boxProductId,
  boxCategoryId,
  availableProducts,
  initialItems,
}: {
  boxProductId: string;
  boxCategoryId: string;
  availableProducts: Product[];
  initialItems: {
    productId: string;
    quantity: number;
    quantityUnit: BoxItemQuantityUnit;
    prepNoteAr?: string | null;
    prepNoteEn?: string | null;
  }[];
}) {
  const [items, setItems] = useState<BoxItemEntry[]>(
    initialItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unit: item.quantityUnit,
      prepNoteAr: item.prepNoteAr ?? "",
      prepNoteEn: item.prepNoteEn ?? "",
    })),
  );
  // Products created on the fly below (typed name, not picked from the
  // list) aren't in `availableProducts` (that prop is fetched once, server
  // side, before this component mounts) -- kept here so the new item's
  // name still renders immediately without a full page reload.
  const [createdProducts, setCreatedProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newProductName, setNewProductName] = useState("");
  const [isCreatingProduct, startCreateTransition] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);

  function addItem() {
    if (!selectedProductId || items.some((i) => i.productId === selectedProductId)) return;
    const product = availableProducts.find((p) => p.id === selectedProductId);
    const unit: BoxItemQuantityUnit = product?.sold_by_weight ? "kg" : "piece";
    setItems([...items, { productId: selectedProductId, quantity: UNIT_CONFIG[unit].min, unit, prepNoteAr: "", prepNoteEn: "" }]);
    setSelectedProductId("");
  }

  function createAndAddItem() {
    const name = newProductName.trim();
    if (!name) return;
    setCreateError(null);
    startCreateTransition(async () => {
      const result = await quickCreateBoxItemProductAction(boxCategoryId, name);
      if (result.status === "error" || !result.product) {
        setCreateError(result.message ?? "حصل خطأ أثناء إنشاء المنتج");
        return;
      }
      setCreatedProducts((prev) => [...prev, result.product!]);
      setItems((prev) => [
        ...prev,
        { productId: result.product!.id, quantity: 1, unit: "piece", prepNoteAr: "", prepNoteEn: "" },
      ]);
      setNewProductName("");
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems(items.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }

  function updateUnit(productId: string, unit: BoxItemQuantityUnit) {
    setItems(
      items.map((i) => {
        if (i.productId !== productId) return i;
        const config = UNIT_CONFIG[unit];
        const quantity = config.round ? Math.max(config.min, Math.round(i.quantity)) : Math.max(config.min, i.quantity);
        return { ...i, unit, quantity };
      }),
    );
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
          quantityUnit: item.unit,
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

  const productById = new Map([...availableProducts, ...createdProducts].map((p) => [p.id, p]));

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
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={UNIT_CONFIG[item.unit].min}
                    step={UNIT_CONFIG[item.unit].step}
                    value={item.quantity}
                    onChange={(e) => {
                      const config = UNIT_CONFIG[item.unit];
                      const raw = Number(e.target.value) || 0;
                      const next = config.round ? Math.max(config.min, Math.round(raw)) : Math.max(config.min, raw);
                      updateQuantity(item.productId, next);
                    }}
                    className="h-9 w-20 rounded-lg border border-border bg-white px-2 text-sm"
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => updateUnit(item.productId, e.target.value as BoxItemQuantityUnit)}
                    className="h-9 rounded-lg border border-border bg-white px-1.5 text-xs font-medium text-muted-2"
                  >
                    {(Object.keys(UNIT_LABELS) as BoxItemQuantityUnit[]).map((unit) => (
                      <option key={unit} value={unit}>
                        {UNIT_LABELS[unit]}
                      </option>
                    ))}
                  </select>
                </div>
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

      <div className="mt-2 flex gap-2">
        <Input
          type="text"
          placeholder="أو اكتب اسم منتج جديد مش موجود في القايمة"
          value={newProductName}
          onChange={(e) => setNewProductName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              createAndAddItem();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={createAndAddItem}
          disabled={!newProductName.trim() || isCreatingProduct}
        >
          {!isCreatingProduct && <Plus className="h-4 w-4" />}
          {isCreatingProduct ? "جارٍ الإنشاء..." : "إنشاء وإضافة"}
        </Button>
      </div>
      {createError && <FormMessage className="mt-1.5">{createError}</FormMessage>}

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
