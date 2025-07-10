"use server";

import { z } from 'zod';
import { airtableIngredientRecordSchema, ingredientOptionSchema, recipeCardSchema, RecipeCard, IngredientOption } from '@/schemas/api';
import { Recipe, NutritionData, RecipeIngredientRecord, RecipeInstructionRecord } from './types';
import { getRecords, createRecord, createRecords, getRecord, deleteRecord } from './axios';
import { AirtableTables } from '@/constants/airtable';
import { generateObject } from 'ai';
import { mistral } from '@ai-sdk/mistral';

interface AirtableRecord {
  id: string;
  createdTime?: string;
  fields?: Record<string, unknown>;
}

interface IngredientRecord extends AirtableRecord {
  fields?: {
    Name?: string;
  };
}

interface RecipeRecord extends AirtableRecord {
  fields?: {
    Title?: string;
    Description?: string;
    Serving?: number;
    PrepTimeMinutes?: number;
    CookTimeMinutes?: number;
  };
}

interface JoinRecord extends AirtableRecord {
  fields?: {
    Recipe?: string[];
    Ingredient?: string[];
    Quantity?: number | string;
    Unit?: string;
    Identifier?: number;
  };
}

interface InstructionRecord extends AirtableRecord {
  fields?: {
    Recipe?: string[];
    Instruction?: string;
    Order?: number;
  };
}

export const getIngredientOptions = async (): Promise<IngredientOption[]> => {
  const records = await getRecords(AirtableTables.INGREDIENTS, {
    sort: [{ field: 'Name', direction: 'asc' }],
  });
  const parsed = z.array(airtableIngredientRecordSchema).parse(records);
  return parsed.map(r => ingredientOptionSchema.parse({ label: r.fields?.Name ?? r.id, value: r.id }));
};

export const createIngredient = async (name: string): Promise<IngredientOption> => {
  const record = await createRecord(AirtableTables.INGREDIENTS, { Name: name });
  const parsed = airtableIngredientRecordSchema.parse(record);
  return ingredientOptionSchema.parse({ label: parsed.fields?.Name ?? parsed.id, value: parsed.id });
};

