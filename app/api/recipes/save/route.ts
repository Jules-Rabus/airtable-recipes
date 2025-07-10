import { NextResponse } from 'next/server';
import { createRecord, createRecords } from '@/lib/axios';
import { AirtableTables } from '@/constants/airtable';
import { RecipeCard } from '@/schemas/api';

export async function POST(req: Request) {
  try {
    const { recipe }: { recipe: RecipeCard } = await req.json();
    
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe is required' }, { status: 400 });
    }
    const fields = {
      Title: recipe.title,
      Description: recipe.description,
      Servings: recipe.servings,
      PreparationTime: recipe.preparationTime,
      CookingTime: recipe.cookingTime,
    };
    const created = await createRecord(AirtableTables.RECIPES, fields);

    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
      const joinRecords = recipe.ingredients
        .filter(ing => ing.id)
        .map(ing => ({
          Recipe: [created.id],
          Ingredient: [ing.id as string],
          Quantity: ing.quantity,
          Unit: ing.unit,
        }));
      if (joinRecords.length > 0) {
        await createRecords(AirtableTables.RECIPE_INGREDIENT_QUANTITY, joinRecords);
      }
    }

    if (Array.isArray(recipe.instructions) && recipe.instructions.length > 0) {
      const instructionRecords = recipe.instructions.map(inst => ({
        Instruction: inst.text,
        Order: inst.order,
        Recipe: [created.id],
      }));
      await createRecords(AirtableTables.RECIPE_INSTRUCTIONS, instructionRecords);
    }
    return NextResponse.json(created);
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}