"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "./components/Navigation";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";

import React from "react";
import { RecipeCard } from "./components/RecipeCard";
import { getIngredientOptions, createIngredient } from "@/api/ingredients";
import { generateRecipes } from "@/api/recipes";
import { IngredientOption, RecipeType } from "@/schemas";

import { toast } from "sonner";
import { FaMagic, FaPlus } from "react-icons/fa";

const INITIAL_INTOLERANCES = [
  { label: "Brocolis", value: "gluten" },
  { label: "Lactose", value: "lactose" },
  { label: "Fruits à coque", value: "nuts" },
  { label: "Oeufs", value: "eggs" },
  { label: "Poisson", value: "fish" },
  { label: "Soja", value: "soy" },
  { label: "Fruits de mer", value: "shellfish" },
  { label: "Cacao", value: "cacao" },
  { label: "Chocolat", value: "chocolate" },
  { label: "Arachides", value: "peanuts" },
  { label: "Sulfites", value: "sulfites" },
  { label: "Céleri", value: "celery" },
  { label: "Moutarde", value: "mustard" },
  { label: "Sésame", value: "sesame" },
  { label: "Légumineuses", value: "legumes" },
  { label: "Autre", value: "other" },
];

export default function Home() {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingredientOptions, setIngredientOptions] = useState<
    IngredientOption[]
  >([]);
  const [recipes, setRecipes] = useState<RecipeType[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [selectedIntolerances, setSelectedIntolerances] = useState<string[]>(
    [],
  );
  const [intoleranceOptions, setIntoleranceOptions] =
    useState(INITIAL_INTOLERANCES);
  const [serving, setServing] = useState(1);
  const [genre, setGenre] = useState("");
  const [progress, setProgress] = useState(0);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [intoleranceSearch, setIntoleranceSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const options = await getIngredientOptions();
        setIngredientOptions(options);
      } catch {
        setIngredientOptions([]);
      } finally {
        // setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggleIngredient = (value: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleToggleIntolerance = (value: string) => {
    setSelectedIntolerances((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleAddNewIngredient = async () => {
    const newIngredientName = ingredientSearch.trim();
    if (
      newIngredientName &&
      !ingredientOptions.some(
        (opt) => opt.label.toLowerCase() === newIngredientName.toLowerCase(),
      )
    ) {
      try {
        const newIngredientFromApi = await createIngredient({
          name: newIngredientName,
        });
        // Adapt the API response to the format used in the frontend
        const newIngredient = {
          label: newIngredientFromApi.name,
          value: newIngredientFromApi.id,
        };
        setIngredientOptions((prev) => [newIngredient, ...prev]);
        setSelectedIngredients((prev) => [...prev, newIngredient.value]);
        setIngredientSearch("");
        toast.success(
          `"${newIngredientName}" a été ajouté à vos ingrédients !`,
        );
      } catch {
        toast.error("Erreur lors de l'ajout de l'ingrédient.");
      }
    }
  };

  const handleAddNewIntolerance = () => {
    const newIntoleranceName = intoleranceSearch.trim();
    if (
      newIntoleranceName &&
      !intoleranceOptions.some(
        (opt) => opt.label.toLowerCase() === newIntoleranceName.toLowerCase(),
      )
    ) {
      const newIntolerance = {
        label: newIntoleranceName,
        value: newIntoleranceName.toLowerCase(),
      };
      setIntoleranceOptions((prev) => [newIntolerance, ...prev]);
      setSelectedIntolerances((prev) => [...prev, newIntolerance.value]);
      setIntoleranceSearch("");
    }
  };

  const handleSelectAllIngredients = () => {
    if (selectedIngredients.length === ingredientOptions.length) {
      setSelectedIngredients([]);
    } else {
      setSelectedIngredients(ingredientOptions.map((opt) => opt.value));
    }
  };

  const filteredIngredients = ingredientOptions.filter((option) =>
    option.label.toLowerCase().includes(ingredientSearch.toLowerCase()),
  );

  const filteredIntolerances = intoleranceOptions.filter((option) =>
    option.label.toLowerCase().includes(intoleranceSearch.toLowerCase()),
  );

  const [progressMessage, setProgressMessage] = useState("");

  const handleRecipeSaved = (savedRecipeIndex: number) => {
    setRecipes((prevRecipes) =>
      prevRecipes.filter((_, index) => index !== savedRecipeIndex),
    );
  };

  const handleGenerateRecipe = async () => {
    setRecipes([]);
    setRecipeError(null);
    setRecipeLoading(true);
    setProgress(0);
    setProgressMessage("Initialisation de l'IA...");

    const progressSteps = [
      {
        targetProgress: 8,
        message: "Analyse des ingrédients...",
        duration: 4000,
      },
      {
        targetProgress: 20,
        message: "Création des combinaisons culinaires...",
        duration: 6000,
      },
      {
        targetProgress: 35,
        message: "Génération des instructions...",
        duration: 6000,
      },
      {
        targetProgress: 55,
        message: "Optimisation des recettes...",
        duration: 6000,
      },
      {
        targetProgress: 75,
        message: "Finalisation des détails...",
        duration: 6000,
      },
      {
        targetProgress: 90,
        message: "Préparation de la réponse...",
        duration: 4000,
      },
      { targetProgress: 98, message: "Finalisation...", duration: 2000 },
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

        const easedProgress =
          stepProgress * stepProgress * (3 - 2 * stepProgress);
        const currentStepProgress =
          stepStartProgress +
          (step.targetProgress - stepStartProgress) * easedProgress;

        setProgress(Math.round(currentStepProgress));

        if (stepElapsed >= step.duration) {
          setProgressMessage(step.message);
          currentStep++;
          stepStartTime = now;
          stepStartProgress = step.targetProgress;
        }
      }
    }, 50);

    try {
      const selectedIngredientObjects = selectedIngredients.map((id) => {
        const found = ingredientOptions.find((opt) => opt.value === id);
        return found
          ? { id: found.value, name: found.label }
          : { id, name: id };
      });
      const recipesArr = await generateRecipes({
        ingredients: selectedIngredientObjects,
        intolerances: selectedIntolerances,
        serving,
        genre,
      });
      setRecipes(
        recipesArr.map((r) => ({
          ...r,
          ingredientIdMap: selectedIngredientObjects,
        })),
      );
      setProgress(100);
      setProgressMessage("Recettes générées avec succès !");
      toast.success("Recettes générées avec succès !");
    } catch (err: unknown) {
      const error = err as Error;
      setRecipeError(error.message || "Unknown error");
      toast.error(
        `Erreur lors de la génération des recettes: ${error.message}`,
      );
    } finally {
      setRecipeLoading(false);
      clearInterval(smoothProgressInterval);
      setTimeout(() => {
        setProgress(0);
        setProgressMessage("");
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />

      <main className="container-modern section-padding">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
          <div className="text-center space-y-6 sm:space-y-8 fade-in-up">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="heading-xl gradient-text px-4">
                Votre Assistant Culinaire Magique
              </h1>
              <p className="text-body text-base sm:text-lg max-w-3xl mx-auto px-4">
                Donnez-moi vos ingrédients, et je transformerai votre cuisine en
                une aventure gastronomique. Des recettes sur mesure, rien que
                pour vous.
              </p>
            </div>
          </div>

          <div className="scale-in">
            <Card className="modern-card max-w-4xl mx-auto">
              <CardHeader className="text-center pb-6 sm:pb-8">
                <CardTitle className="heading-md flex items-center justify-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600">
                    <FaMagic className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <span className="text-lg sm:text-xl">Créer une recette</span>
                </CardTitle>
                <CardDescription className="text-body text-base sm:text-lg">
                  Composez votre plat idéal en sélectionnant vos ingrédients et
                  préférences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 sm:space-y-8">
                <div className="space-y-3">
                  <Label
                    htmlFor="ingredients"
                    className="text-base font-semibold text-slate-900"
                  >
                    Quels ingrédients avez-vous sous la main ?
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="ingredients"
                      placeholder="Rechercher ou ajouter un ingrédient..."
                      value={ingredientSearch}
                      onChange={(e) => setIngredientSearch(e.target.value)}
                    />
                    <Button onClick={handleAddNewIngredient}>
                      <FaPlus />
                    </Button>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button variant="link" onClick={handleSelectAllIngredients}>
                      {selectedIngredients.length === ingredientOptions.length
                        ? "Tout désélectionner"
                        : "Tout sélectionner"}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {filteredIngredients.map((option) => (
                      <Badge
                        key={option.value}
                        variant={
                          selectedIngredients.includes(option.value)
                            ? "default"
                            : "outline"
                        }
                        onClick={() => handleToggleIngredient(option.value)}
                        className="cursor-pointer"
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />
                <div className="space-y-3">
                  <Label
                    htmlFor="intolerances"
                    className="text-base font-semibold text-slate-900"
                  >
                    Avez-vous des restrictions alimentaires ?
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="intolerances"
                      placeholder="Rechercher ou ajouter une intolérance..."
                      value={intoleranceSearch}
                      onChange={(e) => setIntoleranceSearch(e.target.value)}
                    />
                    <Button onClick={handleAddNewIntolerance}>
                      <FaPlus />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {filteredIntolerances.map((option) => (
                      <Badge
                        key={option.value}
                        variant={
                          selectedIntolerances.includes(option.value)
                            ? "default"
                            : "outline"
                        }
                        onClick={() => handleToggleIntolerance(option.value)}
                        className="cursor-pointer"
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="serving"
                      className="text-base font-semibold text-slate-900"
                    >
                      👥 Pour combien de personnes ?
                    </Label>
                    <Input
                      id="serving"
                      type="number"
                      min={1}
                      max={100}
                      value={serving}
                      onChange={(e) => setServing(Number(e.target.value))}
                      placeholder="Nombre de convives"
                      className="input-modern text-center h-12 text-lg"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="genre"
                      className="text-base font-semibold text-slate-900"
                    >
                      🍽️ Type de plat
                    </Label>
                    <Input
                      id="genre"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      placeholder="Ex: Entrée, Plat végétarien, Dessert rapide..."
                      className="input-modern h-12"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-center pt-6">
                  <Button
                    onClick={handleGenerateRecipe}
                    disabled={recipeLoading || selectedIngredients.length === 0}
                    className="btn-primary w-full sm:w-auto text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <FaMagic className="h-5 w-5 mr-3" />
                    {recipeLoading
                      ? "Génération en cours..."
                      : "Trouver des idées de recettes"}
                  </Button>
                </div>

                {recipeLoading && (
                  <div className="pt-8">
                    <p className="text-center font-semibold text-lg text-primary mb-4">
                      {progressMessage}
                    </p>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}

                {recipeError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{recipeError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {recipeError && (
            <div className="max-w-4xl mx-auto pt-8 text-center">
              <p className="text-red-600 font-semibold text-lg">
                Erreur de génération
              </p>
              <p className="text-muted-foreground">{recipeError}</p>
              <Button
                variant="outline"
                onClick={handleGenerateRecipe}
                className="mt-4"
              >
                Réessayer
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recipes.map((recipe, index) => (
              <RecipeCard
                key={index}
                recipe={recipe}
                onRecipeSaved={() => handleRecipeSaved(index)}
                showSaveButton={true}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
