"use server";

import { z } from "zod";
import {
  airtableIngredientRecordSchema,
  ingredientOptionSchema,
  IngredientOption,
} from "@/schemas";
import { getRecords, createRecord } from "@/lib/axios";
import { AirtableTables } from "@/constants/airtable";

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

export const createIngredient = async (
  name: string,
): Promise<IngredientOption> => {
  const record = await createRecord(AirtableTables.INGREDIENTS, { Name: name });
  const parsed = airtableIngredientRecordSchema.parse(record);
  return ingredientOptionSchema.parse({
    label: parsed.fields?.Name ?? parsed.id,
    value: parsed.id,
  });
};
