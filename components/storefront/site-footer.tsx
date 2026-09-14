import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSetting, type StoreInfo } from "@/lib/services/content";
import { listActivePaymentMethods } from "@/lib/services/payments";
import { pickLocalized } from "@/lib/i18n/localized";
import { Logo } from "./logo";

/** wa.me needs an international number with no leading 0 -- admin enters
 * the familiar local Egyptian format (e.g. 010...), so a leading 0 is
 * swapped for the 20 country code specifically for this link. */
function toWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `20${digits.slice(1)}` : digits;
}

export async function SiteFooter() {
  const t = await getTranslations();
  const locale = await getLocale();
  const [storeInfo, paymentMethods] = await Promise.all([
    getSetting<StoreInfo>("store_info"),
    listActivePaymentMethods(),
  ]);
  const siteName = storeInfo?.store_name || t("common.siteName");

  const shopLinks = [
    { href: "/c", label: t("nav.categories") },
    { href: "/box", label: t("nav.greenBox") },
    { href: "/search", label: t("nav.search") },
  ];
  const accountLinks = [
    { href: "/account/orders", label: t("account.nav.orders") },
    { href: "/account/addresses", label: t("account.nav.addresses") },
    { href: "/account/loyalty", label: t("account.nav.loyalty") },
    { href: "/account/subscriptions", label: t("account.nav.subscriptions") },
  ];

  return (
    <footer className="bg-deep-gradient relative mt-16 overflow-hidden text-white/80">
      <div className="blob h-72 w-72 bg-brand-500/20 -top-10 -start-10" aria-hidden="true" />
      <div className="blob h-72 w-72 bg-deep-400/20 bottom-0 end-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo siteName={siteName} tone="dark" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{t("common.tagline")}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold tracking-wide text-white uppercase">{t("footer.shop")}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-brand-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold tracking-wide text-white uppercase">{t("footer.account")}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-brand-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold tracking-wide text-white uppercase">{t("footer.contact")}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {storeInfo?.contact_phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-brand-300" />
                  <a href={`tel:${storeInfo.contact_phone}`} className="transition-colors hover:text-brand-300" dir="ltr">
                    {storeInfo.contact_phone}
                  </a>
                </li>
              )}
              {storeInfo?.contact_email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-brand-300" />
                  <a href={`mailto:${storeInfo.contact_email}`} className="transition-colors hover:text-brand-300">
                    {storeInfo.contact_email}
                  </a>
                </li>
              )}
              {storeInfo?.whatsapp_phone && (
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 shrink-0 text-brand-300" />
                  <a
                    href={`https://wa.me/${toWhatsAppDigits(storeInfo.whatsapp_phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-brand-300"
                    dir="ltr"
                  >
                    {storeInfo.whatsapp_phone}
                  </a>
                </li>
              )}
              {!storeInfo?.contact_phone && !storeInfo?.contact_email && !storeInfo?.whatsapp_phone && (
                <li className="flex items-center gap-2 text-white/50">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {t("footer.contactSoon")}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <p>
            {siteName} — {t("footer.rights")} © {new Date().getFullYear()}
          </p>
          {paymentMethods.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {paymentMethods.map((method) => (
                <span key={method.id} className="rounded-md bg-white/10 px-2 py-1 font-semibold">
                  {pickLocalized(method.name_ar, method.name_en, locale)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
