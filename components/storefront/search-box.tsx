"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, Tag } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { pickLocalized } from "@/lib/i18n/localized";
import { cn } from "@/lib/utils/cn";

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
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

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
        setActiveIndex(-1);
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      goToSuggestion(suggestions[activeIndex]);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (activeIndex >= 0 && suggestions[activeIndex]) {
            goToSuggestion(suggestions[activeIndex]);
          } else if (query.trim()) {
            goToSearch(query);
          }
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          aria-label={tNav("search")}
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          className="ps-10"
        />
      </form>
      {open && suggestions.length > 0 && (
        <ul id={listboxId} role="listbox" className="glass glass-panel absolute z-20 mt-2 w-full overflow-hidden !rounded-2xl !p-1.5">
          {suggestions.map((s, index) => (
            <li key={`${s.kind}-${s.id}`} role="presentation">
              <button
                type="button"
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => goToSuggestion(s)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-start text-sm text-foreground transition-colors hover:bg-brand-50",
                  index === activeIndex && "bg-brand-50",
                )}
              >
                <span className="flex items-center gap-2">
                  {s.kind === "category" ? (
                    <Tag className="h-3.5 w-3.5 text-brand-600" />
                  ) : (
                    <Search className="h-3.5 w-3.5 text-muted-2" />
                  )}
                  {pickLocalized(s.name_ar, s.name_en, locale)}
                </span>
                {s.kind === "category" && (
                  <span className="text-xs font-medium text-brand-700">{t("suggestionsCategory")}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
