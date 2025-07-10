'use client';

import { useEffect, useState } from "react";
import { fetchIngredientOptions } from "@/lib/api";
import { IngredientOption } from "@/schemas/api";

export default function IngredientsPage() {
    const [ingredients, setIngredients] = useState<IngredientOption[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchIngredientOptions();
                setIngredients(data);
            } catch {}
        };

        load();
    }, []);

    return (
        <div>
            <h1>Ingredients</h1>
            <p>This page will display a list of ingredients.</p>

            <ul>
                {ingredients && ingredients.map((ingredient) => (
                    <li key={ingredient.value}>{ingredient.label}</li>
                ))}
            </ul>
        </div>
    );
}