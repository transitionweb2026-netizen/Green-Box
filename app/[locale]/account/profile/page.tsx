import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/storefront/profile-form";

export default async function ProfilePage() {
  const t = await getTranslations("account");
  const profile = await getCurrentProfile();
  if (!profile) return null;

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">{t("profileTitle")}</h1>
      <Card className="mt-6 max-w-md">
        <ProfileForm profile={profile} />
      </Card>
    </div>
  );
}
