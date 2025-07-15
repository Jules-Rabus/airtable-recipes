"use server";

import { z } from "zod";
import {
  airtableIngredientRecordSchema,
  ingredientOptionSchema,
  IngredientOption,
  ingredientSchema,
  Ingredient,
  createIngredientSchema,
  CreateIngredient,
  updateIngredientSchema,
  UpdateIngredient,
} from "@/schemas";
import {
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
} from "@/lib/axios";
import { AirtableTables } from "@/constants/airtable";
import { revalidatePath } from "next/cache";

export const getIngredientOptions = async (): Promise<IngredientOption[]> => {
  const records = await getRecords(AirtableTables.INGREDIENTS, {
    sort: [{ field: "Name", direction: "asc" }],
  });
  const parsed = z.array(airtableIngredientRecordSchema).parse(records);
  return parsed.map((r) =>
    ingredientOptionSchema.parse({
      label: r.fields?.Name ?? r.id,
      value: r.id,
    }),
  );
};

export const getIngredients = async (): Promise<Ingredient[]> => {
  const records = await getRecords(AirtableTables.INGREDIENTS, {
    sort: [{ field: "Name", direction: "asc" }],
  });
  const parsed = z.array(airtableIngredientRecordSchema).parse(records);
  return parsed.map((r) =>
    ingredientSchema.parse({
      id: r.id,
      name: r.fields?.Name ?? r.id,
    }),
  );
};

export const createIngredient = async (
  data: CreateIngredient,
): Promise<Ingredient> => {
  const validatedData = createIngredientSchema.parse(data);
  const record = await createRecord(AirtableTables.INGREDIENTS, {
    Name: validatedData.name,
  });
  const parsed = airtableIngredientRecordSchema.parse(record);

  revalidatePath("/ingredients");

  return ingredientSchema.parse({
    id: parsed.id,
    name: parsed.fields?.Name ?? parsed.id,
  });
};

export const updateIngredient = async (
  data: UpdateIngredient,
): Promise<Ingredient> => {
  const validatedData = updateIngredientSchema.parse(data);
  const record = await updateRecord(
    AirtableTables.INGREDIENTS,
    validatedData.id,
    { Name: validatedData.name },
  );
  const parsed = airtableIngredientRecordSchema.parse(record);

  revalidatePath("/ingredients");

  return ingredientSchema.parse({
    id: parsed.id,
    name: parsed.fields?.Name ?? parsed.id,
  });
};

export const deleteIngredient = async (
  id: string,
): Promise<{ success: boolean }> => {
  await deleteRecord(AirtableTables.INGREDIENTS, id);
  revalidatePath("/ingredients");
  return { success: true };
};
