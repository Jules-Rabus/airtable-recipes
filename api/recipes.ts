"use server";

import { z } from "zod";
import {
  IngredientOption,
  nutritionDataSchema,
  InstructionRecord,
  NutritionData,
  RecipeType,
  RecipeIngredientRecord,
  RecipeRecord,
  recipeSchema,
} from "@/schemas";
import { createRecord, deleteRecord, getRecord, getRecords } from "@/lib/axios";
import { AirtableTables } from "@/constants/airtable";
import { generateObject } from "ai";
import { mistral } from "@ai-sdk/mistral";
import {
  addRecipeIngredientJoins,
  fetchRecipeIngredientJoins,
} from "@/api/recipeIngredients";
import {
  addRecipeInstructions,
  fetchRecipeInstructions,
} from "@/api/recipeInstructions";
import { getIngredientOptions } from "@/api/ingredients";

export const generateRecipes = async (payload: {
  ingredients: { id: string; name: string }[];
  intolerances: string[];
  serving: number;
  genre?: string;
}): Promise<RecipeType[]> => {
  const { ingredients, intolerances, serving = 1, genre } = payload;
  const ingredientListString = ingredients.map(ingredient => ingredient.name).join(", ");
  const intoleranceListString = intolerances.length > 0 ? intolerances.join(", ") : "aucune";

  const typeInfo = genre ? ` de type ${genre}` : "";
  const prompt = `
    Crée 3-10 recettes délicieuses${typeInfo} en utilisant UNIQUEMENT les ingrédients alimentaires fournis.

    NOMBRE DE RECETTES :
    - Génère 3 recettes minimum sauf si les intolérances alimentaires rendent cela impossible
    - Génère jusqu'à 10 recettes maximum
    - Adapte le nombre selon la créativité possible avec les ingrédients
    - Plus d'ingrédients = plus de recettes possibles
    - Varie les styles : entrées, plats, desserts, boissons, snacks

    ⚠️ RÈGLE ABSOLUE : Utilise SEULEMENT des ingrédients comestibles/alimentaires !
    - IGNORE complètement tout ingrédient qui n'est pas de la nourriture
    - N'utilise que les fruits, légumes, viandes, poissons, céréales, épices, produits laitiers, etc.
    - Si un ingrédient n'est pas comestible, ne l'utilise PAS dans tes recettes

    ⚠️ INTOLÉRANCES ALIMENTAIRES - RESPECT OBLIGATOIRE :
    - Intolérances à éviter : ${intoleranceListString}
    - Ne crée AUCUNE recette contenant des ingrédients liés aux intolérances
    - Vérifie chaque ingrédient utilisé contre la liste des intolérances
    - Si un ingrédient peut provoquer une intolérance, ne l'utilise PAS
    - Si trop d'ingrédients sont éliminés à cause des intolérances, génère moins de recettes mais respecte les contraintes

    CONTRAINTES STRICTES :
    - Utilise UNIQUEMENT les ingrédients alimentaires fournis : ${ingredientListString}
    - N'ajoute AUCUN ingrédient supplémentaire
    - Respecte absolument les intolérances : ${intoleranceListString}
    - Portions : ${serving} personne(s) par recette

    INGRÉDIENTS DISPONIBLES : ${ingredientListString}

    RÈGLES DE CRÉATION :
    1. Utilise SEULEMENT des ingrédients comestibles/alimentaires
    2. Varie les techniques culinaires (cru, cuit, mixé, sauté, grillé, rôti, braisé, frit, vapeur)
    3. Propose une grande variété de styles (entrée, plat principal, dessert, boisson, snack, apéritif)
    4. Équilibre les saveurs dans chaque recette
    5. Instructions claires et séquentielles (numérotées à partir de 1)
    6. ⚠️ QUANTITÉS OBLIGATOIRES : Adapte TOUTES les quantités d'ingrédients au nombre de personnes (${serving})
       - Pour ${serving} personne(s), calcule les quantités proportionnellement
       - Exemple : si 1 portion = 100g, alors ${serving} portions = ${serving * 100}g
       - Utilise des quantités réalistes et précises pour ${serving} personne(s)
    7. Créativité : Plus il y a d'ingrédients, plus tu peux être créatif et proposer de recettes
    8. ⚠️ VÉRIFICATION FINALE : Avant de finaliser chaque recette, vérifie qu'aucun ingrédient ne contient ou n'est lié aux intolérances mentionnées
  `;

  const systemPrompt = `Tu es un chef culinaire français expert. Tu dois TOUJOURS répondre en français.

       LANGUE OBLIGATOIRE : Français uniquement
    - Tous les titres de recettes en français
    - Toutes les descriptions en français
    - Toutes les instructions en français
    - Tous les noms d'ingrédients en français

    FORMAT JSON EXACT ATTENDU :
    {
      "recipes": [
        {
          "title": "Nom de la recette",
          "ingredients": [
            {
              "id": "ID_ingredient",
              "name": "Nom ingredient",
              "quantity": 1,
              "unit": "portion"
            }
          ],
          "instructions": [
            {
              "text": "Description de l'étape",
              "order": 1
            }
          ],
          "description": "Description courte de la recette",
          "serving": ${serving},
          "preparationTime": 15,
          "cookingTime": 30
        }
      ]
    }

    CHAMPS OBLIGATOIRES POUR CHAQUE RECETTE :
    - title : nom de la recette (string)
    - ingredients : array d'objets avec id, name, quantity (number), unit (string)
      ⚠️ IMPORTANT : Les quantités doivent être calculées pour ${serving} personne(s)
    - instructions : array d'objets avec text (string) et order (number)
    - description : description courte (string)
    - serving : ${serving} (number)
    - preparationTime : temps préparation en minutes (number)
    - cookingTime : temps cuisson en minutes (number)

    EXEMPLES DE BONNES PRATIQUES (en français) :
    - Avec pomme + banane → Smoothie pomme-banane + Compote de fruits mixés
    - Avec poulet + carotte → Poulet sauté aux carottes + Salade de poulet
    - Avec tomate + mozzarella → Salade caprese + Tomates farcies

    RÉPONSE FINALE :
    - Réponds UNIQUEMENT en JSON valide
    - TOUT en français (titres, descriptions, instructions)
    - Sans texte supplémentaire`;

  const { object } = await generateObject({
    model: mistral("mistral-medium-latest"),
    system: systemPrompt,
    prompt,
    schema: z.object({ recipes: z.array(recipeSchema) }),
  });

  if (object.recipes.length === 0) {
    throw new Error("Aucune recette ne peut être générée avec les ingrédients fournis en tenant compte de vos intolérances alimentaires. Veuillez modifier vos ingrédients ou réduire vos restrictions.");
  }

  return object.recipes;
};

