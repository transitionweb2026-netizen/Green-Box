"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X, User, LogIn, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SearchBox } from "./search-box";
import { LocaleSwitcher } from "./locale-switcher";

interface NavLink {
  href: string;
  label: string;
}

export function MobileNav({
  links,
  isLoggedIn,
  accountLabel,
  loginLabel,
  registerLabel,
  menuLabel,
}: {
  links: NavLink[];
  isLoggedIn: boolean;
  accountLabel: string;
  loginLabel: string;
  registerLabel: string;
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={menuLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-strong bg-white/70 text-deep-700"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={menuLabel}>
          <button
            aria-label={tCommon("close")}
            tabIndex={-1}
            className="absolute inset-0 bg-deep-900/50 backdrop-blur-sm"
            onClick={close}
          />
          <div className="glass-dark absolute inset-y-0 start-0 flex w-[86%] max-w-sm flex-col gap-6 rounded-none rounded-e-3xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white">{menuLabel}</span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label={tCommon("close")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <SearchBox />

            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-white/90 transition-colors hover:bg-white/10"
                >
                  {link.label}
                  <Chevron className="h-4 w-4 opacity-60" />
                </Link>
              ))}
            </nav>

            <div className="divider-fade opacity-20" />

            {isLoggedIn ? (
              <Link
                href="/account"
                onClick={close}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-3 font-semibold text-white"
              >
                <User className="h-4 w-4" /> {accountLabel}
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/auth/login"
                  onClick={close}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-3 font-semibold text-white"
                >
                  <LogIn className="h-4 w-4" /> {loginLabel}
                </Link>
                <Link
                  href="/auth/register"
                  onClick={close}
                  className="bg-brand-gradient flex items-center justify-center rounded-xl px-3 py-3 font-semibold text-white"
                >
                  {registerLabel}
                </Link>
              </div>
            )}

            <div className="mt-auto flex justify-center">
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
