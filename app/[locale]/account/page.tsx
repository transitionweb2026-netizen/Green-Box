import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export default async function AccountIndexPage() {
  const locale = await getLocale();
  redirect(`/${locale}/account/profile`);
}
