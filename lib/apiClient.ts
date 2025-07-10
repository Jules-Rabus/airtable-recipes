import axios from 'axios';
import { z } from 'zod';
import { airtableIngredientRecordSchema, ingredientOptionSchema, recipeCardSchema, RecipeCard, IngredientOption } from '@/schemas/api';
import { Recipe, NutritionData } from './types';

const client = axios.create({ baseURL: '/api' });

export const getIngredientOptions = async (): Promise<IngredientOption[]> => {
  const res = await client.get('/ingredients');
  const records = z.array(airtableIngredientRecordSchema).parse(res.data);
  return records.map(r => ingredientOptionSchema.parse({ label: r.fields?.Name ?? r.id, value: r.id }));
};

export const createIngredient = async (name: string): Promise<IngredientOption> => {
  const res = await client.post('/ingredients', { name });
  const record = airtableIngredientRecordSchema.parse(res.data);
  return ingredientOptionSchema.parse({ label: record.fields?.Name ?? record.id, value: record.id });
};

export const generateRecipes = async (payload: { ingredients: { id: string; name: string }[]; intolerances: string[]; serving: number; genre?: string; }): Promise<RecipeCard[]> => {
  const res = await client.post('/recipes', payload);
  const parsed = z.object({ recipes: z.array(recipeCardSchema) }).parse(res.data);
  return parsed.recipes;
};

export const getRecipes = async (): Promise<RecipeCard[]> => {
  const res = await client.get('/recipes');
  return z.array(recipeCardSchema).parse(res.data);
};

export const getRecipe = async (id: string): Promise<Recipe> => {
  const res = await client.get(`/recipes/${id}`);
  return res.data as Recipe;
};

export const saveRecipe = async (recipe: RecipeCard): Promise<void> => {
  await client.post('/recipes/save', { recipe });
};

export const deleteRecipe = async (recipeId: string): Promise<void> => {
  await client.delete('/recipes/delete', { data: { recipeId } });
};

export const analyzeRecipeNutrition = async (payload: { ingredients: Array<{ name: string; quantity: number; unit: string }>; serving: number; recipeTitle: string }): Promise<NutritionData> => {
  const res = await client.post('/recipes/analyze-nutrition', payload);
  return res.data as NutritionData;
};
