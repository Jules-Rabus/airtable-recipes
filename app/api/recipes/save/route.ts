import { z } from 'zod';
import { NextResponse } from 'next/server';
import { getRecords, createRecord, createRecords } from '@/lib/axios';
import { AirtableTables } from '@/constants/airtable';
import { recipeCardSchema } from '@/schemas/api';

export async function POST(req: Request) {
  try {
    // Validate and extract recipe from request
    const { recipe } = z.object({ recipe: recipeCardSchema }).parse(await req.json());
    // Map recipe fields to Airtable
    const fields = {
      Title: recipe.title,
      Description: recipe.description,
      Serving: recipe.serving,
      PreparationTime: recipe.preparationTime,
      CookingTime: recipe.cookingTime,
    };
    const savedRecipe = await createRecord(AirtableTables.RECIPES, fields);

    // Filter and save valid ingredients
    const allIngredients = await getRecords(AirtableTables.INGREDIENTS) as { id: string }[];
    const validIngredientIds = new Set(allIngredients.map(ing => ing.id));
    const filteredIngredients = (recipe.ingredients || []).filter(ing => ing.id && validIngredientIds.has(ing.id));
    if (filteredIngredients.length > 0) {
      const joinRecords = filteredIngredients.map(ing => ({
        Recipe: [savedRecipe.id],
        Ingredient: [ing.id as string],
        Quantity: ing.quantity,
        Unit: ing.unit,
      }));
      if (joinRecords.length !== (recipe.ingredients?.length || 0)) {
        console.warn('Some ingredients are missing an id and will not be saved.');
      }
      try {
        await createRecords(AirtableTables.RECIPE_INGREDIENT, joinRecords);
      } catch (err) {
        console.error('Error creating join records:', err, joinRecords);
        return NextResponse.json({ error: 'Failed to save recipe ingredients' }, { status: 500 });
      }
    }

    // Save instructions
    if (recipe.instructions && recipe.instructions.length > 0) {
      const instructionRecords = recipe.instructions.map(inst => ({
        Instruction: inst.text,
        Order: inst.order,
        Recipes: [savedRecipe.id],
      }))
      await createRecords(AirtableTables.RECIPE_INSTRUCTIONS, instructionRecords);
    }
    return NextResponse.json(savedRecipe);
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}