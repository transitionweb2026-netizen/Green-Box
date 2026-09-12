import { requireAdmin } from "@/lib/auth/session";
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
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
        <span className="font-bold text-brand-700">جرين بوكس · الإدارة</span>
        <AdminLogoutButton />
      </div>
      <AdminNav />
      <div className="flex-1">
        <header className="hidden items-center justify-between border-b border-border bg-background px-6 py-3 md:flex">
          <span className="font-bold text-brand-700">جرين بوكس · الإدارة</span>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span>{profile.full_name ?? profile.email}</span>
            <AdminLogoutButton />
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
