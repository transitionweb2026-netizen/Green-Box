"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { deleteAddressAction, setDefaultAddressAction } from "@/app/[locale]/account/addresses/actions";
import type { Address } from "@/lib/services/addresses";

export function AddressList({ addresses }: { addresses: Address[] }) {
  const t = useTranslations("addresses");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {addresses.map((address) => (
        <Card key={address.id} className={isPending ? "opacity-60" : ""}>
          <div className="flex items-start justify-between gap-4">
            <div>
              {address.label && <p className="font-medium text-foreground">{address.label}</p>}
              {address.is_default && (
                <span className="mb-1 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">
                  {t("default")}
                </span>
              )}
              <p className="text-sm text-foreground">{address.recipient_name} — {address.phone}</p>
              <p className="text-sm text-muted">{address.detailed_address}</p>
              {address.landmark && <p className="text-sm text-muted">{address.landmark}</p>}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 text-sm">
              <Link href={`/account/addresses/${address.id}/edit`} className="text-brand-700 hover:underline">
                {t("edit")}
              </Link>
              {!address.is_default && (
                <button
                  type="button"
                  className="text-brand-700 hover:underline"
                  onClick={() => startTransition(() => setDefaultAddressAction(locale, address.id))}
                >
                  {t("setDefault")}
                </button>
              )}
              <button
                type="button"
                className="text-danger hover:underline"
                onClick={() => {
                  if (confirm(t("confirmDelete"))) {
                    startTransition(() => deleteAddressAction(locale, address.id));
                  }
                }}
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
