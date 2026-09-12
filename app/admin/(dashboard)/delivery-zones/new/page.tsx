import { ZoneForm } from "@/components/admin/zone-form";
import { createZoneAction } from "../actions";

export default function NewZonePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">إضافة منطقة توصيل جديدة</h1>
      <div className="mt-6">
        <ZoneForm action={createZoneAction} />
      </div>
    </div>
  );
}
