"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FaHeartbeat, FaBolt, FaAppleAlt, FaPills } from "react-icons/fa";
import { IoWater } from "react-icons/io5";
import { NutritionData } from "@/schemas";

interface NutritionCardProps {
  nutrition: NutritionData;
  serving: number;
  noCard?: boolean;
}

export function NutritionCard({
  nutrition,
  serving,
  noCard = false,
}: NutritionCardProps) {
  const formatValue = (value: number | undefined, unit: string) => {
    if (value === undefined || value === null) return "N/A";
    return `${value.toFixed(1)} ${unit}`;
  };

  const getVitaminName = (key: string) => {
    const names: Record<string, string> = {
      A: "Vitamine A",
      C: "Vitamine C",
      D: "Vitamine D",
      E: "Vitamine E",
      K: "Vitamine K",
      B1: "Vitamine B1",
      B2: "Vitamine B2",
      B3: "Vitamine B3",
      B6: "Vitamine B6",
      B12: "Vitamine B12",
      folate: "Folate",
    };
    return names[key] || key;
  };

  const getMineralName = (key: string) => {
    const names: Record<string, string> = {
      calcium: "Calcium",
      iron: "Fer",
      magnesium: "Magnésium",
      phosphorus: "Phosphore",
      potassium: "Potassium",
      zinc: "Zinc",
      copper: "Cuivre",
      manganese: "Manganèse",
      selenium: "Sélénium",
    };
    return names[key] || key;
  };

  const getVitaminUnit = (key: string) => {
    const units: Record<string, string> = {
      A: "µg",
      C: "mg",
      D: "µg",
      E: "mg",
      K: "µg",
      B1: "mg",
      B2: "mg",
      B3: "mg",
      B6: "mg",
      B12: "µg",
      folate: "µg",
    };
    return units[key] || "";
  };

  const getMineralUnit = (key: string) => {
    const units: Record<string, string> = {
      calcium: "mg",
      iron: "mg",
      magnesium: "mg",
      phosphorus: "mg",
      potassium: "mg",
      zinc: "mg",
      copper: "mg",
      manganese: "mg",
      selenium: "µg",
    };
    return units[key] || "";
  };

  return (
    <>
      {noCard ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-lg sm:text-xl font-bold flex items-center justify-center gap-2">
              <FaHeartbeat className="w-4 h-4 sm:w-5 sm:h-5" />
              Analyse Nutritionnelle
            </h2>
            <p className="text-xs text-muted-foreground">
              Valeurs nutritionnelles pour {serving} portion
              {serving > 1 ? "s" : ""}
            </p>
            {nutrition.nutrition_score !== undefined && (
              <p className="text-sm font-medium text-primary">
                Note nutritionnelle : {nutrition.nutrition_score.toFixed(1)} / 5
              </p>
            )}
          </div>

          {/* Calories principales */}
          <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {nutrition.calories} kcal
            </div>
            <div className="text-xs text-muted-foreground">
              Calories totales
            </div>
          </div>

          {/* Macronutriments */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <FaBolt className="w-3 h-3 sm:w-4 sm:h-4" />
              Macronutriments
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center p-2 sm:p-3 bg-red-50 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-red-600">
                  {formatValue(nutrition.protein, "g")}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Protéines
                </div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-yellow-600">
                  {formatValue(nutrition.carbs, "g")}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Glucides
                </div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-green-600">
                  {formatValue(nutrition.fat, "g")}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Lipides
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Micronutriments */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <FaAppleAlt className="w-3 h-3 sm:w-4 sm:h-4" />
              Micronutriments
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="text-center p-2 bg-orange-50 rounded">
                <div className="text-xs sm:text-sm font-semibold text-orange-600">
                  {formatValue(nutrition.fiber, "g")}
                </div>
                <div className="text-xs text-muted-foreground">Fibres</div>
              </div>
              <div className="text-center p-2 bg-pink-50 rounded">
                <div className="text-xs sm:text-sm font-semibold text-pink-600">
                  {formatValue(nutrition.sugar, "g")}
                </div>
                <div className="text-xs text-muted-foreground">Sucres</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-xs sm:text-sm font-semibold text-blue-600">
                  {formatValue(nutrition.sodium, "mg")}
                </div>
                <div className="text-xs text-muted-foreground">Sodium</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Vitamines */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <FaPills className="w-3 h-3 sm:w-4 sm:h-4" />
              Vitamines
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {nutrition.vitamins &&
                Object.entries(nutrition.vitamins).map(
                  ([key, value]) =>
                    value !== undefined &&
                    value !== null && (
                      <div
                        key={key}
                        className="text-center p-2 bg-purple-50 rounded"
                      >
                        <div className="text-xs sm:text-sm font-semibold text-purple-600">
                          {formatValue(value, getVitaminUnit(key))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getVitaminName(key)}
                        </div>
                      </div>
                    ),
                )}
            </div>
          </div>

          <Separator />

          {/* Minéraux */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <IoWater className="w-3 h-3 sm:w-4 sm:h-4" />
              Minéraux
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {nutrition.minerals &&
                Object.entries(nutrition.minerals).map(
                  ([key, value]) =>
                    value !== undefined &&
                    value !== null && (
                      <div
                        key={key}
                        className="text-center p-2 bg-teal-50 rounded"
                      >
                        <div className="text-xs sm:text-sm font-semibold text-teal-600">
                          {formatValue(value, getMineralUnit(key))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getMineralName(key)}
                        </div>
                      </div>
                    ),
                )}
            </div>
          </div>

          {/* Notes nutritionnelles */}
          {nutrition.nutrition_notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-semibold">
                  Notes nutritionnelles
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {nutrition.nutrition_notes}
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        <Card className="modern-card hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FaHeartbeat className="w-4 h-4 sm:w-5 sm:h-5" />
              Analyse Nutritionnelle
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Valeurs nutritionnelles pour {serving} portion
              {serving > 1 ? "s" : ""}
            </CardDescription>
            {nutrition.nutrition_score !== undefined && (
              <CardDescription className="text-sm">
                Note nutritionnelle : {nutrition.nutrition_score.toFixed(1)} / 5
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Calories principales */}
            <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {nutrition.calories} kcal
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Calories totales
              </div>
            </div>

            {/* Macronutriments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FaBolt className="w-4 h-4" />
                Macronutriments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-600">
                    {formatValue(nutrition.protein, "g")}
                  </div>
                  <div className="text-sm text-muted-foreground">Protéines</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-xl font-bold text-yellow-600">
                    {formatValue(nutrition.carbs, "g")}
                  </div>
                  <div className="text-sm text-muted-foreground">Glucides</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {formatValue(nutrition.fat, "g")}
                  </div>
                  <div className="text-sm text-muted-foreground">Lipides</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Micronutriments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FaAppleAlt className="w-4 h-4" />
                Micronutriments
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-2 bg-orange-50 rounded">
                  <div className="text-sm font-semibold text-orange-600">
                    {formatValue(nutrition.fiber, "g")}
                  </div>
                  <div className="text-xs text-muted-foreground">Fibres</div>
                </div>
                <div className="text-center p-2 bg-pink-50 rounded">
                  <div className="text-sm font-semibold text-pink-600">
                    {formatValue(nutrition.sugar, "g")}
                  </div>
                  <div className="text-xs text-muted-foreground">Sucres</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="text-sm font-semibold text-blue-600">
                    {formatValue(nutrition.sodium, "mg")}
                  </div>
                  <div className="text-xs text-muted-foreground">Sodium</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Vitamines */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FaPills className="w-4 h-4" />
                Vitamines
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {nutrition.vitamins &&
                  Object.entries(nutrition.vitamins).map(
                    ([key, value]) =>
                      value !== undefined &&
                      value !== null && (
                        <div
                          key={key}
                          className="text-center p-2 bg-purple-50 rounded"
                        >
                          <div className="text-sm font-semibold text-purple-600">
                            {formatValue(value, getVitaminUnit(key))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getVitaminName(key)}
                          </div>
                        </div>
                      ),
                  )}
              </div>
            </div>

            <Separator />

            {/* Minéraux */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <IoWater className="w-4 h-4" />
                Minéraux
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {nutrition.minerals &&
                  Object.entries(nutrition.minerals).map(
                    ([key, value]) =>
                      value !== undefined &&
                      value !== null && (
                        <div
                          key={key}
                          className="text-center p-2 bg-teal-50 rounded"
                        >
                          <div className="text-sm font-semibold text-teal-600">
                            {formatValue(value, getMineralUnit(key))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getMineralName(key)}
                          </div>
                        </div>
                      ),
                  )}
              </div>
            </div>

            {/* Notes nutritionnelles */}
            {nutrition.nutrition_notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    Notes nutritionnelles
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {nutrition.nutrition_notes}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
