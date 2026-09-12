import { notFound } from "next/navigation";
import { adminListTimeSlots } from "@/lib/services/delivery";
import { SlotForm } from "@/components/admin/slot-form";
import { updateSlotAction } from "../../actions";

export default async function EditSlotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slots = await adminListTimeSlots();
  const slot = slots.find((s) => s.id === id);
  if (!slot) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">تعديل ميعاد التوصيل</h1>
      <div className="mt-6">
        <SlotForm slot={slot} action={updateSlotAction.bind(null, id)} />
      </div>
    </div>
  );
}
