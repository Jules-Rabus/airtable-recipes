'use server'

import {z} from 'zod'
import {RecipeCard, recipeCardSchema} from '@/schemas'
import {createRecord, deleteRecord, getRecord, getRecords} from '@/lib/axios'
import {AirtableTables} from '@/constants/airtable'
import {generateObject} from 'ai'
import {mistral} from '@ai-sdk/mistral'
import {
  IngredientRecord,
  NutritionData,
  Recipe,
  RecipeIngredientRecord,
  RecipeInstructionRecord,
  RecipeRecord
} from '@/lib/types'
import {addRecipeIngredientJoins, fetchRecipeIngredientJoins} from '@/api/recipeIngredients'
import {addRecipeInstructions, fetchRecipeInstructions} from "@/api/recipeInstructions";

export const generateRecipes = async (payload: { ingredients: { id: string; name: string }[]; intolerances: string[]; serving: number; genre?: string }): Promise<RecipeCard[]> => {
  const { ingredients, intolerances, serving = 1, genre } = payload
  const ingredientListJson = JSON.stringify(ingredients)
  const typeInfo = genre ? ` de type ${genre}` : ''
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
  `

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
    - Sans texte supplémentaire`

  const { object } = await generateObject({
    model: mistral('mistral-medium-latest'),
    system: systemPrompt,
    prompt,
    schema: z.object({ recipes: z.array(recipeCardSchema) })
  })
  return object.recipes as RecipeCard[]
}

export const getRecipes = async (): Promise<RecipeCard[]> => {
  const recipes = await getRecords(AirtableTables.RECIPES, { sort: [{ field: 'Title', direction: 'asc' }] })
  const joinRecords = await fetchRecipeIngredientJoins()
  const ingredientsTable = await getRecords(AirtableTables.INGREDIENTS)
  const ingredientMap = Object.fromEntries((ingredientsTable as IngredientRecord[]).map(ing => [ing.id, ing.fields?.Name || ing.id]))
  const instructionsTable = await fetchRecipeInstructions()
  return (recipes as RecipeRecord[]).map(recipe => {
    const recipeIngredients = joinRecords
        .filter(jr => Array.isArray(jr.fields?.Recipe) && jr.fields.Recipe.includes(recipe.id))
        .map(jr => {
          const quantityStr = jr.fields?.Quantity
          let quantity = 0
          let unit = ''
          if (typeof quantityStr === 'number') quantity = quantityStr
          else if (typeof quantityStr === 'string') {
            const match = quantityStr.match(/([\d.,]+)\s*(.*)/)
            if (match) {
              quantity = parseFloat(match[1].replace(',', '.'))
              unit = match[2].trim()
            }
          }
          const ingredientId = Array.isArray(jr.fields?.Ingredient) ? jr.fields.Ingredient[0] : jr.fields?.Ingredient
          return {id: ingredientId, name: ingredientId ? ingredientMap[ingredientId] || '' : '', quantity, unit}
        })
    const recipeInstructions = instructionsTable
        .filter(inst => Array.isArray(inst.fields?.Recipe) && inst.fields.Recipe.includes(recipe.id))
        .sort((a, b) => (a.fields?.Order || 0) - (b.fields?.Order || 0))
        .map(inst => ({text: inst.fields?.Instruction || '', order: inst.fields?.Order || 0}))
    return {...recipe, ingredients: recipeIngredients, instructions: recipeInstructions} as RecipeCard
  })
}

