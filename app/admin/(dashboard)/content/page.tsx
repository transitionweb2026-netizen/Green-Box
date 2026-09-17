import { FileText } from "lucide-react";
import { adminListBanners, getSetting, type FaqContent, type HomepageContent, type StoreInfo, type TermsContent } from "@/lib/services/content";
import { Card } from "@/components/ui/card";
import { BannerManager } from "@/components/admin/banner-manager";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import { ReservationSettingsForm } from "@/components/admin/reservation-settings-form";
import { OrderPolicySettingsForm } from "@/components/admin/order-policy-settings-form";
import { HomepageContentForm } from "@/components/admin/homepage-content-form";
import { FaqContentForm } from "@/components/admin/faq-content-form";
import { TermsContentForm } from "@/components/admin/terms-content-form";

interface ReservationSettings {
  lead_days?: number;
}

interface OrderPolicySettings {
  customer_cancellation_enabled?: boolean;
  cancellation_cutoff_hours?: number;
}

export default async function AdminContentPage() {
  const [banners, storeInfo, reservationSettings, orderPolicySettings, homepageContent, faqContent, termsContent] = await Promise.all([
    adminListBanners(),
    getSetting<StoreInfo>("store_info"),
    getSetting<ReservationSettings>("reservation_settings"),
    getSetting<OrderPolicySettings>("order_policy_settings"),
    getSetting<HomepageContent>("homepage_content"),
    getSetting<FaqContent>("faq_content"),
    getSetting<TermsContent>("terms_content"),
  ]);

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white">
          <FileText className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-extrabold text-foreground">المحتوى</h1>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card tone="glass">
          <BannerManager banners={banners} />
        </Card>
        <Card tone="glass">
          <h2 className="mb-4 font-bold text-foreground">إعدادات المتجر</h2>
          <StoreSettingsForm storeInfo={storeInfo} />
        </Card>
        <Card tone="glass">
          <h2 className="mb-4 font-bold text-foreground">إعدادات الحجز المسبق</h2>
          <ReservationSettingsForm leadDays={reservationSettings?.lead_days ?? 1} />
        </Card>
        <Card tone="glass">
          <h2 className="mb-4 font-bold text-foreground">إعدادات إلغاء الطلبات</h2>
          <OrderPolicySettingsForm
            cancellationEnabled={orderPolicySettings?.customer_cancellation_enabled ?? true}
            cutoffHours={orderPolicySettings?.cancellation_cutoff_hours ?? 2}
          />
        </Card>
        <Card tone="glass" className="lg:col-span-2">
          <h2 className="mb-4 font-bold text-foreground">محتوى الصفحة الرئيسية</h2>
          <HomepageContentForm content={homepageContent} />
        </Card>
        <Card tone="glass" className="lg:col-span-2">
          <h2 className="mb-4 font-bold text-foreground">الأسئلة الشائعة (فوق الفوتر في كل الصفحات)</h2>
          <FaqContentForm content={faqContent} />
        </Card>
        <Card tone="glass" className="lg:col-span-2">
          <h2 className="mb-4 font-bold text-foreground">الشروط والأحكام (فوق الفوتر في كل الصفحات)</h2>
          <TermsContentForm content={termsContent} />
        </Card>
      </div>
    </div>
  );
}
