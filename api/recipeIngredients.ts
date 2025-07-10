'use server'

import { getRecords, createRecords, GetRecordsOptions } from '@/lib/axios'
import { AirtableTables } from '@/constants/airtable'
import { JoinRecord } from '@/lib/types'

export const fetchRecipeIngredientJoins = async (
  recipeId?: string
): Promise<JoinRecord[]> => {
  const options: GetRecordsOptions = {}
  if (recipeId) {
    options.filterByFormula = `{Recipes} = "${recipeId}"`
  }
  const records = await getRecords(AirtableTables.RECIPE_INGREDIENT, options)
  return records as JoinRecord[]
}

export const addRecipeIngredientJoins = async (records: Array<Record<string, unknown>>): Promise<void> => {
  if (records.length === 0) return
  await createRecords(AirtableTables.RECIPE_INGREDIENT, records)
}
