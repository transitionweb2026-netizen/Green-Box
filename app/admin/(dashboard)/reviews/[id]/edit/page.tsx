import { notFound } from "next/navigation";
import { adminGetReview } from "@/lib/services/reviews";
import { ReviewForm } from "@/components/admin/review-form";
import { updateReviewAction } from "../../actions";

export default async function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = await adminGetReview(id);
  if (!review) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">تعديل رأي العميل</h1>
      <div className="mt-6">
        <ReviewForm review={review} action={updateReviewAction.bind(null, id)} />
      </div>
    </div>
  );
}