export const getRecipe = async (id: string): Promise<Recipe> => {
  const recipe = await getRecord(AirtableTables.RECIPES, id)
  const recipeIngredientJoins = await fetchRecipeIngredientJoins(id)
  const ingredientIds = recipeIngredientJoins
    .map(join => (Array.isArray(join.fields?.Ingredient) ? join.fields.Ingredient[0] : join.fields?.Ingredient))
    .filter((ing): ing is string => Boolean(ing))

  let ingredientMap: Record<string, string> = {}
  if (ingredientIds.length > 0) {
    const formula = `OR(${ingredientIds.map(i => `RECORD_ID()='${i}'`).join(',')})`
    const ingredientRecords = await getRecords(AirtableTables.INGREDIENTS, { filterByFormula: formula })
    ingredientMap = Object.fromEntries((ingredientRecords as IngredientRecord[]).map(ing => [ing.id, ing.fields?.Name || ing.id]))
  }

  const recipeIngredientJoinsWithNames = recipeIngredientJoins.map(join => {
    const ingredientId = Array.isArray(join.fields?.Ingredient) ? join.fields.Ingredient[0] : join.fields?.Ingredient
    const label = ingredientId ? ingredientMap[ingredientId] || `Ingrédient ${join.fields?.Identifier}` : `Ingrédient ${join.fields?.Identifier}`
    return { ...join, ingredientName: label }
  }) as RecipeIngredientRecord[]

  const recipeInstructionJoins = await fetchRecipeInstructions(id)

  return {
    id: (recipe as RecipeRecord).id,
    createdTime: (recipe as RecipeRecord).createdTime,
    fields: (recipe as RecipeRecord).fields,
    recipe_ingredient_quantity_records: recipeIngredientJoinsWithNames,
    recipe_instruction_records: recipeInstructionJoins as RecipeInstructionRecord[]
  }
}

export const saveRecipe = async (recipe: RecipeCard): Promise<void> => {
  const fields: Record<string, unknown> = {
    Title: recipe.title,
    Description: recipe.description,
    Serving: recipe.serving,
    PreparationTime: recipe.preparationTime,
    CookingTime: recipe.cookingTime
  }
  const savedRecipe = await createRecord(AirtableTables.RECIPES, fields)
  const allIngredients = await getRecords(AirtableTables.INGREDIENTS) as Array<{ id: string }>
  const validIds = new Set(allIngredients.map(ing => ing.id))
  const filtered = (recipe.ingredients || []).filter(ing => ing.id && validIds.has(ing.id))
  if (filtered.length > 0) {
    const joinRecords = filtered.map(ing => ({ Recipe: [savedRecipe.id], Ingredient: [ing.id as string], Quantity: ing.quantity, Unit: ing.unit }))
    await addRecipeIngredientJoins(joinRecords)
  }
  if (recipe.instructions && recipe.instructions.length > 0) {
    const instructionRecords = recipe.instructions.map(inst => ({ Instruction: inst.text, Order: inst.order, Recipes: [savedRecipe.id] }))
    await addRecipeInstructions(instructionRecords)
  }
}

export const deleteRecipe = async (recipeId: string): Promise<void> => {
  await deleteRecord(AirtableTables.RECIPES, recipeId)
}

export const analyzeRecipeNutrition = async (payload: { ingredients: Array<{ name: string; quantity: number; unit: string }>; serving: number; recipeTitle: string }): Promise<NutritionData> => {
  const { ingredients, serving, recipeTitle } = payload
  const ingredientList = ingredients.map(ing => `${ing.name}: ${ing.quantity} ${ing.unit}`).join(', ')
  const prompt = `Analyse la valeur nutritionnelle de cette recette avec PRÉCISION.

    INGRÉDIENTS : ${ingredientList}
    PORTIONS : ${serving} personne(s)
    RECETTE : ${recipeTitle || 'Recette'}

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

    Réponds UNIQUEMENT en JSON valide, sans texte supplémentaire.`

  const { object } = await generateObject({
    model: mistral('mistral-medium-latest'),
    prompt: prompt,
    system: systemPrompt,
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
        folate: z.number().min(0).max(1000).optional()
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
        selenium: z.number().min(0).max(200).optional()
      }),
      nutrition_notes: z.string().min(10).max(500),
      nutrition_score: z.number().min(0).max(5)
    })
  })

  return object as NutritionData
}
