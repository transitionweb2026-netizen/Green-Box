import { AppImage as Image } from "@/components/ui/app-image";
import { type ReactNode } from "react";
import { ShieldCheck, Sparkles, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { placeholderImage } from "@/lib/media/placeholders";
import { Logo } from "./logo";

export async function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const t = await getTranslations("common");
  const highlights = [
    { icon: Sparkles, key: "loyalty" },
    { icon: Truck, key: "delivery" },
    { icon: ShieldCheck, key: "quality" },
  ] as const;

  return (
    <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-0 overflow-hidden sm:my-8 sm:rounded-[var(--radius-card)] sm:shadow-[var(--shadow-lifted)] lg:grid-cols-2">
      <div className="bg-deep-gradient relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex">
        <div className="blob h-72 w-72 bg-brand-500/25 -top-16 -start-16 animate-float-slow" aria-hidden="true" />
        <Logo siteName={t("siteName")} tone="dark" />
        <div className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
            <Image src={placeholderImage("familyKitchen")} alt="" fill sizes="50vw" className="object-cover" />
          </div>
          <ul className="mt-6 space-y-3">
            {highlights.map((h) => (
              <li key={h.key} className="flex items-center gap-2.5 text-sm text-white/80">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <h.icon className="h-4 w-4 text-brand-300" />
                </span>
                {t(`authHighlight.${h.key}`)}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">{t("tagline")}</p>
      </div>

      <div className="glass flex flex-col justify-center !rounded-none px-6 py-14 sm:px-12 lg:!rounded-none">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo siteName={t("siteName")} />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
