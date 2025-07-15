"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "../components/Navigation";
import { RecipeCard } from "../components/RecipeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { FaPlus } from "react-icons/fa";
import { IoRestaurantOutline } from "react-icons/io5";
import Link from "next/link";
import { toast } from "sonner";
import { getRecipes } from "@/api/recipes";
import { RecipeType } from "@/schemas";
import { Input } from "@/components/ui/input";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await getRecipes();
      setRecipes(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to load recipes");
      toast.error("Erreur lors du chargement des recettes");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecipe = (deletedRecipeId: string) => {
    setRecipes((prevRecipes) =>
      prevRecipes.filter((recipe) => recipe.id !== deletedRecipeId),
    );
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold gradient-text">
                  Mon Carnet de Recettes
                </h1>
                <p className="text-muted-foreground">
                  Toutes vos recettes favorites, réunies en un seul endroit.
                </p>
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={loadRecipes} variant="outline">
              Réessayer
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <main className="container-modern section-padding">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="heading-lg gradient-text flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600">
                  <IoRestaurantOutline className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-xl sm:text-2xl">
                  Mon Carnet de Recettes
                </span>
              </h1>
              <p className="text-body mt-2">
                {filteredRecipes.length} recette
                {filteredRecipes.length > 1 ? "s" : ""} enregistrée
                {filteredRecipes.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                placeholder="Rechercher une recette..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              <Link href="/">
                <Button className="btn-primary w-full sm:w-auto">
                  <FaPlus className="w-4 h-4 mr-2 lucide-plus" />
                  Créer une nouvelle recette
                </Button>
              </Link>
            </div>
          </div>

          {filteredRecipes.length > 0 ? (
            <div className="card-grid">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onDelete={handleDeleteRecipe}
                  showDeleteButton={true}
                  showSaveButton={false}
                  className="h-full"
                />
              ))}
            </div>
          ) : (
            <Card className="modern-card max-w-4xl mx-auto">
              <CardContent className="pt-12 sm:pt-16 pb-12 sm:pb-16">
                <div className="text-center space-y-6">
                  <div className="ai-float">
                    <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-r from-green-100 to-emerald-100 mx-auto">
                      <span className="text-3xl sm:text-4xl">🍽️</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="heading-md">Votre carnet est encore vide</h3>
                    <p className="text-body px-4">
                      Générez des recettes et sauvegardez-les pour les retrouver
                      ici.
                    </p>
                  </div>
                  <Link href="/">
                    <Button className="btn-primary w-full sm:w-auto">
                      <FaPlus className="w-4 h-4 mr-2" />
                      Générer ma première recette
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
