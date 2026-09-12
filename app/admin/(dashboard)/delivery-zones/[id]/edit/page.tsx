import { notFound } from "next/navigation";
import { adminListAreas, adminListZones } from "@/lib/services/delivery";
import { ZoneForm } from "@/components/admin/zone-form";
import { AreaManager } from "@/components/admin/area-manager";
import { updateZoneAction } from "../../actions";

export default async function EditZonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [zones, allAreas] = await Promise.all([adminListZones(), adminListAreas()]);
  const zone = zones.find((z) => z.id === id);
  if (!zone) notFound();

  const areasForZone = allAreas.filter((a) => a.delivery_zone_id === id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">تعديل منطقة التوصيل</h1>
      <div className="mt-6 space-y-10">
        <ZoneForm zone={zone} action={updateZoneAction.bind(null, id)} />
        <AreaManager zoneId={id} areas={areasForZone} />
      </div>
    </div>
  );
}
