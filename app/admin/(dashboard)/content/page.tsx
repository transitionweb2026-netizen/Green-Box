import { adminListBanners, getSetting } from "@/lib/services/content";
import { Card } from "@/components/ui/card";
import { BannerManager } from "@/components/admin/banner-manager";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";

interface StoreInfo {
  store_name?: string;
  contact_phone?: string;
  contact_email?: string;
}

export default async function AdminContentPage() {
  const [banners, storeInfo] = await Promise.all([adminListBanners(), getSetting<StoreInfo>("store_info")]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">المحتوى</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <BannerManager banners={banners} />
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold text-foreground">إعدادات المتجر</h2>
          <StoreSettingsForm storeInfo={storeInfo} />
        </Card>
      </div>
    </div>
  );
}
