'use server'

import { getRecords, createRecords } from '../axios'
import { AirtableTables } from '@/constants/airtable'
import { JoinRecord } from '../types'

export const fetchRecipeIngredientJoins = async (): Promise<JoinRecord[]> => {
  const records = await getRecords(AirtableTables.RECIPE_INGREDIENT)
  return records as JoinRecord[]
}

export const addRecipeIngredientJoins = async (records: Array<Record<string, unknown>>): Promise<void> => {
  if (records.length === 0) return
  await createRecords(AirtableTables.RECIPE_INGREDIENT, records)
}
