import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { ProductWithImages } from "./catalog";

export type Cart = Tables<"carts">;
export type CartItem = Tables<"cart_items">;
export type CartItemWithProduct = CartItem & { products: ProductWithImages };

/**
 * One active cart per signed-in customer (enforced by a partial unique
 * index -- see DATABASE.md, carts). Creates one lazily if none exists.
 */
export async function getOrCreateActiveCart(): Promise<Cart> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const existing = await supabase
    .from("carts")
    .select("*")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const created = await supabase
    .from("carts")
    .insert({ profile_id: user.id })
    .select("*")
    .single();
  if (created.error) throw created.error;
  return created.data;
}

export async function listCartItems(cartId: string): Promise<CartItemWithProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("*, products(*, product_images(*), categories(slug))")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as unknown as CartItemWithProduct[]) ?? [];
}

export interface CartSummary {
  items: CartItemWithProduct[];
  itemCount: number;
  subtotal: number;
}

/** Subtotal is always computed from live product prices, never stored on the cart. */
export async function getCartSummary(cartId: string): Promise<CartSummary> {
  const items = await listCartItems(cartId);
  const subtotal = items.reduce((sum, item) => sum + item.products.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, itemCount, subtotal };
}

export async function addToCart(cartId: string, productId: string, quantity: number): Promise<void> {
  const supabase = await createClient();

  const existing = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle();
  if (existing.error) throw existing.error;

  if (existing.data) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.data.quantity + quantity })
      .eq("id", existing.data.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("cart_items").insert({ cart_id: cartId, product_id: productId, quantity });
  if (error) throw error;
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<void> {
  if (quantity <= 0) {
    await removeCartItem(cartItemId);
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId);
  if (error) throw error;
}

export async function updateCartItemNotes(cartItemId: string, notes: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("cart_items").update({ notes }).eq("id", cartItemId);
  if (error) throw error;
}

export async function removeCartItem(cartItemId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
  if (error) throw error;
}

export async function clearCart(cartId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
  if (error) throw error;
}

/**
 * Read-only cart summary for display (e.g. the homepage hero's floating
 * "Your Box" widget) -- deliberately does NOT call getOrCreateActiveCart,
 * which creates a cart row as a side effect; that's fine when the user is
 * about to add an item, but not as a side effect of merely viewing a page.
 * Returns an empty summary for guests or anyone with no cart yet.
 */
export async function getCartSummaryForCurrentUser(): Promise<CartSummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], itemCount: 0, subtotal: 0 };

  const cart = await supabase.from("carts").select("id").eq("profile_id", user.id).eq("status", "active").maybeSingle();
  if (!cart.data) return { items: [], itemCount: 0, subtotal: 0 };

  return getCartSummary(cart.data.id);
}

export async function getCartItemCountForUser(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const cart = await supabase.from("carts").select("id").eq("profile_id", user.id).eq("status", "active").maybeSingle();
  if (!cart.data) return 0;

  const { data, error } = await supabase.from("cart_items").select("quantity").eq("cart_id", cart.data.id);
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + row.quantity, 0);
}
