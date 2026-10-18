import Link from "next/link";
import { Languages, Search } from "lucide-react";
import { adminGetTranslationOverrides } from "@/lib/services/content";
import { getTranslationNamespaces, NAMESPACE_LABELS } from "@/lib/i18n/translation-catalog";
import { getDeepValue } from "@/lib/i18n/deep-object";
import { TranslationEditor, type EditableKey } from "@/components/admin/translation-editor";
import { cn } from "@/lib/utils/cn";

/**
 * Generic, site-wide "edit any text" admin screen -- deliberately
 * separate from /admin/content, which keeps its own nicer bespoke forms
 * for the handful of sections that already have one (see
 * lib/i18n/translation-catalog.ts's EXCLUDED_TRANSLATION_KEYS). This
 * page covers everything else: every other string in messages/*.json,
 * grouped by namespace so ~450 keys stay navigable instead of one long
 * list, plus a search box for finding a string without knowing which
 * namespace it lives in.
 */
export default async function TranslationsPage({
  searchParams,
}: {
  searchParams: Promise<{ ns?: string; q?: string }>;
}) {
  const { ns, q } = await searchParams;
  const namespaces = getTranslationNamespaces();
  const [arOverrides, enOverrides] = await Promise.all([
    adminGetTranslationOverrides("ar"),
    adminGetTranslationOverrides("en"),
  ]);

  const query = (q ?? "").trim().toLowerCase();
  const searchResults = query
    ? namespaces.flatMap((namespace) =>
        namespace.keys
          .filter(
            (key) =>
              key.path.toLowerCase().includes(query) ||
              key.defaultEn.toLowerCase().includes(query) ||
              key.defaultAr.includes(query),
          )
          .map((key) => ({ ...key, namespace: namespace.namespace })),
      )
    : [];

  // Defaults to "home" (not the alphabetically-first namespace) when no
  // ?ns= is given -- it's the most visible content and includes the
  // hero, the section explicitly called out as a priority.
  const selectedNamespace =
    namespaces.find((namespace) => namespace.namespace === ns) ??
    namespaces.find((namespace) => namespace.namespace === "home") ??
    namespaces[0];
  const editableKeys: EditableKey[] = (selectedNamespace?.keys ?? []).map((key) => ({
    path: key.path,
    defaultEn: key.defaultEn,
    defaultAr: key.defaultAr,
    currentEn: (getDeepValue(enOverrides, key.path) as string) ?? "",
    currentAr: (getDeepValue(arOverrides, key.path) as string) ?? "",
  }));

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white">
          <Languages className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-extrabold text-foreground">نصوص الموقع</h1>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        أي جملة ظاهرة في الموقع تقدر تعدّلها من هنا، منظمة حسب القسم. أقسام زي الصفحة الرئيسية والأسئلة الشائعة
        والشروط والأحكام وصفحة قصتنا والاستدامة ليها نماذج مخصصة أوضح في صفحة{" "}
        <Link href="/admin/content" className="font-semibold text-brand-700 underline">
          المحتوى
        </Link>
        .
      </p>

      <form action="/admin/translations" className="mt-6 max-w-md">
        <div className="relative">
          <Search className="absolute top-1/2 start-3.5 h-4 w-4 -translate-y-1/2 text-muted-2" />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="دور على نص مش عارف هو في أي قسم..."
            className="h-11 w-full rounded-xl border border-border bg-white/80 ps-10 pe-3.5 text-sm text-foreground shadow-[inset_0_1px_2px_rgba(14,27,20,0.04)] placeholder:text-muted-2 focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300"
          />
        </div>
      </form>

      {query ? (
        <div className="mt-6">
          <p className="text-sm text-muted">
            {searchResults.length} نتيجة لـ &quot;{q}&quot;
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {searchResults.map((result) => (
              <Link
                key={result.path}
                href={`/admin/translations?ns=${result.namespace}#${result.path}`}
                className="rounded-xl border border-border bg-white/50 p-3 transition-colors hover:bg-brand-50"
              >
                <span className="block font-mono text-xs text-muted-2">{result.path}</span>
                <span className="block text-sm text-foreground">{result.defaultEn}</span>
              </Link>
            ))}
            {searchResults.length === 0 && <p className="text-sm text-muted">مفيش نتائج.</p>}
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <nav className="shrink-0 lg:w-60">
            <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
              {namespaces.map((namespace) => (
                <li key={namespace.namespace} className="shrink-0 lg:shrink">
                  <Link
                    href={`/admin/translations?ns=${namespace.namespace}`}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                      namespace.namespace === selectedNamespace?.namespace
                        ? "bg-brand-gradient text-white shadow-sm"
                        : "text-deep-700 hover:bg-brand-50",
                    )}
                  >
                    {NAMESPACE_LABELS[namespace.namespace] ?? namespace.namespace}
                    <span className="text-xs opacity-70">{namespace.keys.length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="min-w-0 flex-1">
            {selectedNamespace && (
              <TranslationEditor
                namespace={NAMESPACE_LABELS[selectedNamespace.namespace] ?? selectedNamespace.namespace}
                keys={editableKeys}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
