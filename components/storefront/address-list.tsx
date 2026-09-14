"use client";

import { useTransition } from "react";
import { MapPin, Pencil, Star, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { deleteAddressAction, setDefaultAddressAction } from "@/app/[locale]/account/addresses/actions";
import type { Address } from "@/lib/services/addresses";

export function AddressList({ addresses }: { addresses: Address[] }) {
  const t = useTranslations("addresses");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {addresses.map((address) => (
        <Card key={address.id} className={cn("relative", isPending && "opacity-60")}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {address.label && <p className="font-bold text-foreground">{address.label}</p>}
                {address.is_default && <Badge tone="brand">{t("default")}</Badge>}
              </div>
              <p className="mt-1 text-sm text-foreground">
                {address.recipient_name} — {address.phone}
              </p>
              <p className="text-sm text-muted">{address.detailed_address}</p>
              {address.landmark && <p className="text-sm text-muted">{address.landmark}</p>}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3 text-sm">
            <Link
              href={`/account/addresses/${address.id}/edit`}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-deep-700 transition-colors hover:bg-brand-50"
            >
              <Pencil className="h-3.5 w-3.5" /> {t("edit")}
            </Link>
            {!address.is_default && (
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-deep-700 transition-colors hover:bg-brand-50"
                onClick={() => startTransition(() => setDefaultAddressAction(locale, address.id))}
              >
                <Star className="h-3.5 w-3.5" /> {t("setDefault")}
              </button>
            )}
            <button
              type="button"
              className="ms-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-danger transition-colors hover:bg-danger-bg"
              onClick={() => {
                if (confirm(t("confirmDelete"))) {
                  startTransition(() => deleteAddressAction(locale, address.id));
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> {t("delete")}
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
