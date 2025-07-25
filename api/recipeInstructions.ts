"use server";

import { createRecords, getRecords, GetRecordsOptions } from "@/lib/axios";
import { AirtableTables } from "@/constants/airtable";
import { InstructionRecord } from "@/schemas";

export const fetchRecipeInstructions = async (
  recipeId?: string,
): Promise<InstructionRecord[]> => {
  const options: GetRecordsOptions = {};
  if (recipeId) {
    options.filterByFormula = `{Recipes} = "${recipeId}"`;
  }
  options.sort = [{ field: "Order", direction: "asc" }];

  const records = await getRecords(AirtableTables.RECIPE_INSTRUCTIONS, options);
  return records as InstructionRecord[];
};

export const addRecipeInstructions = async (
  records: Array<Record<string, unknown>>,
): Promise<void> => {
  if (records.length === 0) return;
  await createRecords(AirtableTables.RECIPE_INSTRUCTIONS, records);
};
