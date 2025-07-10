import { z } from 'zod';

export const recipeIngredient = z.object({
    id: z.string().optional(),
    recipeId: z.string().optional(),
    ingredientId: z.string().optional(),
    quantity: z.string(),
    unit: z.string()
});

export type RecipeIngredient = z.infer<typeof recipeIngredient>;