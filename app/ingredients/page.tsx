"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "../components/Navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "@/api/ingredients";
import { Ingredient, createIngredientSchema } from "@/schemas";
import { FaCarrot, FaPlus, FaPencilAlt, FaTrash } from "react-icons/fa";

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
    null,
  );
  const [ingredientName, setIngredientName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const data = await getIngredients();
      setIngredients(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to load ingredients");
      toast.error(
        "Zut ! Impossible de récupérer les ingrédients du garde-manger.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  useEffect(() => {
    if (editingIngredient) {
      setIngredientName(editingIngredient.name);
    } else {
      setIngredientName("");
    }
    setFormError(null);
  }, [editingIngredient, isDialogOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const validationResult = createIngredientSchema.safeParse({
      name: ingredientName,
    });

    if (!validationResult.success) {
      setFormError(validationResult.error.errors[0].message);
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingIngredient) {
        await updateIngredient({
          id: editingIngredient.id,
          name: ingredientName,
        });
        toast.success(
          "Parfaitement assaisonné ! L\'ingrédient a été mis à jour.",
        );
      } else {
        await createIngredient({ name: ingredientName });
        toast.success(
          "Quel délice ! L\'ingrédient a été ajouté avec une pincée de succès.",
        );
      }
      setIsDialogOpen(false);
      setEditingIngredient(null);
      loadIngredients(); // Re-fetch ingredients
    } catch (err) {
      const error = err as Error;
      toast.error(
        `Zut ! Un pépin dans la recette. L\'opération a échoué: ${error.message}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir retirer cet ingrédient du plan de travail ?",
      )
    ) {
      try {
        await deleteIngredient(id);
        toast.success(
          "Et voilà ! L\'ingrédient a été retiré du plan de travail.",
        );
        loadIngredients(); // Re-fetch ingredients
      } catch (err) {
        const error = err as Error;
        toast.error(
          `Oups, impossible de retirer cet ingrédient. Il doit être collé ! Raison: ${error.message}`,
        );
      }
    }
  };

  const filteredIngredients = ingredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openEditDialog = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingIngredient(null);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="container-modern section-padding">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="heading-lg gradient-text">
              Inventaire des Ingrédients
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="container-modern section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <main className="container-modern section-padding">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="heading-lg gradient-text flex items-center gap-2 sm:gap-3">
              <FaCarrot className="w-8 h-8 text-primary" />
              <span>Inventaire des Ingrédients</span>
            </h1>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                placeholder="Rechercher un ingrédient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              <Button onClick={openNewDialog}>
                <FaPlus className="mr-2" />
                Ajouter
              </Button>
            </div>
          </div>

          {filteredIngredients.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredIngredients.map((ingredient) => (
                <Card
                  key={ingredient.id}
                  className="modern-card hover-lift flex flex-col justify-between"
                >
                  <CardHeader>
                    <CardTitle className="text-base font-medium text-center">
                      {ingredient.name}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(ingredient)}
                    >
                      <FaPencilAlt />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(ingredient.id)}
                    >
                      <FaTrash />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                La liste d&apos;ingrédients est vide pour le moment.
              </p>
            </div>
          )}
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIngredient ? "Modifier" : "Ajouter"} un ingrédient
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de l&apos;ingrédient</Label>
              <Input
                id="name"
                value={ingredientName}
                onChange={(e) => setIngredientName(e.target.value)}
              />
              {formError && (
                <p className="text-red-500 text-sm mt-1">{formError}</p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Annuler
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
