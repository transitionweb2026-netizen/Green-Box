import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/storefront/logo";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default function AdminLoginPage() {
  return (
    <div className="bg-deep-gradient relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="blob h-80 w-80 bg-brand-500/20 -top-16 -start-16 animate-float-slow" aria-hidden="true" />
      <div className="blob h-72 w-72 bg-deep-300/20 -bottom-10 end-0" aria-hidden="true" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo siteName="جرين بوكس" tone="dark" />
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-300">
            <ShieldCheck className="h-3.5 w-3.5" /> لوحة التحكم
          </span>
        </div>
        <Card tone="glass" className="glass-panel">
          <AdminLoginForm />
        </Card>
      </div>
    </div>
  );
}
