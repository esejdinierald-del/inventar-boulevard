import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AlcoholicDrinkData {
  [drinkName: string]: number; // Shitjet për këtë pije
}

export const useAlcoholicDrinks = (selectedDate: string) => {
  const [turn1Drinks, setTurn1Drinks] = useState<AlcoholicDrinkData>({});
  const [turn2Drinks, setTurn2Drinks] = useState<AlcoholicDrinkData>({});

  // Load data from localStorage when date changes
  useEffect(() => {
    const key = `alcoholic_drinks_${selectedDate}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTurn1Drinks(data.turn1 || {});
        setTurn2Drinks(data.turn2 || {});
      } catch (error) {
        console.error('Error loading alcoholic drinks data:', error);
      }
    } else {
      setTurn1Drinks({});
      setTurn2Drinks({});
    }
  }, [selectedDate]);

  // Auto-save when data changes
  useEffect(() => {
    const key = `alcoholic_drinks_${selectedDate}`;
    const data = { turn1: turn1Drinks, turn2: turn2Drinks };
    localStorage.setItem(key, JSON.stringify(data));
  }, [turn1Drinks, turn2Drinks, selectedDate]);

  // Update inventory in database
  const updateInventory = async () => {
    try {
      // Get all drinks from inventory
      const { data: drinks, error: fetchError } = await supabase
        .from('alcoholic_drinks_inventory')
        .select('*');

      if (fetchError) throw fetchError;
      if (!drinks) return;

      // Calculate total sales for each drink and update
      for (const drink of drinks) {
        const turn1Sales = turn1Drinks[drink.drink_name] || 0;
        const turn2Sales = turn2Drinks[drink.drink_name] || 0;
        const totalSales = turn1Sales + turn2Sales;

        if (totalSales > 0) {
          // Shitje += shitjet e reja, Gjendje -= shitjet e reja
          const newShitje = drink.shitje + totalSales;
          const newGjendje = drink.gjendje - totalSales;

          const { error } = await supabase
            .from('alcoholic_drinks_inventory')
            .update({
              shitje: newShitje,
              gjendje: newGjendje
            })
            .eq('id', drink.id);

          if (error) throw error;
        }
      }

      // Clear local data after successful update
      setTurn1Drinks({});
      setTurn2Drinks({});
      const key = `alcoholic_drinks_${selectedDate}`;
      localStorage.removeItem(key);

      toast.success('Pijet alkoolike u përditësuan në inventar');
    } catch (error) {
      console.error('Error updating alcoholic drinks inventory:', error);
      toast.error('Gabim në përditësimin e pijeve alkoolike');
    }
  };

  return {
    turn1Drinks,
    turn2Drinks,
    setTurn1Drinks,
    setTurn2Drinks,
    updateInventory
  };
};
