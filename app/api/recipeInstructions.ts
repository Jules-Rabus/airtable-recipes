'use server'

import { getRecords, createRecords } from '@/lib/axios'
import { AirtableTables } from '@/constants/airtable'
import { InstructionRecord } from '@/lib/types'

export const fetchRecipeInstructions = async (): Promise<InstructionRecord[]> => {
  const records = await getRecords(AirtableTables.RECIPE_INSTRUCTIONS)
  return records as InstructionRecord[]
}

export const addRecipeInstructions = async (records: Array<Record<string, unknown>>): Promise<void> => {
  if (records.length === 0) return
  await createRecords(AirtableTables.RECIPE_INSTRUCTIONS, records)
}
