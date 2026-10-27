import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { adminGetProduct, adminListProducts, getBoxContents } from "@/lib/services/catalog";
import { BoxForm } from "@/components/admin/box-form";
import { BoxContentsEditor } from "@/components/admin/box-contents-editor";
import { updateBoxAction } from "../../actions";

export default async function EditBoxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const box = await adminGetProduct(id);
  if (!box || box.product_type !== "box") notFound();

  const [{ products: allProducts }, boxContents] = await Promise.all([
    adminListProducts({ pageSize: 500 }),
    getBoxContents(id),
  ]);

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-extrabold text-foreground">تعديل الصندوق: {box.name_ar}</h1>
      </div>

      <div className="mt-6 max-w-2xl space-y-10">
        <BoxForm box={box} action={updateBoxAction.bind(null, id)} />
        <BoxContentsEditor
          boxProductId={id}
          boxCategoryId={box.category_id}
          availableProducts={allProducts}
          initialItems={boxContents.map((entry) => ({
            productId: entry.item.id,
            quantity: entry.quantity,
            quantityUnit: entry.quantity_unit,
            prepNoteAr: entry.prep_note_ar,
            prepNoteEn: entry.prep_note_en,
          }))}
        />
      </div>
    </div>
  );
}
