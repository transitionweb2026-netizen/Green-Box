import { Card } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
      <Card className="mt-6 text-center text-muted">
        لوحة التحكم الكاملة (الطلبات، المنتجات، الأقسام، الصناديق، مناطق
        التوصيل...) هتُبنى في المرحلة الثالثة، بعد ربط قاعدة البيانات في
        المرحلة الثانية. المرحلة الحالية بتؤسس فقط هيكل المسارات والتصميم
        الأساسي.
      </Card>
    </div>
  );
}
