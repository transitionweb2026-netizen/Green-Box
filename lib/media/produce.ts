import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Real produce cutout photography for the hero's "Green Box" composition
 * (see components/storefront/green-box-graphic.tsx and hero-carousel.tsx).
 * There is no generated/stock placeholder here on purpose -- these images
 * must be genuine, transparent-background product cutouts, supplied as
 * files. Drop each one into public/images/produce/ under the exact
 * filename below (PNG or WebP, transparent background, ~800px+ on the
 * longest side) and it appears automatically; until then that slot is
 * simply omitted rather than showing a broken image or a fake stand-in.
 */
export interface ProduceSlot {
  name: string;
  filename: string;
  /** Position/size as a percentage of the hero image column, plus a
   * slight rotation for a natural, non-grid-aligned arrangement. */
  top: string;
  start: string;
  width: string;
  rotate: string;
  zIndex: number;
}

export const PRODUCE_SLOTS: ProduceSlot[] = [
  { name: "broccoli", filename: "broccoli.png", top: "0%", start: "6%", width: "36%", rotate: "-6deg", zIndex: 5 },
  { name: "lemon", filename: "lemon.png", top: "6%", start: "64%", width: "16%", rotate: "10deg", zIndex: 6 },
  { name: "leafy-greens", filename: "leafy-greens.png", top: "12%", start: "38%", width: "22%", rotate: "-3deg", zIndex: 7 },
  { name: "tomato", filename: "tomato.png", top: "28%", start: "20%", width: "30%", rotate: "-4deg", zIndex: 10 },
  { name: "avocado", filename: "avocado.png", top: "32%", start: "50%", width: "30%", rotate: "5deg", zIndex: 11 },
  { name: "herbs", filename: "herbs.png", top: "44%", start: "10%", width: "16%", rotate: "-10deg", zIndex: 12 },
];

export interface AvailableProduceImage extends ProduceSlot {
  src: string;
}

/** Server-only: checks which produce cutouts have actually been supplied
 * yet, so the hero can render exactly those and skip the rest -- no
 * placeholder is substituted for a missing one. */
export function listAvailableProduceImages(): AvailableProduceImage[] {
  const dir = join(process.cwd(), "public", "images", "produce");
  return PRODUCE_SLOTS.filter((slot) => existsSync(join(dir, slot.filename))).map((slot) => ({
    ...slot,
    src: `/images/produce/${slot.filename}`,
  }));
}

/** A single small cutout suitable for the category pills / other tight
 * spots -- reuses whichever of these two already-required produce photos
 * exists, since neither slot mandates a special "icon-sized" duplicate. */
export function getPillProduceImage(name: "broccoli" | "tomato" | "herbs"): string | null {
  const dir = join(process.cwd(), "public", "images", "produce");
  const filename = `${name}.png`;
  return existsSync(join(dir, filename)) ? `/images/produce/${filename}` : null;
}
