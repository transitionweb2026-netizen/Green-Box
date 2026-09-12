"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setBoxContentsAction } from "@/app/admin/(dashboard)/products/actions";
import type { Product } from "@/lib/services/catalog";

interface BoxItemEntry {
  productId: string;
  quantity: number;
}

export function BoxContentsEditor({
  boxProductId,
  availableProducts,
  initialItems,
}: {
  boxProductId: string;
  availableProducts: Product[];
  initialItems: { productId: string; quantity: number }[];
}) {
  const [items, setItems] = useState<BoxItemEntry[]>(initialItems);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function addItem() {
    if (!selectedProductId || items.some((i) => i.productId === selectedProductId)) return;
    setItems([...items, { productId: selectedProductId, quantity: 1 }]);
    setSelectedProductId("");
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems(items.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }

  function removeItem(productId: string) {
    setItems(items.filter((i) => i.productId !== productId));
  }

  function save() {
    startTransition(async () => {
      await setBoxContentsAction(boxProductId, items);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  const productById = new Map(availableProducts.map((p) => [p.id, p]));

  return (
    <div>
      <h2 className="mb-3 font-semibold text-foreground">محتويات الصندوق</h2>
      <div className="space-y-2">
        {items.map((item) => {
          const product = productById.get(item.productId);
          return (
            <div key={item.productId} className="flex items-center gap-3 rounded-lg border border-border p-2">
              <span className="flex-1 text-sm">{product?.name_ar ?? item.productId}</span>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateQuantity(item.productId, Math.max(1, Number(e.target.value)))}
                className="h-9 w-20 rounded-lg border border-border px-2 text-sm"
              />
              <button type="button" onClick={() => removeItem(item.productId)} className="text-sm text-danger">
                إزالة
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="">اختر منتج لإضافته</option>
          {availableProducts
            .filter((p) => p.product_type === "standard" && !items.some((i) => i.productId === p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name_ar}
              </option>
            ))}
        </select>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          إضافة
        </Button>
      </div>

      <Button type="button" size="sm" className="mt-4" onClick={save} disabled={isPending}>
        {isPending ? "جارٍ الحفظ..." : saved ? "تم الحفظ" : "حفظ المحتويات"}
      </Button>
    </div>
  );
}
