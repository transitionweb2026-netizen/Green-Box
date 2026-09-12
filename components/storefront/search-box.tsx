"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { pickLocalized } from "@/lib/i18n/localized";

interface Suggestion {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
  kind: "product" | "category";
}

export function SearchBox({ initialQuery = "" }: { initialQuery?: string }) {
  const t = useTranslations("search");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToSearch(q: string) {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function goToSuggestion(s: Suggestion) {
    setOpen(false);
    router.push(s.kind === "product" ? `/p/${s.slug}` : `/c/${s.slug}`);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) goToSearch(query);
        }}
      >
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={t("placeholder")}
          aria-label={tNav("search")}
        />
      </form>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-background shadow-md">
          {suggestions.map((s) => (
            <li key={`${s.kind}-${s.id}`}>
              <button
                type="button"
                onClick={() => goToSuggestion(s)}
                className="flex w-full items-center justify-between px-3 py-2 text-start text-sm hover:bg-brand-50"
              >
                <span>{pickLocalized(s.name_ar, s.name_en, locale)}</span>
                {s.kind === "category" && (
                  <span className="text-xs text-muted">{t("suggestionsCategory")}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
