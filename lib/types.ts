import { z } from 'zod'

export const airtableRecordSchema = z.object({
  id: z.string(),
  createdTime: z.string().optional(),
  fields: z.record(z.unknown()).optional()
})
export type AirtableRecord = z.infer<typeof airtableRecordSchema>

export const recipeRecordSchema = airtableRecordSchema.extend({
  fields: z
    .object({
      Title: z.string().optional(),
      Description: z.string().optional(),
      Serving: z.number().optional(),
      PrepTimeMinutes: z.number().optional(),
      CookTimeMinutes: z.number().optional(),
      Difficulty: z.string().optional(),
      Cuisine: z.string().optional()
    })
    .optional()
})
export type RecipeRecord = z.infer<typeof recipeRecordSchema>

export const ingredientRecordSchema = airtableRecordSchema.extend({
  fields: z.object({ Name: z.string().optional() }).optional()
})
export type IngredientRecord = z.infer<typeof ingredientRecordSchema>

export const joinRecordSchema = airtableRecordSchema.extend({
  fields: z
    .object({
      Recipes: z.array(z.string()).optional(),
      Ingredient: z.array(z.string()).optional(),
      Quantity: z.union([z.number(), z.string()]).optional(),
      Unit: z.string().optional(),
      Identifier: z.number().optional()
    })
    .optional()
})
export type JoinRecord = z.infer<typeof joinRecordSchema>

export const instructionRecordSchema = airtableRecordSchema.extend({
  fields: z
    .object({
      Recipes: z.array(z.string()).optional(),
      Instruction: z.string().optional(),
      Order: z.number().optional()
    })
    .optional()
})
export type InstructionRecord = z.infer<typeof instructionRecordSchema>

export const nutritionDataSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number(),
  sugar: z.number(),
  sodium: z.number(),
  vitamins: z.object({
    A: z.number().optional(),
    C: z.number().optional(),
    D: z.number().optional(),
    E: z.number().optional(),
    K: z.number().optional(),
    B1: z.number().optional(),
    B2: z.number().optional(),
    B3: z.number().optional(),
    B6: z.number().optional(),
    B12: z.number().optional(),
    folate: z.number().optional()
  }),
  minerals: z.object({
    calcium: z.number().optional(),
    iron: z.number().optional(),
    magnesium: z.number().optional(),
    phosphorus: z.number().optional(),
    potassium: z.number().optional(),
    zinc: z.number().optional(),
    copper: z.number().optional(),
    manganese: z.number().optional(),
    selenium: z.number().optional()
  }),
  nutrition_notes: z.string().optional(),
  nutrition_score: z.number().optional()
})
export type NutritionData = z.infer<typeof nutritionDataSchema>

export const recipeIngredientRecordSchema = airtableRecordSchema.extend({
  fields: z
    .object({
      Identifier: z.number(),
      Recipes: z.array(z.string()),
      Ingredient: z.array(z.string()),
      Quantity: z.number(),
      Unit: z.string()
    })
    .optional(),
  ingredientName: z.string().optional()
})
export type RecipeIngredientRecord = z.infer<typeof recipeIngredientRecordSchema>

export const recipeInstructionRecordSchema = airtableRecordSchema.extend({
  fields: z
    .object({
      Instruction: z.string(),
      Order: z.number(),
      Recipes: z.array(z.string())
    })
    .optional()
})
export type RecipeInstructionRecord = z.infer<typeof recipeInstructionRecordSchema>

export const recipeSchema = z.object({
  id: z.string(),
  createdTime: z.string().optional(),
  fields: z
    .object({
      Title: z.string().optional(),
      Description: z.string().optional(),
      Serving: z.number().optional(),
      PreparationTime: z.number().optional(),
      CookingTime: z.number().optional(),
      Recipes_Ingredients: z.array(z.string()).optional(),
      Recipe_Instructions: z.array(z.string()).optional()
    })
    .optional(),
  recipe_ingredient_quantity_records: z.array(recipeIngredientRecordSchema).optional(),
  recipe_instruction_records: z.array(recipeInstructionRecordSchema).optional(),
  ingredients: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number().optional(),
        unit: z.string().optional()
      })
    )
    .optional(),
  instructions: z
    .array(
      z.object({
        text: z.string(),
        order: z.number()
      })
    )
    .optional(),
  intolerances: z.array(z.string()).optional(),
  serving: z.number().optional(),
  preparationTime: z.number().optional(),
  cookingTime: z.number().optional(),
  created_at: z.string().optional(),
  nutrition: nutritionDataSchema.optional()
})
export type Recipe = z.infer<typeof recipeSchema>