export const generateRecipes = async (payload: { ingredients: { id: string; name: string }[]; intolerances: string[]; serving: number; genre?: string; }): Promise<RecipeCard[]> => {
  const { ingredients, intolerances, serving = 1, genre } = payload;
  const ingredientListJson = JSON.stringify(ingredients);
  const typeInfo = genre ? ` de type ${genre}` : '';
  const prompt = `
    Crée 3-10 recettes délicieuses${typeInfo} en utilisant UNIQUEMENT les ingrédients alimentaires fournis.

    NOMBRE DE RECETTES :
    - Génère 3 recettes minimum
    - Génère jusqu'à 10 recettes maximum
    - Adapte le nombre selon la créativité possible avec les ingrédients
    - Plus d'ingrédients = plus de recettes possibles
    - Varie les styles : entrées, plats, desserts, boissons, snacks

    ⚠️ RÈGLE ABSOLUE : Utilise SEULEMENT des ingrédients comestibles/alimentaires !
    - IGNORE complètement tout ingrédient qui n'est pas de la nourriture
    - N'utilise que les fruits, légumes, viandes, poissons, céréales, épices, produits laitiers, etc.
    - Si un ingrédient n'est pas comestible, ne l'utilise PAS dans tes recettes

    CONTRAINTES STRICTES :
    - Utilise UNIQUEMENT les ingrédients alimentaires fournis
    - N'ajoute AUCUN ingrédient supplémentaire
    - Respecte les intolérances : ${Array.isArray(intolerances) && intolerances.length > 0 ? intolerances.map(i => typeof i === 'object' && i !== null && 'name' in i ? (i as { name: string }).name : i).join(', ') : 'aucune'}
    - Portions : ${serving} personne(s) par recette

    INGRÉDIENTS DISPONIBLES : ${ingredientListJson}

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
    model: mistral('mistral-medium-latest'),
    system: systemPrompt,
    prompt,
    schema: z.object({ recipes: z.array(recipeCardSchema) })
  });
  return object.recipes as RecipeCard[];
};

export const getRecipes = async (): Promise<RecipeCard[]> => {
  const recipes = await getRecords(AirtableTables.RECIPES, {
    sort: [{ field: 'Title', direction: 'asc' }],
  });
  const joinRecords = await getRecords(AirtableTables.RECIPE_INGREDIENT);
  const ingredientsTable = await getRecords(AirtableTables.INGREDIENTS);
  const ingredientMap = Object.fromEntries(
    (ingredientsTable as IngredientRecord[]).map(ing => [ing.id, ing.fields?.Name || ing.id])
  );
  const instructionsTable = await getRecords(AirtableTables.RECIPE_INSTRUCTIONS);
  const result = (recipes as RecipeRecord[]).map(recipe => {
    const recipeIngredients = (joinRecords as JoinRecord[])
      .filter(jr => Array.isArray(jr.fields?.Recipe) && jr.fields.Recipe.includes(recipe.id))
      .map(jr => {
        const quantityStr = jr.fields?.Quantity;
        let quantity = 0;
        let unit = '';
        if (typeof quantityStr === 'number') quantity = quantityStr;
        else if (typeof quantityStr === 'string') {
          const match = quantityStr.match(/([\d.,]+)\s*(.*)/);
          if (match) {
            quantity = parseFloat(match[1].replace(',', '.'));
            unit = match[2].trim();
          }
        }
        const ingredientId = Array.isArray(jr.fields?.Ingredient) ? jr.fields.Ingredient[0] : jr.fields?.Ingredient;
        return {
          id: ingredientId,
          name: ingredientId ? ingredientMap[ingredientId] || '' : '',
          quantity,
          unit,
        };
      });
    const recipeInstructions = (instructionsTable as InstructionRecord[])
      .filter(inst => Array.isArray(inst.fields?.Recipe) && inst.fields.Recipe.includes(recipe.id))
      .sort((a, b) => (a.fields?.Order || 0) - (b.fields?.Order || 0))
      .map(inst => ({ text: inst.fields?.Instruction || '', order: inst.fields?.Order || 0 }));
    return {
      ...recipe,
      ingredients: recipeIngredients,
      instructions: recipeInstructions,
    } as RecipeCard;
  });
  return result;
};

export const getRecipe = async (id: string): Promise<Recipe> => {
  const recipe = await getRecord(AirtableTables.RECIPES, id);
  const ingredientJoins = await getRecords(AirtableTables.RECIPE_INGREDIENT);
  const recipeIngredientJoins = (ingredientJoins as JoinRecord[]).filter(jr => Array.isArray(jr.fields?.Recipe) && jr.fields.Recipe.includes(id));
  const allIngredients = await getRecords(AirtableTables.INGREDIENTS);
  const ingredientMap = Object.fromEntries((allIngredients as IngredientRecord[]).map(ing => [ing.id, ing.fields?.Name || ing.id]));
  const instructionJoins = await getRecords(AirtableTables.RECIPE_INSTRUCTIONS);
  const recipeInstructionJoins = (instructionJoins as InstructionRecord[]).filter(ir => Array.isArray(ir.fields?.Recipe) && ir.fields.Recipe.includes(id));
  const recipeIngredientJoinsWithNames = recipeIngredientJoins.map(join => {
    const ingredientId = Array.isArray(join.fields?.Ingredient) ? join.fields.Ingredient[0] : join.fields?.Ingredient;
    return {
      ...join,
      ingredientName: ingredientId ? ingredientMap[ingredientId] || `Ingrédient ${join.fields?.Identifier}` : `Ingrédient ${join.fields?.Identifier}`,
    };
  });
  return {
    id: (recipe as RecipeRecord).id,
    createdTime: (recipe as RecipeRecord).createdTime,
    fields: (recipe as RecipeRecord).fields,
    recipe_ingredient_quantity_records: recipeIngredientJoinsWithNames as RecipeIngredientRecord[],
    recipe_instruction_records: recipeInstructionJoins as RecipeInstructionRecord[],
  } as Recipe;
};

export const saveRecipe = async (recipe: RecipeCard): Promise<void> => {
  const fields = {
    Title: recipe.title,
    Description: recipe.description,
    Serving: recipe.serving,
    PreparationTime: recipe.preparationTime,
    CookingTime: recipe.cookingTime,
  } as Record<string, unknown>;
  const savedRecipe = await createRecord(AirtableTables.RECIPES, fields);
  const allIngredients = await getRecords(AirtableTables.INGREDIENTS) as Array<{ id: string }>;
  const validIds = new Set(allIngredients.map(ing => ing.id));
  const filtered = (recipe.ingredients || []).filter(ing => ing.id && validIds.has(ing.id));
  if (filtered.length > 0) {
    const joinRecords = filtered.map(ing => ({
      Recipe: [savedRecipe.id],
      Ingredient: [ing.id as string],
      Quantity: ing.quantity,
      Unit: ing.unit,
    }));
    await createRecords(AirtableTables.RECIPE_INGREDIENT, joinRecords);
  }
  if (recipe.instructions && recipe.instructions.length > 0) {
    const instructionRecords = recipe.instructions.map(inst => ({
      Instruction: inst.text,
      Order: inst.order,
      Recipes: [savedRecipe.id],
    }));
    await createRecords(AirtableTables.RECIPE_INSTRUCTIONS, instructionRecords);
  }
};

export const deleteRecipe = async (recipeId: string): Promise<void> => {
  await deleteRecord(AirtableTables.RECIPES, recipeId);
};

export const analyzeRecipeNutrition = async (payload: { ingredients: Array<{ name: string; quantity: number; unit: string }>; serving: number; recipeTitle: string }): Promise<NutritionData> => {
  const { ingredients, serving, recipeTitle } = payload;
  const ingredientList = ingredients.map(ing => `${ing.name}: ${ing.quantity} ${ing.unit}`).join(', ');
  const prompt = `Tu es un nutritionniste expert français. Analyse la valeur nutritionnelle de cette recette avec PRÉCISION.

    INGRÉDIENTS : ${ingredientList}
    PORTIONS : ${serving} personne(s)
    RECETTE : ${recipeTitle || 'Recette'}

    RÈGLES STRICTES D'ANALYSE :
    1. Calcule les valeurs nutritionnelles pour ${serving} portion(s) EXACTEMENT
    2. Utilise UNIQUEMENT des données nutritionnelles standardisées et vérifiées
    3. Inclus TOUTES les vitamines et minéraux présents (même si 0)
    4. Donne des notes nutritionnelles précises et factuelles en français
    5. Adapte les quantités proportionnellement au nombre de portions

    DONNÉES NUTRITIONNELLES DE RÉFÉRENCE (pour 100g) :
    - Pomme : 52 kcal, 0.3g protéines, 14g glucides, 0.2g lipides, 2.4g fibres
    - Banane : 89 kcal, 1.1g protéines, 23g glucides, 0.3g lipides, 2.6g fibres
    - Poulet (blanc) : 165 kcal, 31g protéines, 0g glucides, 3.6g lipides
    - Riz cuit : 130 kcal, 2.7g protéines, 28g glucides, 0.3g lipides
    - Tomate : 18 kcal, 0.9g protéines, 3.9g glucides, 0.2g lipides, 1.2g fibres
    - Fromage (type emmental) : 402 kcal, 28g protéines, 1.3g glucides, 32g lipides
    - Carotte : 41 kcal, 0.9g protéines, 10g glucides, 0.2g lipides, 2.8g fibres
    - Citron : 29 kcal, 1.1g protéines, 9g glucides, 0.3g lipides, 2.8g fibres
    - Persil : 36 kcal, 3g protéines, 6g glucides, 0.8g lipides, 3.3g fibres
    - Chocolat noir : 546 kcal, 4.9g protéines, 61g glucides, 31g lipides

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

    Réponds UNIQUEMENT en JSON valide, sans texte supplémentaire.`;

  const { object } = await generateObject({
    model: mistral('mistral-medium-latest'),
    system: prompt,
    schema: z.object({
      calories: z.number().min(0).max(5000),
      protein: z.number().min(0).max(200),
      carbs: z.number().min(0).max(500),
      fat: z.number().min(0).max(200),
      fiber: z.number().min(0).max(100),
      sugar: z.number().min(0).max(200),
      sodium: z.number().min(0).max(5000),
      vitamins: z.object({
        A: z.number().min(0).max(10000).optional(),
        C: z.number().min(0).max(1000).optional(),
        D: z.number().min(0).max(100).optional(),
        E: z.number().min(0).max(100).optional(),
        K: z.number().min(0).max(1000).optional(),
        B1: z.number().min(0).max(10).optional(),
        B2: z.number().min(0).max(10).optional(),
        B3: z.number().min(0).max(100).optional(),
        B6: z.number().min(0).max(10).optional(),
        B12: z.number().min(0).max(100).optional(),
        folate: z.number().min(0).max(1000).optional(),
      }),
      minerals: z.object({
        calcium: z.number().min(0).max(2000).optional(),
        iron: z.number().min(0).max(100).optional(),
        magnesium: z.number().min(0).max(1000).optional(),
        phosphorus: z.number().min(0).max(2000).optional(),
        potassium: z.number().min(0).max(5000).optional(),
        zinc: z.number().min(0).max(50).optional(),
        copper: z.number().min(0).max(10).optional(),
        manganese: z.number().min(0).max(10).optional(),
        selenium: z.number().min(0).max(200).optional(),
      }),
      nutrition_notes: z.string().min(10).max(500),
    })
  });

  return object as NutritionData;
};
