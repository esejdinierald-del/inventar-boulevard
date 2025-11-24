import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class AlcoholicDrinksService {
  /**
   * Apliko zbritjet e pijeve alkoolike nga shiritat në inventar
   */
  static async applyAlcoholicDrinksSales(selectedDate: string): Promise<void> {
    try {
      // Ngarko shitjet e turn1 dhe turn2
      const t1Key = `alcoholic_sales_t1_${selectedDate}`;
      const t2Key = `alcoholic_sales_t2_${selectedDate}`;
      
      const t1Data = localStorage.getItem(t1Key);
      const t2Data = localStorage.getItem(t2Key);
      
      if (!t1Data && !t2Data) {
        console.log('Nuk ka të dhëna për pijet alkoolike për këtë ditë');
        return;
      }

      const t1Sales: { [key: string]: number } = t1Data ? JSON.parse(t1Data) : {};
      const t2Sales: { [key: string]: number } = t2Data ? JSON.parse(t2Data) : {};

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
          const newShitje = drink.shitje + soldQuantity;
          const newGjendje = drink.furnizime - newShitje;

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

      // Fshi të dhënat e shitjeve pas aplikimit
      localStorage.removeItem(t1Key);
      localStorage.removeItem(t2Key);

      toast.success('Pijet alkoolike u përditësuan në inventar');
    } catch (error) {
      console.error('Error applying alcoholic drinks sales:', error);
      toast.error('Gabim në përditësimin e pijeve alkoolike');
    }
  }
}
