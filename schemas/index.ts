import { z } from "zod";

export const airtableIngredientRecordSchema = z.object({
  id: z.string(),
  fields: z.object({ Name: z.string().optional() }).optional(),
});

export const ingredientOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});
export type IngredientOption = z.infer<typeof ingredientOptionSchema>;

export const airtableRecordSchema = z.object({
  id: z.string(),
  createdTime: z.string().optional(),
  fields: z.record(z.unknown()).optional(),
});
export type AirtableRecord = z.infer<typeof airtableRecordSchema>;

export const recipeRecordSchema = airtableRecordSchema.extend({
  fields: z
    .object({
      Title: z.string().optional(),
      Description: z.string().optional(),
      Serving: z.number().optional(),
      PrepTimeMinutes: z.number().optional(),
      CookTimeMinutes: z.number().optional(),
      Difficulty: z.string().optional(),
      Type: z.string().optional(),
    })
    .optional(),
});
export type RecipeRecord = z.infer<typeof recipeRecordSchema>;

export const ingredientRecordSchema = airtableRecordSchema.extend({
  fields: z.object({ Name: z.string().optional() }).optional(),
});
export type IngredientRecord = z.infer<typeof ingredientRecordSchema>;

export const joinRecordSchema = airtableRecordSchema.extend({
  fields: z
    .object({
      Recipes: z.array(z.string()).optional(),
      Ingredient: z.array(z.string()).optional(),
      Quantity: z.number().optional(),
      Unit: z.string().optional(),
      Identifier: z.number().optional(),
    })
    .optional(),
});
export type JoinRecord = z.infer<typeof joinRecordSchema>;

export const instructionRecordSchema = airtableRecordSchema.extend({
  fields: z
    .object({
      Recipes: z.array(z.string()).optional(),
      Instruction: z.string().optional(),
      Order: z.number().optional(),
    })
    .optional(),
});
export type InstructionRecord = z.infer<typeof instructionRecordSchema>;

export const nutritionDataSchema = z.object({
  calories: z.number().min(0).describe("Total calories in kcal"),
  protein: z.number().min(0).describe("Total protein in grams"),
  carbs: z.number().min(0).describe("Total carbohydrates in grams"),
  fat: z.number().min(0).describe("Total fat in grams"),
  fiber: z.number().min(0).describe("Total fiber in grams"),
  sugar: z.number().min(0).describe("Total sugar in grams"),
  sodium: z.number().min(0).describe("Total sodium in mg"),
  vitamins: z.object({
    A: z.number().min(0).describe("Vitamin A in mcg"),
    C: z.number().min(0).describe("Vitamin C in mg"),
    D: z.number().min(0).describe("Vitamin D in IU"),
    E: z.number().min(0).describe("Vitamin E in mg"),
    K: z.number().min(0).describe("Vitamin K in mcg"),
    B1: z.number().min(0).describe("Vitamin B1 in mg"),
    B2: z.number().min(0).describe("Vitamin B2 in mg"),
    B3: z.number().min(0).describe("Vitamin B3 in mg"),
    B6: z.number().min(0).describe("Vitamin B6 in mg"),
    B12: z.number().min(0).describe("Vitamin B12 in mcg"),
    folate: z.number().min(0).describe("Folate in mcg"),
  }),
  minerals: z.object({
    calcium: z.number().min(0).describe("Calcium in mg"),
    iron: z.number().min(0).describe("Iron in mg"),
    magnesium: z.number().min(0).describe("Magnesium in mg"),
    phosphorus: z.number().min(0).describe("Phosphorus in mg"),
    potassium: z.number().min(0).describe("Potassium in mg"),
    zinc: z.number().min(0).describe("Zinc in mg"),
    copper: z.number().min(0).describe("Copper in mg"),
    manganese: z.number().min(0).describe("Manganese in mg"),
    selenium: z.number().min(0).describe("Selenium in mcg"),
  }),
  nutrition_notes: z.string().min(10).max(500),
  nutrition_score: z.number().min(0).max(5),
});
export type NutritionData = z.infer<typeof nutritionDataSchema>;

export const recipeIngredientRecordSchema = airtableRecordSchema.extend({
  fields: z.object({
    Identifier: z.number(),
    Recipes: z.array(z.string()),
    Ingredient: z.array(z.string()),
    Quantity: z.number(),
    Unit: z.string(),
  }),
});
export type RecipeIngredientRecord = z.infer<
  typeof recipeIngredientRecordSchema
>;

export const recipeInstructionRecordSchema = airtableRecordSchema.extend({
  fields: z
    .object({
      Instruction: z.string(),
      Order: z.number(),
      Recipes: z.array(z.string()),
    })
    .optional(),
});
export type RecipeInstructionRecord = z.infer<
  typeof recipeInstructionRecordSchema
>;

export const recipeSchema = z.object({
  id: z.string().optional(),
  createdTime: z.string().optional(),
  title: z.string(),
  description: z.string(),
  serving: z.number(),
  preparationTime: z.number(),
  cookingTime: z.number(),
  difficulty: z.string(),
  type: z.string(),
  intolerances: z.array(z.string()).optional(),
  created_at: z.string().optional(),
  nutrition: nutritionDataSchema.optional(),
  fields: z
    .object({
      Title: z.string().optional(),
      Description: z.string().optional(),
      Serving: z.number().optional(),
      PreparationTime: z.number().optional(),
      CookingTime: z.number().optional(),
      Recipes_Ingredients: z.array(z.string()).optional(),
      Recipe_Instructions: z.array(z.string()).optional(),
      Difficulty: z.string().optional(),
      Type: z.string().optional(),
    })
    .optional(),
  ingredients: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number(),
        unit: z.string(),
      }),
    )
    .optional(),
  instructions: z
    .array(
      z.object({
        text: z.string(),
        order: z.number(),
      }),
    )
    .optional(),
});
export type RecipeType = z.infer<typeof recipeSchema>;
