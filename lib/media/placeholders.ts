/**
 * Centralized temporary imagery. Every product/category/banner already has
 * a real `image_url`/`product_images` field from the CMS/media library
 * (see lib/services/catalog.ts, lib/services/content.ts) -- these
 * placeholders are ONLY a fallback for when that real field is empty, so
 * the storefront never shows a blank box or broken-image icon before real
 * photography is uploaded. Swap the URLs here (not the call sites) once
 * real brand photography is ready.
 *
 * Backed by loremflickr.com, a keyword-based placeholder image service --
 * `lock=<n>` pins a deterministic photo per key so the same section always
 * shows the same image across reloads instead of a new random one.
 */
export type PlaceholderKey =
  | "hero"
  | "vegetables"
  | "fruits"
  | "herbs"
  | "chicken"
  | "dairy"
  | "bakery"
  | "grocery"
  | "greenBox"
  | "deliveryScooter"
  | "deliveryBox"
  | "kitchen"
  | "familyKitchen"
  | "farmHarvest"
  | "market"
  | "smoothie"
  | "supermarket"
  | "healthyFood";

const KEYWORDS: Record<PlaceholderKey, string> = {
  hero: "vegetables,fresh",
  vegetables: "vegetables,fresh",
  fruits: "fruits,fresh",
  herbs: "herbs,basil",
  chicken: "chicken,meat",
  dairy: "dairy,milk",
  bakery: "bread,fresh",
  grocery: "grocery,basket",
  greenBox: "grocery,box",
  deliveryScooter: "delivery,scooter",
  deliveryBox: "delivery,box",
  kitchen: "kitchen,cooking",
  familyKitchen: "family,kitchen",
  farmHarvest: "farm,harvest",
  market: "market,fruit",
  smoothie: "smoothie,fruit",
  supermarket: "supermarket,food",
  healthyFood: "healthy,food",
};

/** A stable numeric lock per key so the same key always renders the same
 * photo (deterministic across renders/reloads), while different keys and
 * different lock offsets (for grids showing many of the same category)
 * still vary. */
const LOCKS: Record<PlaceholderKey, number> = {
  hero: 12,
  vegetables: 21,
  fruits: 34,
  herbs: 183,
  chicken: 45,
  dairy: 58,
  bakery: 63,
  grocery: 77,
  greenBox: 81,
  deliveryScooter: 94,
  deliveryBox: 105,
  kitchen: 118,
  familyKitchen: 123,
  farmHarvest: 136,
  market: 149,
  smoothie: 152,
  supermarket: 167,
  healthyFood: 171,
};

/** Real category slugs (see supabase seed data) mapped to the closest
 * placeholder keyword set, so a product missing a real photo at least
 * shows a plausible stock photo for its actual category instead of always
 * falling back to a generic "vegetables" image regardless of what it is. */
const CATEGORY_SLUG_TO_KEY: Record<string, PlaceholderKey> = {
  "fresh-chicken": "chicken",
  "fresh-fruits": "fruits",
  "fresh-vegetables": "vegetables",
  "prepared-fruits": "fruits",
  "prepared-vegetables": "vegetables",
  "green-box-boxes": "greenBox",
};

export function categoryPlaceholderKey(categorySlug: string | null | undefined): PlaceholderKey {
  if (!categorySlug) return "grocery";
  return CATEGORY_SLUG_TO_KEY[categorySlug] ?? "grocery";
}

export function placeholderImage(
  key: PlaceholderKey,
  { width = 800, height = 800, variant = 0 }: { width?: number; height?: number; variant?: number } = {},
): string {
  const keywords = KEYWORDS[key];
  const lock = LOCKS[key] + variant;
  return `https://loremflickr.com/${width}/${height}/${keywords}?lock=${lock}`;
}
