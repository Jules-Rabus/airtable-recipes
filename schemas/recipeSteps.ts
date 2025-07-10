import { z } from 'zod';

export const recipeStep = z.object({
    id: z.string().optional(),
    name: z.string(),
    recipes: z.array(z.string()).optional(),
    order: z.number()
});

export const recipeStepsSchema = z.array(recipeStep);
