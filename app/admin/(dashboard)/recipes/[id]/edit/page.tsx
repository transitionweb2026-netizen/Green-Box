import { notFound } from "next/navigation";
import { adminGetRecipe } from "@/lib/services/recipes";
import { RecipeForm } from "@/components/admin/recipe-form";
import { updateRecipeAction } from "../../actions";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await adminGetRecipe(id);
  if (!recipe) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">تعديل الوصفة</h1>
      <div className="mt-6">
        <RecipeForm recipe={recipe} action={updateRecipeAction.bind(null, id)} />
      </div>
    </div>
  );
}
