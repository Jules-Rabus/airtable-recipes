import { z } from 'zod';

export const ingredientSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    recipes: z.array(z.string()).optional(),
    recipe_ingredient: z.array(z.string()).optional(),
});

export type Ingredient = z.infer<typeof ingredientSchema>;