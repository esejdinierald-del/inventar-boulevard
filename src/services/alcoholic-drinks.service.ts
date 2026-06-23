import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class AlcoholicDrinksService {
  /**
   * @deprecated MOS E THIRR — kjo metodë është jo-idempotente dhe dyfishon zbritjet.
   * Zbritja bëhet tashmë nga `applyAlcoholicDrinksImmediately` në useTurnData.ts
   * me logjikë delta + `alcohol_deductions` tabele.
   * Kjo metodë ekziston vetëm për referencë historike dhe do të fshihet.
   */
  static async applyAlcoholicDrinksSales(selectedDate: string): Promise<void> {
    console.error('❌ DEPRECATED: applyAlcoholicDrinksSales u thirr aksidentalisht — bllokuar.');
    return; // Blloko ekzekutimin e logjikës jo-idempotente
    try {
      // Ngarko shitjet e turn1 dhe turn2 - UNIFIKUAR me useAlcoholicDrinks hook
      const key = `alcoholic_drinks_${selectedDate}`;
      const savedData = localStorage.getItem(key);
      
      if (!savedData) {
        console.log('Nuk ka të dhëna për pijet alkoolike për këtë ditë');
        return;
      }

      const parsed = JSON.parse(savedData);
      const t1Sales: { [key: string]: number } = parsed.turn1 || {};
      const t2Sales: { [key: string]: number } = parsed.turn2 || {};

      // Kombinoj shitjet e të dy turneve
      const totalSales: { [key: string]: number } = {};
      
      Object.keys({ ...t1Sales, ...t2Sales }).forEach(drinkName => {
        totalSales[drinkName] = (t1Sales[drinkName] || 0) + (t2Sales[drinkName] || 0);
      });

      console.log('Total alcoholic drinks sales:', totalSales);

      // Për secilin pije, përditëso inventarin
      for (const [drinkName, soldQuantity] of Object.entries(totalSales)) {
        if (soldQuantity > 0) {
          // Merr gjendjen aktuale
          const { data: drink, error: fetchError } = await supabase
            .from('alcoholic_drinks_inventory')
            .select('*')
            .eq('drink_name', drinkName)
            .single();

          if (fetchError) {
            console.error(`Error fetching ${drinkName}:`, fetchError);
            continue;
          }

          if (!drink) {
            console.warn(`Drink not found: ${drinkName}`);
            continue;
          }

          // Përditëso shitjet dhe gjendjen
          // Shitje += shitjet e reja, Gjendje -= shitjet e reja
          const newShitje = drink.shitje + soldQuantity;
          const newGjendje = drink.gjendje - soldQuantity;

          const { error: updateError } = await supabase
            .from('alcoholic_drinks_inventory')
            .update({
              shitje: newShitje,
              gjendje: newGjendje
            })
            .eq('drink_name', drinkName);

          if (updateError) {
            console.error(`Error updating ${drinkName}:`, updateError);
            toast.error(`Gabim në përditësimin e ${drinkName}`);
          } else {
            console.log(`✅ Updated ${drinkName}: sold +${soldQuantity}, new stock: ${newGjendje}`);
          }
        }
      }

      // Fshi të dhënat e shitjeve pas aplikimit - UNIFIKUAR
      localStorage.removeItem(key);

      toast.success('Pijet alkoolike u përditësuan në inventar');
    } catch (error) {
      console.error('Error applying alcoholic drinks sales:', error);
      toast.error('Gabim në përditësimin e pijeve alkoolike');
    }
  }
}
