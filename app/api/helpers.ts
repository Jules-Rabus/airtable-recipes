import { airtableIngredientRecordSchema, ingredientOptionSchema, recipeCardSchema, RecipeCard, IngredientOption } from '@/schemas/api';
import { z } from 'zod';

export const fetchIngredientOptions = async (): Promise<IngredientOption[]> => {
  const res = await fetch('/api/ingredients');
  if (!res.ok) throw new Error('Failed to fetch ingredients');
  const data = await res.json();
  const records = z.array(airtableIngredientRecordSchema).parse(data);
  return records.map(r => ingredientOptionSchema.parse({ label: r.fields?.Name ?? r.id, value: r.id }));
};

export const generateRecipes = async (payload: { ingredients: { id: string; name: string }[]; intolerances: string[]; serving: number; genre?: string; }): Promise<RecipeCard[]> => {
  const res = await fetch('/api/recipes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to generate recipe');
  const data = await res.json();
  const parsed = z.object({ recipes: z.array(recipeCardSchema) }).parse(data);
  return parsed.recipes;
};

export const fetchRecipes = async (): Promise<RecipeCard[]> => {
  const res = await fetch('/api/recipes');
  if (!res.ok) throw new Error('Failed to fetch recipes');
  const data = await res.json();
  return z.array(recipeCardSchema).parse(data);
};
