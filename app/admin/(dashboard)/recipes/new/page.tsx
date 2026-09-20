import { RecipeForm } from "@/components/admin/recipe-form";
import { createRecipeAction } from "../actions";

export default function NewRecipePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">إضافة وصفة جديدة</h1>
      <div className="mt-6">
        <RecipeForm action={createRecipeAction} />
      </div>
    </div>
  );
}
