import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { ProfileForm } from "@/components/storefront/profile-form";

export default async function ProfilePage() {
  const t = await getTranslations("account");
  const profile = await getCurrentProfile();
  if (!profile) return null;

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">{t("profileTitle")}</h1>
      <div className="mt-6">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
