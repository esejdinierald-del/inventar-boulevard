import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * @param options.dailyOnly Kur true, kthen vetëm pijet me `track_daily=true`
 *   (përdoret nga faqja e Regjistrimit Ditor). Default: false.
 */
export const useAlcoholicDrinksList = (options: { dailyOnly?: boolean } = {}) => {
  const { dailyOnly = false } = options;
  const [alcoholicDrinks, setAlcoholicDrinks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlcoholicDrinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyOnly]);

  const loadAlcoholicDrinks = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('alcoholic_drinks_inventory')
        .select('drink_name, track_daily')
        .order('sort_order', { ascending: true });

      if (dailyOnly) {
        query = query.eq('track_daily', true);
      }

      const { data, error } = await query;

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
