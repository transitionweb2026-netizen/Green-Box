import "server-only";
import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";

/**
 * Dot-separated keys that already have a dedicated, nicer bespoke admin
 * form elsewhere (Content -> Homepage/FAQ/Terms/Our Story/Sustainability
 * -- see lib/services/content.ts's HomepageContent/FaqContent/
 * TermsContent/OurStoryContent/SustainabilityContent and their forms in
 * components/admin/*-content-form.tsx). Excluded from the generic
 * /admin/translations editor on purpose: those pages read the bespoke
 * blob FIRST and only fall back to this translation key when the
 * bespoke field is empty, so editing the SAME key here would silently
 * have no visible effect once the bespoke field is ever filled in --
 * two conflicting edit surfaces for one rendered value, exactly the
 * "messy, confusing" outcome this system exists to avoid. Each entry's
 * real editing surface is named so the sidebar can link straight to it.
 */
export const EXCLUDED_TRANSLATION_KEYS: Record<string, string> = {
  "home.greenBoxTitle": "Content → Homepage",
  "home.greenBoxDescription": "Content → Homepage",
  "home.finalCtaTitle": "Content → Homepage",
  "home.finalCtaDescription": "Content → Homepage",
  "ourStoryPage.title": "Content → \"Our Story\" page",
  "ourStoryPage.body": "Content → \"Our Story\" page",
  "ourStoryPage.pillar1Title": "Content → \"Our Story\" page",
  "ourStoryPage.pillar1Body": "Content → \"Our Story\" page",
  "ourStoryPage.pillar2Title": "Content → \"Our Story\" page",
  "ourStoryPage.pillar2Body": "Content → \"Our Story\" page",
  "ourStoryPage.pillar3Title": "Content → \"Our Story\" page",
  "ourStoryPage.pillar3Body": "Content → \"Our Story\" page",
  "sustainabilityPage.title": "Content → \"Sustainability\" page",
  "sustainabilityPage.body": "Content → \"Sustainability\" page",
  "sustainabilityPage.pillar1Title": "Content → \"Sustainability\" page",
  "sustainabilityPage.pillar1Body": "Content → \"Sustainability\" page",
  "sustainabilityPage.pillar2Title": "Content → \"Sustainability\" page",
  "sustainabilityPage.pillar2Body": "Content → \"Sustainability\" page",
  "sustainabilityPage.pillar3Title": "Content → \"Sustainability\" page",
  "sustainabilityPage.pillar3Body": "Content → \"Sustainability\" page",
  "faq.question1": "Content → FAQ",
  "faq.answer1": "Content → FAQ",
  "faq.question2": "Content → FAQ",
  "faq.answer2": "Content → FAQ",
  "faq.question3": "Content → FAQ",
  "faq.answer3": "Content → FAQ",
  "faq.cta": "Content → FAQ",
  "terms.body": "Content → Terms & Conditions",
};

/** Arabic label for the /admin/translations sidebar -- falls back to the
 * raw namespace key (still perfectly usable) if a new namespace is added
 * to messages/en.json before this map is updated, so the admin UI never
 * breaks waiting on a translation of its own. */
export const NAMESPACE_LABELS: Record<string, string> = {
  common: "عام",
  nav: "التنقل",
  home: "الصفحة الرئيسية",
  footer: "الفوتر",
  auth: "تسجيل الدخول والتسجيل",
  errors: "صفحة الخطأ",
  notFound: "صفحة غير موجود",
  product: "صفحة المنتج",
  greenBoxPage: "صفحة صناديق جرين بوكس",
  reviewsPage: "صفحة آراء العملاء",
  ourStoryPage: "صفحة قصتنا",
  sustainabilityPage: "صفحة الاستدامة",
  recipesPage: "صفحة الوصفات",
  faq: "الأسئلة الشائعة",
  terms: "الشروط والأحكام",
  contactPage: "صفحة تواصل معنا",
  categoryPage: "صفحة القسم",
  search: "البحث",
  cart: "السلة",
  checkout: "صفحة الدفع",
  orders: "الطلبات",
  account: "الحساب",
  addresses: "العناوين",
  loyalty: "نقاط الولاء",
  subscriptions: "الاشتراكات الأسبوعية",
};

export interface TranslationKeyEntry {
  path: string;
  defaultEn: string;
  defaultAr: string;
}

export interface TranslationNamespace {
  namespace: string;
  keys: TranslationKeyEntry[];
}

function flatten(obj: unknown, prefix: string, out: Map<string, string>): void {
  if (typeof obj === "string") {
    out.set(prefix, obj);
    return;
  }
  if (typeof obj !== "object" || obj === null) return;
  for (const [key, value] of Object.entries(obj)) {
    flatten(value, prefix ? `${prefix}.${key}` : key, out);
  }
}

let cachedNamespaces: TranslationNamespace[] | null = null;

/**
 * Builds the full, real key list directly from messages/en.json +
 * messages/ar.json (never a hand-maintained list, so it can't drift out
 * of sync with the actual translation files), grouped by top-level
 * namespace for the /admin/translations sidebar, with the
 * already-bespoke-covered keys filtered out. Computed once per server
 * process -- these files only change at deploy time, not at runtime.
 */
export function getTranslationNamespaces(): TranslationNamespace[] {
  if (cachedNamespaces) return cachedNamespaces;

  const enFlat = new Map<string, string>();
  flatten(enMessages, "", enFlat);
  const arFlat = new Map<string, string>();
  flatten(arMessages, "", arFlat);

  const byNamespace = new Map<string, TranslationKeyEntry[]>();
  for (const [path, defaultEn] of enFlat) {
    if (path in EXCLUDED_TRANSLATION_KEYS) continue;
    const namespace = path.split(".")[0];
    const entry: TranslationKeyEntry = { path, defaultEn, defaultAr: arFlat.get(path) ?? "" };
    const list = byNamespace.get(namespace);
    if (list) list.push(entry);
    else byNamespace.set(namespace, [entry]);
  }

  cachedNamespaces = [...byNamespace.entries()]
    .map(([namespace, keys]) => ({ namespace, keys }))
    .sort((a, b) => a.namespace.localeCompare(b.namespace));
  return cachedNamespaces;
}

export function findTranslationKey(path: string): TranslationKeyEntry | null {
  for (const ns of getTranslationNamespaces()) {
    const found = ns.keys.find((k) => k.path === path);
    if (found) return found;
  }
  return null;
}
