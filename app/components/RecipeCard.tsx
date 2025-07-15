"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  FaTrash,
  FaClock,
  FaUsers,
  FaSave,
  FaBookOpen,
  FaUtensils,
} from "react-icons/fa";
import { IoRestaurantOutline } from "react-icons/io5";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RecipeType } from "@/schemas";
import { saveRecipe, deleteRecipe } from "@/api/recipes";

interface RecipeCardProps {
  recipe: RecipeType;
  onDelete?: (recipeId: string) => void;
  showDeleteButton?: boolean;
  showSaveButton?: boolean;
  onRecipeSaved?: () => void;
  className?: string;
}

export function RecipeCard({
  recipe,
  onDelete,
  showDeleteButton = false,
  showSaveButton = true,
  onRecipeSaved,
  className,
}: RecipeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveRecipe = async () => {
    setIsSaving(true);
    try {
      await saveRecipe({
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        serving: recipe.serving,
        difficulty: recipe.difficulty,
        type: recipe.type,
        preparationTime: recipe.preparationTime,
        cookingTime: recipe.cookingTime,
      });

      toast.success("Recette sauvegardée avec succès !");
      if (onRecipeSaved) {
        onRecipeSaved();
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!recipe.id || !onDelete) return;

    setIsDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      onDelete(recipe.id);
      toast.success("Recette supprimée avec succès !");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const CardContentComponent = () => (
    <Card className="modern-card hover-lift transition-all duration-300 overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="heading-md gradient-text mb-3">
              {recipe.title}
            </CardTitle>
            <CardDescription className="text-body mb-4">
              {recipe.description}
            </CardDescription>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="badge-secondary">
                <FaClock className="w-3 h-3" />
                {recipe.preparationTime + recipe.cookingTime} min
              </Badge>
              <Badge variant="secondary" className="badge-secondary">
                <FaUsers className="w-3 h-3" />
                {recipe.serving} portion{recipe.type ? "s" : ""}
              </Badge>
              <Badge variant="secondary" className="badge-secondary">
                <IoRestaurantOutline className="w-3 h-3" />
                {recipe.difficulty}
              </Badge>
              <Badge variant="secondary" className="badge-secondary">
                {recipe.type}
              </Badge>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col gap-2 sm:gap-2 sm:ml-6">
            <Link href={`/recipes/${recipe.id}`}>
              <Button size="sm" className="btn-primary flex-1 sm:flex-none">
                <div className="flex items-center gap-1">
                  <FaUtensils className="w-3 h-3" />
                  <span className="text-xs hidden sm:inline">À la cuisine</span>
                </div>
              </Button>
            </Link>
            {showSaveButton && (
              <Button
                onClick={handleSaveRecipe}
                size="sm"
                variant="outline"
                className="btn-secondary flex-1 sm:flex-none"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                    <span className="hidden sm:inline">Sauvegarde...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <FaSave className="w-3 h-3" />
                    <span className="text-xs hidden sm:inline">
                      Sauvegarder
                    </span>
                  </div>
                )}
              </Button>
            )}

            {showDeleteButton && onDelete && (
              <Button
                onClick={handleDeleteRecipe}
                size="sm"
                variant="ghost"
                className="btn-ghost hover:text-red-600 transition-colors flex-1 sm:flex-none"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                    <span className="hidden sm:inline">Suppression...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <FaTrash className="w-3 h-3 lucide-trash" />
                    <span className="text-xs hidden sm:inline">Supprimer</span>
                  </div>
                )}
              </Button>
            )}

            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              size="sm"
              variant="ghost"
              className="btn-ghost flex-1 sm:flex-none"
            >
              {isExpanded ? (
                <div className="flex items-center gap-1">
                  <FaBookOpen className="w-3 h-3" />
                  <span className="text-xs hidden sm:inline">Masquer</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <FaBookOpen className="w-3 h-3" />
                  <span className="text-xs hidden sm:inline">Détails</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 fade-in-up">
          <Separator className="mb-6 sm:mb-8" />

          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-r from-green-100 to-emerald-100">
                <span className="text-sm sm:text-lg">🥕</span>
              </div>
              <h3 className="heading-md text-lg sm:text-xl">Ingrédients</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {recipe?.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 sm:p-4 bg-slate-50 rounded-lg hover-lift"
                  >
                    <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                    <span className="font-medium text-slate-900 text-sm sm:text-base">
                      {ingredient.name}
                    </span>
                    {ingredient.quantity && (
                      <span className="text-xs sm:text-sm text-slate-600 ml-auto">
                        {ingredient.quantity} {ingredient.unit}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 sm:py-8 text-slate-500">
                  Aucun ingrédient disponible
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6 sm:my-8" />

          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-indigo-100">
                <span className="text-sm sm:text-lg">📝</span>
              </div>
              <h3 className="heading-md text-lg sm:text-xl">Instructions</h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {recipe?.instructions && recipe.instructions.length > 0 ? (
                recipe.instructions.map((instruction, index) => (
                  <div
                    key={index}
                    className="flex gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-50 rounded-lg hover-lift"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-body text-sm sm:text-base leading-relaxed">
                      {instruction.text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 sm:py-8 text-slate-500">
                  Aucune instruction disponible
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );

  const MobileCardComponent = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden p-4">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-slate-800">{recipe.title}</h3>
        <div className="flex gap-2">
          {showSaveButton && (
            <Button onClick={handleSaveRecipe} size="icon" variant="ghost">
              <FaSave className="w-4 h-4" />
            </Button>
          )}
          {showDeleteButton && onDelete && (
            <Button
              onClick={handleDeleteRecipe}
              size="icon"
              variant="ghost"
              className="text-red-500 hover:text-red-700"
            >
              <FaTrash className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-600 mt-1">{recipe.description}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        <Badge variant="secondary">
          <FaClock className="w-3 h-3 mr-1" />
          {recipe.preparationTime + recipe.cookingTime} min
        </Badge>
        <Badge variant="secondary">
          <FaUsers className="w-3 h-3 mr-1" />
          {recipe.serving}p
        </Badge>
        <Badge variant="secondary">{recipe.difficulty}</Badge>
        <Badge variant="secondary">{recipe.type}</Badge>
      </div>

      <div className="flex items-center gap-4 mt-3">
        <Link href={`/recipes/${recipe.id}`}>
          <Button size="sm" variant="outline">
            <FaUtensils className="w-3 h-3 mr-2" />À la cuisine
          </Button>
        </Link>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary"
        >
          {isExpanded ? "Voir moins" : "Voir plus"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3">
          <Separator />
          <div className="mt-3">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Ingrédients</h4>
              <ul className="list-disc list-inside space-y-1">
                {recipe?.ingredients && recipe.ingredients.length > 0 ? (
                  recipe.ingredients.map((ing, index) => (
                    <li key={index}>
                      <span className="text-sm text-slate-700">
                        {ing.name}
                        {ing.quantity && ` - ${ing.quantity} ${ing.unit}`}
                      </span>
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Aucun ingrédient listé.
                  </p>
                )}
              </ul>
            </div>
            <div className="mt-3">
              <h4 className="font-semibold text-slate-800 mb-2">
                Instructions
              </h4>
              <ol className="list-decimal list-inside space-y-2">
                {recipe?.instructions && recipe.instructions.length > 0 ? (
                  recipe.instructions.map((ins, index) => (
                    <li key={index} className="text-sm text-slate-700">
                      {ins.text}
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Aucune instruction disponible.
                  </p>
                )}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>
      <div className="hidden md:block h-full">
        <CardContentComponent />
      </div>
      <div className="md:hidden">
        <MobileCardComponent />
      </div>
    </div>
  );
}
