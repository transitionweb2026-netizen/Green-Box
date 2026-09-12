import { getLocale, getTranslations } from "next-intl/server";
import { listActiveAreas } from "@/lib/services/delivery";
import { createAddressAction } from "../actions";
import { AddressForm } from "@/components/storefront/address-form";

export default async function NewAddressPage() {
  const t = await getTranslations("addresses");
  const locale = await getLocale();
  const areas = await listActiveAreas();

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">{t("add")}</h1>
      <div className="mt-6">
        <AddressForm areas={areas} action={createAddressAction.bind(null, locale)} />
      </div>
    </div>
  );
}
