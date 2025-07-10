import { z } from 'zod';

export const airtableIngredientRecordSchema = z.object({
  id: z.string(),
  fields: z.object({ Name: z.string().optional() }).optional(),
});

export const ingredientOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});
export type IngredientOption = z.infer<typeof ingredientOptionSchema>;

const recipeIngredientSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
});

const instructionSchema = z.object({
  text: z.string(),
  order: z.number(),
});

export const recipeCardSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  ingredients: z.array(recipeIngredientSchema).optional(),
  instructions: z.array(instructionSchema).optional(),
  serving: z.number().optional(),
  preparationTime: z.number().optional(),
  cookingTime: z.number().optional(),
  difficulty: z.string().optional(),
  cuisine: z.string().optional(),
  fields: z.object({
    Title: z.string().optional(),
    Description: z.string().optional(),
    Serving: z.number().optional(),
    PreparationTime: z.number().optional(),
    CookingTime: z.number().optional(),
  }).optional(),
});
export type RecipeCard = z.infer<typeof recipeCardSchema>;