export const getRecipes = async (): Promise<RecipeType[]> => {
  const recipes = (await getRecords(AirtableTables.RECIPES, {
    sort: [{ field: "Title", direction: "asc" }],
  })) as RecipeRecord[];

  const [ingredientJoins, instructions, ingredients] = (await Promise.all([
    fetchRecipeIngredientJoins(),
    fetchRecipeInstructions(),
    getIngredientOptions(),
  ])) as [RecipeIngredientRecord[], InstructionRecord[], IngredientOption[]];

  const ingredientsMap = new Map<string, RecipeIngredientRecord[]>();
  ingredientJoins.forEach((join) => {
    const refs = join.fields?.Recipes ?? [];
    refs.forEach((id) => {
      if (!ingredientsMap.has(id)) ingredientsMap.set(id, []);
      ingredientsMap.get(id)!.push(join);
    });
  });
  const instructionsMap = new Map<string, InstructionRecord[]>();
  instructions.forEach((instr) => {
    const refs = instr.fields?.Recipes ?? [];
    refs.forEach((id) => {
      if (!instructionsMap.has(id)) instructionsMap.set(id, []);
      instructionsMap.get(id)!.push(instr);
    });
  });

  return recipes.map((recipe) => ({
    id: recipe.id,
    createdTime: recipe.createdTime,
    title: recipe.fields?.Title ?? "Aucun titre",
    description: recipe.fields?.Description ?? "Aucune description",
    serving: recipe.fields?.Serving ?? 1,
    preparationTime: recipe.fields?.PreparationTime ?? 0,
    cookingTime: recipe.fields?.CookingTime ?? 0,
    difficulty: recipe.fields?.Difficulty ?? "Inconnu",
    type: recipe.fields?.Type ?? "Inconnu",
    ingredients: ingredientsMap.get(recipe.id)?.map((join) => ({
      id: join.fields?.Ingredient?.[0] ?? join.id,
      name:
        ingredients.find((ing) => ing.value === join.fields?.Ingredient?.[0])
          ?.label ?? "Inconnu",
      quantity: join.fields?.Quantity,
      unit: join.fields?.Unit,
    })),
    instructions: instructionsMap.get(recipe.id)?.map((i) => ({
      text: i.fields?.Instruction ?? "",
      order: i.fields?.Order ?? 0,
    })),
    fields: recipe.fields,
  }));
};

