import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getMyAddress } from "@/lib/services/addresses";
import { listActiveAreas } from "@/lib/services/delivery";
import { updateAddressAction } from "../../actions";
import { AddressForm } from "@/components/storefront/address-form";

export default async function EditAddressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("addresses");
  const locale = await getLocale();

  const [address, areas] = await Promise.all([getMyAddress(id), listActiveAreas()]);
  if (!address) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">{t("edit")}</h1>
      <div className="mt-6">
        <AddressForm areas={areas} address={address} action={updateAddressAction.bind(null, locale, id)} />
      </div>
    </div>
  );
}
