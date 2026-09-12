import { notFound } from "next/navigation";
import { adminGetProduct, adminListCategories, adminListProducts, getBoxContents } from "@/lib/services/catalog";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImageManager } from "@/components/admin/product-image-manager";
import { BoxContentsEditor } from "@/components/admin/box-contents-editor";
import { updateProductAction } from "../../actions";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories] = await Promise.all([adminGetProduct(id), adminListCategories()]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">تعديل المنتج</h1>
      <div className="mt-6 space-y-10">
        <ProductForm categories={categories} product={product} action={updateProductAction.bind(null, id)} />
        <ProductImageManager productId={id} images={product.product_images} />
        {product.product_type === "box" && <BoxContentsSection boxProductId={id} />}
      </div>
    </div>
  );
}

async function BoxContentsSection({ boxProductId }: { boxProductId: string }) {
  const [{ products: allProducts }, boxContents] = await Promise.all([
    adminListProducts({ pageSize: 500 }),
    getBoxContents(boxProductId),
  ]);

  return (
    <BoxContentsEditor
      boxProductId={boxProductId}
      availableProducts={allProducts}
      initialItems={boxContents.map((entry) => ({ productId: entry.item.id, quantity: entry.quantity }))}
    />
  );
}
