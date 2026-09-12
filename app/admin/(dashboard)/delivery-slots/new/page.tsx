import { SlotForm } from "@/components/admin/slot-form";
import { createSlotAction } from "../actions";

export default function NewSlotPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">إضافة ميعاد توصيل جديد</h1>
      <div className="mt-6">
        <SlotForm action={createSlotAction} />
      </div>
    </div>
  );
}
