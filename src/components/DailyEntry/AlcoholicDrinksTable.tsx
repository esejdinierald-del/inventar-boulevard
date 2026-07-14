import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AlcoholicDrink {
  id: string;
  drink_name: string;
  furnizime: number;
  shitje: number;
  gjendje: number;
}

interface AlcoholicDrinksTableProps {
  turnName: string;
  onDataExtracted: (drinkData: { [key: string]: number }) => void;
  isFieldDisabled: boolean;
  savedSales?: { [key: string]: number };
}

export const AlcoholicDrinksTable = ({ turnName, onDataExtracted, isFieldDisabled, savedSales = {} }: AlcoholicDrinksTableProps) => {
  const [drinks, setDrinks] = useState<AlcoholicDrink[]>([]);
  const [sales, setSales] = useState<{ [key: string]: number }>(savedSales);
  const [isLoading, setIsLoading] = useState(true);

  // Sync sales with savedSales prop - only update if different
  useEffect(() => {
    const savedKeys = Object.keys(savedSales);
    const currentKeys = Object.keys(sales);
    const isDifferent = savedKeys.length !== currentKeys.length || 
      savedKeys.some(key => savedSales[key] !== sales[key]);
    
    if (isDifferent && savedKeys.length > 0) {
      setSales(savedSales);
    }
  }, [savedSales]);

  useEffect(() => {
    loadDrinks();
  }, []);

  const loadDrinks = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('alcoholic_drinks_inventory')
        .select('*')
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

  const handleSaleChange = (drinkName: string, value: number) => {
    const newSales = { ...sales };
    if (value > 0) {
      newSales[drinkName] = value;
    } else {
      delete newSales[drinkName];
    }
    setSales(newSales);
    onDataExtracted(newSales);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pijet Alkoolike - Turni {turnName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Duke ngarkuar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pijet Alkoolike - Turni {turnName}</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Regjistrо shitjet. Gjendja do të përditësohet automatikisht.</p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full [&_th]:px-1 [&_th]:md:px-3 [&_td]:px-1 [&_td]:md:px-3">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 md:p-3 text-left font-medium text-xs md:text-sm">Pija</th>
                <th className="p-2 md:p-3 text-left font-medium text-xs md:text-sm">Gjendje</th>
                <th className="p-2 md:p-3 text-left font-medium text-xs md:text-sm">Shitje</th>
              </tr>
            </thead>
            <tbody>
              {drinks.map((drink) => (
                <tr key={drink.id} className="border-b">
                  <td className="p-2 md:p-3 font-medium text-xs md:text-sm">{drink.drink_name}</td>
                  <td className="p-2 md:p-3">
                    <span className={`font-medium text-xs md:text-sm ${drink.gjendje < 5 ? 'text-warning' : 'text-muted-foreground'}`}>
                      {drink.gjendje}
                    </span>
                  </td>
                  <td className="p-2 md:p-3">
                    <Input
                      type="number"
                      value={sales[drink.drink_name] || ""}
                      onChange={(e) => handleSaleChange(drink.drink_name, parseInt(e.target.value) || 0)}
                      disabled={isFieldDisabled}
                      className="w-16 md:w-24"
                      min="0"
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
