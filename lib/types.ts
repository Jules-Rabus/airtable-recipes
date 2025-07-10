export interface AirtableRecord {
  id: string;
  createdTime?: string;
  fields?: Record<string, unknown>;
}

export interface IngredientRecord extends AirtableRecord {
  fields?: {
    Name?: string;
  };
}

export interface RecipeRecord extends AirtableRecord {
  fields?: {
    Title?: string;
    Description?: string;
    Serving?: number;
    PrepTimeMinutes?: number;
    CookTimeMinutes?: number;
  };
}

export interface JoinRecord extends AirtableRecord {
  fields?: {
    Recipe?: string[];
    Ingredient?: string[];
    Quantity?: number | string;
    Unit?: string;
    Identifier?: number;
  };
}

export interface InstructionRecord extends AirtableRecord {
  fields?: {
    Recipe?: string[];
    Instruction?: string;
    Order?: number;
  };
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  vitamins: {
    A?: number;
    C?: number;
    D?: number;
    E?: number;
    K?: number;
    B1?: number;
    B2?: number;
    B3?: number;
    B6?: number;
    B12?: number;
    folate?: number;
  };
  minerals: {
    calcium?: number;
    iron?: number;
    magnesium?: number;
    phosphorus?: number;
    potassium?: number;
    zinc?: number;
    copper?: number;
    manganese?: number;
    selenium?: number;
  };
  nutrition_notes?: string;
  nutrition_score?: number;
}

export interface RecipeIngredientRecord {
  id: string;
  createdTime: string;
  fields: {
    Identifier: number;
    Recipe: string[];
    Ingredient: string[];
    Quantity: number;
    Unit: string;
  };
  ingredientName?: string;
}

export interface RecipeInstructionRecord {
  id: string;
  createdTime: string;
  fields: {
    Instruction: string;
    Order: number;
    Recipe: string[];
  };
}

export interface Recipe {
  id: string;
  createdTime?: string;
  fields?: {
    Title?: string;
    Description?: string;
    Serving?: number;
    PreparationTime?: number;
    CookingTime?: number;
    Recipes_Ingredients?: string[];
    Recipe_Instructions?: string[];
  };
  recipe_ingredient_quantity_records?: RecipeIngredientRecord[];
  recipe_instruction_records?: RecipeInstructionRecord[];
  ingredients?: Array<{
    id: string;
    name: string;
    quantity?: number;
    unit?: string;
  }>;
  instructions?: Array<{
    text: string;
    order: number;
  }>;
  intolerances?: string[];
  serving?: number;
  preparationTime?: number;
  cookingTime?: number;
  created_at?: string;
  nutrition?: NutritionData;
}
