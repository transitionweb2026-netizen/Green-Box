import { MapPinPlus, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listMyAddresses } from "@/lib/services/addresses";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AddressList } from "@/components/storefront/address-list";

export default async function AddressesPage() {
  const t = await getTranslations("addresses");
  const addresses = await listMyAddresses();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
        <Link href="/account/addresses/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          {t("add")}
        </Link>
      </div>

      <div className="mt-6">
        {addresses.length === 0 ? (
          <EmptyState
            icon={<MapPinPlus className="h-7 w-7" />}
            title={t("empty")}
            action={
              <Link href="/account/addresses/new" className={buttonVariants()}>
                {t("add")}
              </Link>
            }
          />
        ) : (
          <AddressList addresses={addresses} />
        )}
      </div>
    </div>
  );
}
