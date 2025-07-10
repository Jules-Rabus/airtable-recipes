import { z } from 'zod';

export const recipeSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Le titre est requis").max(100, "Le titre ne peut pas dépasser 100 caractères"),
  description: z.string().max(500, "La description ne peut pas dépasser 500 caractères").optional(),
  ingredients: z.array(z.object({
    name: z.string().min(1, "Le nom de l'ingrédient est requis"),
    quantity: z.number().min(0.01, "La quantité doit être supérieure à 0"),
    unit: z.string().min(1, "L'unité est requise")
  })).min(1, "Au moins un ingrédient est requis"),
  steps: z.array(z.string().min(1, "Chaque étape doit contenir du texte")).min(1, "Au moins une étape est requise"),
  servings: z.number().min(1, "Le nombre de portions doit être supérieur à 0").default(1),
  preparationTime: z.number().min(0, "Le temps de préparation ne peut pas être négatif").default(0),
  cookingTime: z.number().min(0, "Le temps de cuisson ne peut pas être négatif").default(0),
});

export type RecipeType = z.infer<typeof recipeSchema>;