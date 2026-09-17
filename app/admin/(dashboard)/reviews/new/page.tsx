import { ReviewForm } from "@/components/admin/review-form";
import { createReviewAction } from "../actions";

export default function NewReviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">إضافة رأي عميل جديد</h1>
      <div className="mt-6">
        <ReviewForm action={createReviewAction} />
      </div>
    </div>
  );
}
