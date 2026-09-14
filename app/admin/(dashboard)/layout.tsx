import { Menu } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { Logo } from "@/components/storefront/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

/**
 * Every admin page except /admin/login goes through this layout, which
 * enforces requireAdmin() -- defense-in-depth alongside the is_admin()
 * RLS policies that are the actual authorization boundary (see
 * DATABASE.md, RLS Strategy). A bug here can only produce a wrong
 * redirect, never expose another user's data.
 */
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="bg-deep-gradient flex items-center justify-between px-4 py-3 md:hidden">
        <Logo siteName="جرين بوكس · الإدارة" tone="dark" />
        <Menu className="h-5 w-5 text-white/70" />
      </div>
      <aside className="bg-deep-gradient relative overflow-hidden md:sticky md:top-0 md:h-screen">
        <div className="blob h-56 w-56 bg-brand-500/20 -top-16 -start-16" aria-hidden="true" />
        <div className="relative hidden px-5 pt-6 md:block">
          <Logo siteName="جرين بوكس" tone="dark" />
          <p className="mt-1 text-xs font-medium text-white/40">لوحة التحكم</p>
        </div>
        <div className="relative">
          <AdminNav />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="glass sticky top-0 z-30 hidden items-center justify-between !rounded-none border-x-0 border-t-0 px-6 py-3 md:flex">
          <span className="text-sm text-muted">
            أهلاً، <span className="font-bold text-foreground">{profile.full_name ?? profile.email}</span>
          </span>
          <AdminLogoutButton />
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
