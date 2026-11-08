"use server";

import { listProducts, type ProductPage } from "@/lib/services/catalog";

/** Lets the category page's client-side pagination island (see
 * category-product-grid.tsx) fetch any page beyond the one the server
 * component already rendered, without the page itself reading
 * searchParams (which would block it from being static/ISR). */
export async function fetchCategoryProductsPageAction(
  categoryId: string,
  page: number,
  pageSize: number,
): Promise<ProductPage> {
  return listProducts({ categoryId, page, pageSize });
}
