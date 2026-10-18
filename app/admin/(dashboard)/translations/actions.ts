"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { adminUpdateTranslationOverrides } from "@/lib/services/content";
import { findTranslationKey } from "@/lib/i18n/translation-catalog";

export type TranslationsActionState = { status: "idle" | "error" | "success"; message?: string };

/**
 * One form covers one namespace's keys, both locales at once (field
 * names "ar::<path>" / "en::<path>", since a dotted path is a valid
 * FormData key). Only known, non-excluded keys are ever written --
 * findTranslationKey re-validates every path server-side against the
 * real messages/*.json-derived catalog, so a tampered request can't
 * write an arbitrary settings key.
 */
export async function updateTranslationsAction(
  _prevState: TranslationsActionState,
  formData: FormData,
): Promise<TranslationsActionState> {
  const arUpdates: { path: string; value: string | null }[] = [];
  const enUpdates: { path: string; value: string | null }[] = [];

  for (const [name, raw] of formData.entries()) {
    const [locale, ...rest] = name.split("::");
    if (locale !== "ar" && locale !== "en") continue;
    const path = rest.join("::");
    if (!findTranslationKey(path)) continue;
    const value = String(raw).trim() || null;
    (locale === "ar" ? arUpdates : enUpdates).push({ path, value });
  }

  if (arUpdates.length === 0 && enUpdates.length === 0) {
    return { status: "error", message: "لا يوجد تغييرات صالحة للحفظ." };
  }

  try {
    await Promise.all([
      arUpdates.length > 0 ? adminUpdateTranslationOverrides("ar", arUpdates) : Promise.resolve(),
      enUpdates.length > 0 ? adminUpdateTranslationOverrides("en", enUpdates) : Promise.resolve(),
    ]);
  } catch {
    return { status: "error", message: "حصل خطأ أثناء الحفظ. حاول تاني." };
  }

  // Two layers, same reason products/actions.ts's
  // revalidateStorefrontProductPaths needs both: revalidateTag busts the
  // unstable_cache DATA underneath getTranslationOverrides, but every
  // already-rendered storefront page still needs its own Full Route
  // Cache entry busted too, or the edit only shows up once that page's
  // own ~60s window happens to elapse. Every t() call sitewide reads
  // through this, on every route under [locale], so -- unlike the
  // products action's specific list of routes -- the only correct,
  // maintainable choice is revalidating the whole [locale] layout
  // rather than trying to enumerate every page that could render the
  // edited namespace.
  revalidateTag("i18n-overrides", "max");
  revalidatePath("/[locale]", "layout");
  revalidatePath("/admin/translations");
  return { status: "success" };
}
