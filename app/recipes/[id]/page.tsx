"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Navigation } from "../../components/Navigation";
import { Badge } from "@/components/ui/badge";
import { NutritionCard } from "../../components/NutritionCard";

import { Skeleton } from "@/components/ui/skeleton";
import { ChefHat, Calendar, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getRecipe, deleteRecipe, analyzeRecipeNutrition } from "@/lib/api/recipes";
import { NutritionData, Recipe } from "@/lib/types";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
  const [nutritionProgress, setNutritionProgress] = useState(0);
  const [nutritionProgressMessage, setNutritionProgressMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const data = await getRecipe(recipeId);
        setRecipe(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      fetchRecipe();
    }
  }, [recipeId]);

  const handleDeleteRecipe = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteRecipe(recipeId);
      toast.success("Recette supprimée avec succès !");
      router.push('/recipes');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error("Erreur lors de la suppression de la recette");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAnalyzeNutrition = async () => {
    if (!recipe) return;
    
    setNutritionLoading(true);
    setNutritionProgress(0);
    setNutritionProgressMessage("Initialisation de l'analyse...");
    setIsNutritionModalOpen(true);

    const progressSteps = [
      { targetProgress: 10, message: "Analyse des ingrédients...", duration: 1500 },
      { targetProgress: 25, message: "Calcul des calories...", duration: 2000 },
      { targetProgress: 40, message: "Évaluation des macronutriments...", duration: 2000 },
      { targetProgress: 60, message: "Analyse des vitamines...", duration: 2000 },
      { targetProgress: 80, message: "Calcul des minéraux...", duration: 1500 },
      { targetProgress: 95, message: "Finalisation de l'analyse...", duration: 1000 }
    ];

    let currentStep = 0;
    let stepStartTime = Date.now();
    let stepStartProgress = 0;

    const smoothProgressInterval = setInterval(() => {
      const now = Date.now();
      
      if (currentStep < progressSteps.length) {
        const step = progressSteps[currentStep];
        const stepElapsed = now - stepStartTime;
        const stepProgress = Math.min(stepElapsed / step.duration, 1);
        
        const easedProgress = stepProgress * stepProgress * (3 - 2 * stepProgress);
        const currentStepProgress = stepStartProgress + (step.targetProgress - stepStartProgress) * easedProgress;
        
        setNutritionProgress(Math.round(currentStepProgress));
        
        if (stepElapsed >= step.duration) {
          setNutritionProgressMessage(step.message);
          currentStep++;
          stepStartTime = now;
          stepStartProgress = step.targetProgress;
        }
      }
    }, 50);

    try {
      const ingredients = getIngredients(recipe).map(ing => ({
        name: ing.name,
        quantity: ing.quantity || 0,
        unit: ing.unit || ''
      }));
      const serving = getRecipeServing(recipe) || 1;
      const title = getRecipeTitle(recipe);
      
      const nutrition = await analyzeRecipeNutrition({
        ingredients,
        serving,
        recipeTitle: title
      });
      setNutritionData(nutrition);
      setNutritionProgress(100);
      setNutritionProgressMessage("Analyse terminée !");
    } catch (err) {
      const error = err as Error;
      console.error('Error analyzing nutrition:', error);
      setNutritionProgressMessage("Erreur lors de l'analyse");
    } finally {
      setNutritionLoading(false);
      clearInterval(smoothProgressInterval);
      setTimeout(() => {
        setNutritionProgress(0);
        setNutritionProgressMessage("");
      }, 1000);
    }
  };

  const getRecipeTitle = (recipe: Recipe) => {
    return recipe.fields?.Title || 'Recette sans titre';
  };

  const getRecipeDescription = (recipe: Recipe) => {
    return recipe.fields?.Description;
  };

  const getRecipeServing = (recipe: Recipe) => {
    return recipe.serving || recipe.fields?.Serving;
  };

  const getRecipePrepTime = (recipe: Recipe) => {
    return recipe.preparationTime || recipe.fields?.PreparationTime;
  };

  const getRecipeCookTime = (recipe: Recipe) => {
    return recipe.cookingTime || recipe.fields?.CookingTime;
  };

  const getRecipeCreatedAt = (recipe: Recipe) => {
    return recipe.created_at || recipe.createdTime;
  };

  const getIngredients = (recipe: Recipe) => {
    if (recipe.ingredients) return recipe.ingredients;
    
    if (recipe.recipe_ingredient_quantity_records) {
      return recipe.recipe_ingredient_quantity_records.map(record => ({
        id: record.id,
        name: record.ingredientName || `Ingrédient ${record.fields.Identifier}`,
        quantity: record.fields.Quantity,
        unit: record.fields.Unit
      }));
    }
    
    return [];
  };

  const getInstructions = (recipe: Recipe) => {
    if (recipe.instructions) return recipe.instructions;
    
    if (recipe.recipe_instruction_records) {
      return recipe.recipe_instruction_records
        .sort((a, b) => a.fields.Order - b.fields.Order)
        .map(record => ({
          text: record.fields.Instruction,
          order: record.fields.Order
        }));
    }
    
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
            <p className="text-muted-foreground mb-6">{error || 'Recette non trouvée'}</p>
            <Link href="/recipes">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux recettes
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const ingredients = getIngredients(recipe);
  const instructions = getInstructions(recipe);
  const serving = getRecipeServing(recipe) || 1;

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/recipes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold gradient-text">
                {getRecipeTitle(recipe)}
              </h1>
              {getRecipeDescription(recipe) && (
                <p className="text-muted-foreground mt-2">
                  {getRecipeDescription(recipe)}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteRecipe}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Suppression..." : "Supprimer la recette"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="w-5 h-5" />
                    Informations de la recette
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {getRecipePrepTime(recipe) || 0} min
                      </div>
                      <div className="text-sm text-muted-foreground">Préparation</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {getRecipeCookTime(recipe) || 0} min
                      </div>
                      <div className="text-sm text-muted-foreground">Cuisson</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {serving}
                      </div>
                      <div className="text-sm text-muted-foreground">Portions</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {(getRecipePrepTime(recipe) || 0) + (getRecipeCookTime(recipe) || 0)} min
                      </div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">🥕</span>
                    Ingrédients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ingredients.map((ingredient, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover-lift"
                      >
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <span className="font-medium flex-1">{ingredient.name}</span>
                        {ingredient.quantity && (
                          <Badge variant="secondary">
                            {ingredient.quantity} {ingredient.unit}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {instructions.map((instruction, index) => (
                      <div 
                        key={index} 
                        className="flex gap-4 p-4 bg-muted/30 rounded-lg hover-lift"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-relaxed">{instruction.text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">🥗</span>
                    Analyse Nutritionnelle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Découvrez les valeurs nutritionnelles de cette recette
                  </p>
                  <Dialog open={isNutritionModalOpen} onOpenChange={setIsNutritionModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={handleAnalyzeNutrition}
                        disabled={nutritionLoading}
                        className="w-full gradient-bg hover:opacity-90"
                      >
                        {nutritionLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Analyse en cours...
                          </div>
                        ) : (
                          "🔬 Analyser la nutrition"
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                      {nutritionLoading ? (
                        <div className="space-y-4 sm:space-y-6">
                          <div className="text-center space-y-3 sm:space-y-4">
                            <div className="ai-float">
                              <span className="text-3xl sm:text-5xl">🔬</span>
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-base sm:text-lg font-semibold">Analyse nutritionnelle en cours</h3>
                              <p className="text-xs text-muted-foreground">{nutritionProgressMessage}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{nutritionProgressMessage}</span>
                              <span>{nutritionProgress}%</span>
                            </div>
                            <Progress value={nutritionProgress} className="h-2" />
                          </div>
                        </div>
                      ) : nutritionData ? (
                        <NutritionCard 
                          nutrition={nutritionData} 
                          serving={serving}
                          noCard={true}
                        />
                      ) : (
                        <div className="text-center py-6 sm:py-8">
                          <p className="text-xs text-muted-foreground">Aucune donnée nutritionnelle disponible</p>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Métadonnées
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Créée le</span>
                    <span className="text-sm font-medium">
                      {getRecipeCreatedAt(recipe) ? new Date(getRecipeCreatedAt(recipe)!).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">ID</span>
                    <span className="text-sm font-mono">{recipe.id}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 