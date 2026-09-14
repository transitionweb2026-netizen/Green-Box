import { adminListStaff } from "@/lib/services/customers";
import { createClient } from "@/lib/supabase/server";
import { StaffManager } from "@/components/admin/staff-manager";

export default async function AdminStaffPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const staff = await adminListStaff();

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">الموظفون والصلاحيات</h1>
      <p className="mt-1 text-sm text-muted">إدارة المستخدمين الذين لديهم صلاحية الوصول إلى لوحة التحكم.</p>

      <div className="mt-6">
        <StaffManager staff={staff} currentProfileId={user?.id ?? ""} />
      </div>
    </div>
  );
}
