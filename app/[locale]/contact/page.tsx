import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppImage as Image } from "@/components/ui/app-image";
import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/ui/section-header";
import { getSetting, type StoreInfo } from "@/lib/services/content";
import { placeholderImage } from "@/lib/media/placeholders";
import { toWhatsAppDigits } from "@/lib/utils/whatsapp";
import {
  EmailSketchIcon,
  PhoneSketchIcon,
  WriteToSketchIcon,
  FacebookSketchIcon,
  InstagramSketchIcon,
  WhatsAppSketchIcon,
  TikTokSketchIcon,
} from "@/components/storefront/sketch-icons";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contactPage");
  return { title: t("heroTitle"), description: t("metaDescription") };
}

function ContactMethodCard({ icon, title, value, href }: { icon: ReactNode; title: string; value?: string; href?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="text-deep-800">{icon}</div>
      <h3 className="text-lg font-extrabold text-deep-800">{title}</h3>
      {value && href ? (
        <a href={href} dir="ltr" className="text-sm font-medium text-brand-700 transition-colors hover:text-brand-800">
          {value}
        </a>
      ) : (
        <p className="text-sm text-muted">{value}</p>
      )}
    </div>
  );
}

function SocialLink({ icon, href }: { icon: ReactNode; href?: string }) {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-deep-700 transition-colors hover:text-brand-600"
      >
        {icon}
      </a>
    );
  }
  return <span className="text-deep-200">{icon}</span>;
}

export default async function ContactPage() {
  const t = await getTranslations("contactPage");
  const storeInfo = await getSetting<StoreInfo>("store_info");
  const contactSoon = t("contactSoon");

  return (
    <div>
      {/* Hero -- full-bleed cover image with a centered brand-gold card,
          matching the reference's dimensions/typography/card treatment. */}
      <section className="relative min-h-[16rem] w-full overflow-hidden sm:min-h-[20rem]">
        <Image
          src={placeholderImage("farmHarvest", { width: 1600, height: 700 })}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="relative mx-auto flex h-full max-w-7xl items-center justify-center px-4 py-10">
          <div className="w-full max-w-2xl rounded-2xl bg-gold-400 p-7 text-center shadow-[var(--shadow-lifted)] sm:p-10">
            <h1 className="font-serif text-3xl font-extrabold tracking-tight text-deep-900 sm:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-deep-900/80 sm:text-base">{t("heroSubtitle")}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
        <SectionHeader title={t("careTeamTitle")} description={t("careTeamSubtitle")} align="center" />

        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          <ContactMethodCard
            icon={<EmailSketchIcon className="h-16 w-16" />}
            title={t("emailLabel")}
            value={storeInfo?.contact_email || contactSoon}
            href={storeInfo?.contact_email ? `mailto:${storeInfo.contact_email}` : undefined}
          />
          <ContactMethodCard
            icon={<PhoneSketchIcon className="h-16 w-16" />}
            title={t("callLabel")}
            value={storeInfo?.contact_phone || contactSoon}
            href={storeInfo?.contact_phone ? `tel:${storeInfo.contact_phone}` : undefined}
          />
          <ContactMethodCard
            icon={<WriteToSketchIcon className="h-16 w-16" />}
            title={t("deliveryLabel")}
            value={storeInfo?.delivery_phone || contactSoon}
            href={storeInfo?.delivery_phone ? `tel:${storeInfo.delivery_phone}` : undefined}
          />
        </div>

        <div className="mt-16 flex flex-col items-center border-t border-border pt-12">
          <h3 className="text-xs font-bold tracking-wider text-muted uppercase">{t("socialTitle")}</h3>
          <div className="mt-5 flex items-center gap-7">
            <SocialLink icon={<FacebookSketchIcon className="h-8 w-8" />} href={storeInfo?.social_facebook} />
            <SocialLink icon={<InstagramSketchIcon className="h-8 w-8" />} href={storeInfo?.social_instagram} />
            <SocialLink
              icon={<WhatsAppSketchIcon className="h-8 w-8" />}
              href={storeInfo?.whatsapp_phone ? `https://wa.me/${toWhatsAppDigits(storeInfo.whatsapp_phone)}` : undefined}
            />
            <SocialLink icon={<TikTokSketchIcon className="h-8 w-8" />} href={storeInfo?.social_tiktok} />
          </div>
        </div>
      </div>
    </div>
  );
}