export const getRecipe = async (id: string): Promise<RecipeType> => {
  const recipe = await getRecord(AirtableTables.RECIPES, id);
  const recipeIngredientJoins = await fetchRecipeIngredientJoins(
    recipe.fields.ID,
  );
  const recipeInstructionJoins = await fetchRecipeInstructions(
    recipe.fields.ID,
  );
  const ingredients = await getIngredientOptions();

  return {
    id: (recipe as RecipeRecord).id,
    createdTime: (recipe as RecipeRecord).createdTime,
    title: recipe.fields?.Title ?? "Aucun titre",
    description: recipe.fields?.Description ?? "Aucune description",
    serving: recipe.fields?.Serving,
    preparationTime: recipe.fields?.PreparationTime,
    cookingTime: recipe.fields?.CookingTime,
    difficulty: recipe.fields?.Difficulty ?? "Inconnu",
    type: recipe.fields?.Type ?? "Inconnu",
    ingredients: recipeIngredientJoins.map((join) => ({
      id: join.fields?.Ingredient?.[0] ?? join.id,
      name:
        ingredients.find((ing) => ing.value === join.fields?.Ingredient?.[0])
          ?.label ?? "Inconnu",
      quantity: join.fields?.Quantity ?? 0,
      unit: join.fields?.Unit ?? "inconnu",
    })),
    instructions: recipeInstructionJoins.map((inst) => ({
      text: inst.fields?.Instruction ?? "",
      order: inst.fields?.Order ?? 0,
    })),
    fields: (recipe as RecipeRecord).fields,
  };
};

export const saveRecipe = async (recipe: RecipeType): Promise<void> => {
  const fields: Record<string, unknown> = {
    Title: recipe.title,
    Description: recipe.description,
    Serving: recipe.serving,
    PreparationTime: recipe.preparationTime,
    CookingTime: recipe.cookingTime,
    Difficulty: recipe.difficulty,
  };
  const savedRecipe = await createRecord(AirtableTables.RECIPES, fields);
  const allIngredients = (await getRecords(
    AirtableTables.INGREDIENTS,
  )) as Array<{ id: string }>;
  const validIds = new Set(allIngredients.map((ing) => ing.id));
  const filtered = (recipe.ingredients || []).filter(
    (ing) => ing.id && validIds.has(ing.id),
  );
  if (filtered.length > 0) {
    const joinRecords = filtered.map((ing) => ({
      Recipes: [savedRecipe.id],
      Ingredient: [ing.id as string],
      Quantity: ing.quantity,
      Unit: ing.unit,
    }));
    await addRecipeIngredientJoins(joinRecords);
  }
  if (recipe.instructions && recipe.instructions.length > 0) {
    const instructionRecords = recipe.instructions.map((inst) => ({
      Instruction: inst.text,
      Order: inst.order,
      Recipes: [savedRecipe.id],
    }));
    await addRecipeInstructions(instructionRecords);
  }
};

export const deleteRecipe = async (recipeId: string): Promise<void> => {
  await deleteRecord(AirtableTables.RECIPES, recipeId);
};

export const analyzeRecipeNutrition = async (payload: {
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  serving: number;
  recipeTitle: string;
}): Promise<NutritionData> => {
  const { ingredients, serving, recipeTitle } = payload;
  const ingredientList = ingredients
    .map((ing) => `${ing.name}: ${ing.quantity} ${ing.unit}`)
    .join(", ");
  const prompt = `Analyse la valeur nutritionnelle de cette recette avec PRÉCISION.

    INGRÉDIENTS : ${ingredientList}
    PORTIONS : ${serving} personne(s)
    RECETTE : ${recipeTitle || "Recette"}

    RÈGLES STRICTES D'ANALYSE :
    1. Calcule les valeurs nutritionnelles pour ${serving} portion(s) EXACTEMENT
    2. Utilise UNIQUEMENT des données nutritionnelles standardisées et vérifiées
    3. Inclus TOUTES les vitamines et minéraux présents (même si 0)
    4. Donne des notes nutritionnelles précises et factuelles en français
    5. Adapte les quantités proportionnellement au nombre de portions`;

  const systemPrompt = `Tu es un expert en nutrition français. Tu dois TOUJOURS répondre en français.

    CALCULS REQUIS (avec précision) :
    - Calories totales (kcal) : somme des calories de tous les ingrédients
    - Macronutriments : protéines, glucides, lipides (g) - additionner les valeurs
    - Micronutriments : fibres, sucres, sodium (mg) - additionner les valeurs
    - Vitamines : A, C, D, E, K, B1, B2, B3, B6, B12, folate - additionner les valeurs
    - Minéraux : calcium, fer, magnésium, phosphore, potassium, zinc, cuivre, manganèse, sélénium - additionner les valeurs

    CONTRAINTES DE CALCUL :
    - Multiplier les valeurs par (quantité en g / 100) pour chaque ingrédient
    - Additionner toutes les valeurs pour obtenir le total
    - Multiplier par le nombre de portions (${serving})
    - Arrondir à 1 décimale pour les macronutriments, 0 décimale pour les vitamines/minéraux
    - Si un ingrédient n'est pas dans la liste de référence, utiliser des valeurs moyennes réalistes
     - Pour chaque vitamine et minéral, donne une estimation même approximative basée sur des tables de composition ou des aliments proches.

    Réponds UNIQUEMENT en JSON valide, sans texte supplémentaire.`;

  const { object } = await generateObject({
    model: mistral("mistral-medium-latest"),
    prompt: prompt,
    system: systemPrompt,
    schema: nutritionDataSchema,
  });

  return object as NutritionData;
};
