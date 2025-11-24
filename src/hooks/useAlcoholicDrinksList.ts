import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAlcoholicDrinksList = () => {
  const [alcoholicDrinks, setAlcoholicDrinks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlcoholicDrinks();
  }, []);

  const loadAlcoholicDrinks = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('alcoholic_drinks_inventory')
        .select('drink_name')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      const drinkNames = data?.map(d => d.drink_name) || [];
      setAlcoholicDrinks(drinkNames);
    } catch (error) {
      console.error('Error loading alcoholic drinks:', error);
      toast.error('Gabim në ngarkimin e listës së pijeve alkoolike');
    } finally {
      setIsLoading(false);
    }
  };

  return { alcoholicDrinks, isLoading, reloadDrinks: loadAlcoholicDrinks };
};
