"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { addToCart, getOrCreateActiveCart, removeCartItem, updateCartItemQuantity } from "@/lib/services/cart";

export type CartActionState = { status: "idle" | "error" | "success"; message?: string };

export async function addToCartAction(
  locale: string,
  productId: string,
  quantity: number,
): Promise<CartActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/auth/login?next=${encodeURIComponent(`/${locale}`)}`);
  }

  try {
    const cart = await getOrCreateActiveCart();
    await addToCart(cart.id, productId, quantity);
    revalidatePath(`/${locale}/cart`);
    return { status: "success" };
  } catch {
    return { status: "error", message: "GENERIC" };
  }
}

export async function updateCartItemAction(locale: string, cartItemId: string, quantity: number) {
  await updateCartItemQuantity(cartItemId, quantity);
  revalidatePath(`/${locale}/cart`);
}

export async function removeCartItemAction(locale: string, cartItemId: string) {
  await removeCartItem(cartItemId);
  revalidatePath(`/${locale}/cart`);
}
