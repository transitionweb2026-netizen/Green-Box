import { Card } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-xl font-bold text-brand-700">جرين بوكس · الإدارة</h1>
        <Card>
          <AdminLoginForm />
        </Card>
      </div>
    </div>
  );
}
