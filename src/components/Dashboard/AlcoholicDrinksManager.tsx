import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface AlcoholicDrink {
  id: string;
  drink_name: string;
  furnizime: number;
  shitje: number;
  gjendje: number;
  sort_order: number;
  updated_at: string;
}

export const AlcoholicDrinksManager = () => {
  const [drinks, setDrinks] = useState<AlcoholicDrink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newDrinkName, setNewDrinkName] = useState("");

  useEffect(() => {
    loadDrinks();
  }, []);

  const loadDrinks = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('alcoholic_drinks_inventory')
        .select('id, drink_name, furnizime, shitje, gjendje, sort_order, updated_at')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setDrinks(data || []);
    } catch (error) {
      console.error('Error loading drinks:', error);
      toast.error('Gabim në ngarkimin e pijeve');
    } finally {
      setIsLoading(false);
    }
  };

  const addDrink = async () => {
    if (!newDrinkName.trim()) {
      toast.error('Vendos emrin e pijës');
      return;
    }

    try {
      const maxSortOrder = Math.max(...drinks.map(d => d.sort_order), 0);
      const { error } = await supabase
        .from('alcoholic_drinks_inventory')
        .insert({
          drink_name: newDrinkName.trim(),
          furnizime: 0,
          shitje: 0,
          gjendje: 0,
          sort_order: maxSortOrder + 1
        });

      if (error) throw error;
      
      toast.success('Pija u shtua');
      setNewDrinkName("");
      loadDrinks();
    } catch (error) {
      console.error('Error adding drink:', error);
      toast.error('Gabim në shtimin e pijës');
    }
  };

  const updateDrink = async (id: string, field: 'furnizime' | 'shitje', value: number) => {
    try {
      const drink = drinks.find(d => d.id === id);
      if (!drink) return;

      const updates: any = { [field]: value };
      
      // Llogarit gjendjen: Furnizime - Shitje
      if (field === 'furnizime') {
        updates.gjendje = value - drink.shitje;
      } else if (field === 'shitje') {
        updates.gjendje = drink.furnizime - value;
      }

      const { error } = await supabase
        .from('alcoholic_drinks_inventory')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      loadDrinks();
      toast.success('U përditësua');
    } catch (error) {
      console.error('Error updating drink:', error);
      toast.error('Gabim në përditësim');
    }
  };

  const deleteDrink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alcoholic_drinks_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Pija u fshi');
      loadDrinks();
    } catch (error) {
      console.error('Error deleting drink:', error);
      toast.error('Gabim në fshirje');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pijet Alkoolike</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Duke ngarkuar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pijet Alkoolike - Inventar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tabela */}
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Pija</th>
                  <th className="p-3 text-left font-medium">Furnizim</th>
                  <th className="p-3 text-left font-medium">Shitje</th>
                  <th className="p-3 text-left font-medium">Gjendje</th>
                  <th className="p-3 text-left font-medium">Përditësuar</th>
                  <th className="p-3 text-left font-medium">Veprime</th>
                </tr>
              </thead>
              <tbody>
                {drinks.map((drink) => (
                  <tr key={drink.id} className="border-b">
                    <td className="p-3 font-medium">{drink.drink_name}</td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={drink.furnizime}
                        onChange={(e) => updateDrink(drink.id, 'furnizime', parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={drink.shitje}
                        onChange={(e) => updateDrink(drink.id, 'shitje', parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                    </td>
                    <td className="p-3">
                      <span className={`font-medium ${drink.gjendje < 0 ? 'text-destructive' : 'text-success'}`}>
                        {drink.gjendje}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {format(new Date(drink.updated_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteDrink(drink.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Shto pije te re */}
          <div className="flex gap-2">
            <Input
              placeholder="Emri i pijës së re..."
              value={newDrinkName}
              onChange={(e) => setNewDrinkName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDrink()}
            />
            <Button onClick={addDrink}>
              <Plus className="h-4 w-4 mr-2" />
              Shto Pije
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
