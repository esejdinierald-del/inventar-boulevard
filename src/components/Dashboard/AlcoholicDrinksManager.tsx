import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { AdminRowControls } from "./AdminRowControls";

interface AlcoholicDrink {
  id: string;
  drink_name: string;
  furnizime: number;
  shitje: number;
  gjendje: number;
  sort_order: number;
  track_daily: boolean;
  updated_at: string;
  purchase_price: number;
}

interface DrinkRowProps {
  drink: AlcoholicDrink;
  idx: number;
  total: number;
  prevRow?: { id: string; sort_order: number };
  nextRow?: { id: string; sort_order: number };
  onUpdate: (id: string, field: 'furnizime' | 'shitje' | 'gjendje' | 'purchase_price', value: number) => void;
  onDelete: (id: string) => void;
  onReload: () => void | Promise<void>;
}

const DrinkRow = ({ drink, idx, total, prevRow, nextRow, onUpdate, onDelete, onReload }: DrinkRowProps) => {
  const [values, setValues] = useState({
    furnizime: String(drink.furnizime),
    shitje: String(drink.shitje),
    gjendje: String(drink.gjendje),
    purchase_price: String(drink.purchase_price || 0)
  });

  useEffect(() => {
    setValues({
      furnizime: String(drink.furnizime),
      shitje: String(drink.shitje),
      gjendje: String(drink.gjendje),
      purchase_price: String(drink.purchase_price || 0)
    });
  }, [drink.furnizime, drink.shitje, drink.gjendje, drink.purchase_price]);

  const handleChange = (field: 'furnizime' | 'shitje' | 'gjendje' | 'purchase_price', value: string) => {
    // Allow numbers with decimal (both . and ,)
    if (value === '' || /^-?\d*[.,]?\d*$/.test(value)) {
      setValues(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleBlur = (field: 'furnizime' | 'shitje' | 'gjendje' | 'purchase_price') => {
    // Convert comma to dot for parsing
    const normalizedValue = values[field].replace(',', '.');
    const numValue = parseFloat(normalizedValue) || 0;
    if (numValue !== drink[field]) {
      onUpdate(drink.id, field, numValue);
    }
  };

  return (
    <tr className="border-b">
      <td className="p-3 font-medium">{drink.drink_name}</td>
      <td className="p-3">
        <Input
          type="text"
          inputMode="numeric"
          value={values.purchase_price}
          onChange={(e) => handleChange('purchase_price', e.target.value)}
          onBlur={() => handleBlur('purchase_price')}
          className="w-24"
        />
      </td>
      <td className="p-3">
        <Input
          type="text"
          inputMode="numeric"
          value={values.furnizime}
          onChange={(e) => handleChange('furnizime', e.target.value)}
          onBlur={() => handleBlur('furnizime')}
          className="w-24"
        />
      </td>
      <td className="p-3">
        <Input
          type="text"
          inputMode="numeric"
          value={values.shitje}
          onChange={(e) => handleChange('shitje', e.target.value)}
          onBlur={() => handleBlur('shitje')}
          className="w-24"
        />
      </td>
      <td className="p-3">
        <Input
          type="text"
          inputMode="numeric"
          value={values.gjendje}
          onChange={(e) => handleChange('gjendje', e.target.value)}
          onBlur={() => handleBlur('gjendje')}
          className={`w-24 ${parseInt(values.gjendje) < 0 ? 'text-destructive' : ''}`}
        />
      </td>
      <td className="p-3 text-sm text-muted-foreground">
        {format(new Date(drink.updated_at), 'dd/MM/yyyy HH:mm')}
      </td>
      <td className="p-3">
        <AdminRowControls
          tableName="alcoholic_drinks_inventory"
          rowId={drink.id}
          sortOrder={drink.sort_order}
          trackDaily={drink.track_daily}
          isFirst={idx === 0}
          isLast={idx === total - 1}
          prevRow={prevRow}
          nextRow={nextRow}
          onChanged={onReload}
        />
      </td>
      <td className="p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(drink.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </td>
    </tr>
  );
};

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
        .select('id, drink_name, furnizime, shitje, gjendje, sort_order, track_daily, updated_at, purchase_price')
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

  const updateDrink = async (id: string, field: 'furnizime' | 'shitje' | 'gjendje' | 'purchase_price', value: number) => {
    try {
      // Merr të dhënat aktuale nga databaza për saktësi
      const { data: currentDrink, error: fetchError } = await supabase
        .from('alcoholic_drinks_inventory')
        .select('furnizime, shitje, gjendje')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!currentDrink) return;

      let updateData: Record<string, number> = {};
      
      if (field === 'furnizime') {
        // Furnizimi shton te gjendje dhe pastaj pastrohet në 0
        // Gjendje += vlera e furnizimit
        if (value > 0) {
          updateData.gjendje = currentDrink.gjendje + value;
          updateData.furnizime = 0; // Pastrohet furnizimi
        }
      } else if (field === 'gjendje') {
        // Gjendje mund të ndryshohet manualisht
        updateData.gjendje = value;
      } else if (field === 'shitje') {
        // Shitje mund të ndryshohet manualisht për rregullime inventari
        updateData.shitje = value;
      } else if (field === 'purchase_price') {
        updateData.purchase_price = value;
      }

      if (Object.keys(updateData).length === 0) return;

      const { error } = await supabase
        .from('alcoholic_drinks_inventory')
        .update(updateData)
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
                  <th className="p-3 text-left font-medium">Çmim Blerje</th>
                  <th className="p-3 text-left font-medium">Furnizim</th>
                  <th className="p-3 text-left font-medium">Shitje</th>
                  <th className="p-3 text-left font-medium">Gjendje</th>
                  <th className="p-3 text-left font-medium">Përditësuar</th>
                  <th className="p-3 text-left font-medium">Renditje / Ditore</th>
                  <th className="p-3 text-left font-medium">Veprime</th>
                </tr>
              </thead>
              <tbody>
                {drinks.map((drink, idx) => (
                  <DrinkRow
                    key={drink.id}
                    drink={drink}
                    idx={idx}
                    total={drinks.length}
                    prevRow={idx > 0 ? { id: drinks[idx - 1].id, sort_order: drinks[idx - 1].sort_order } : undefined}
                    nextRow={idx < drinks.length - 1 ? { id: drinks[idx + 1].id, sort_order: drinks[idx + 1].sort_order } : undefined}
                    onUpdate={updateDrink}
                    onDelete={deleteDrink}
                    onReload={loadDrinks}
                  />
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
