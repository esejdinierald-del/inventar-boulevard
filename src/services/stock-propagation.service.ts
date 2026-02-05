import { supabase } from '@/integrations/supabase/client';
import { TurnData, ProductData } from '@/types/turn.types';
import { CalculationService } from './calculations';
import { toast } from 'sonner';

interface DailyEntry {
  entry_date: string;
  turn1_data: TurnData;
  turn2_data: TurnData;
}

export class StockPropagationService {
  /**
   * Propago ndryshimet e stokut nga një datë e caktuar deri tek data aktuale
   * Kjo thirret kur modifikohen të dhënat e një date të kaluar
   */
  static async propagateFromDate(fromDate: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Nëse data është sot ose e ardhme, nuk ka nevojë për propagim
    if (fromDate >= today) {
      console.log('📅 Data është sot ose e ardhme - nuk ka propagim');
      return;
    }

    console.log(`🔄 Filloj propagimin nga ${fromDate} deri ${today}`);
    
    try {
      // 1. Merr të dhënat e datës fillestare
      const { data: sourceEntry, error: sourceError } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('entry_date', fromDate)
        .maybeSingle();

      if (sourceError) throw sourceError;
      if (!sourceEntry) {
        console.log('⚠️ Nuk ka të dhëna për datën fillestare');
        return;
      }

      // 2. Llogarit stokun përfundimtar të T2 për datën fillestare
      const sourceT2 = sourceEntry.turn2_data as unknown as TurnData;
      const sourceT1 = sourceEntry.turn1_data as unknown as TurnData;
      
      // Llogarit stokun e ri për secilin produkt
      const calculatedStock: { [key: string]: number } = {};
      Object.entries(sourceT2.products).forEach(([productName, data]) => {
        const productData = data as ProductData;
        calculatedStock[productName] = CalculationService.calculateNewStock(productData);
      });

      // Llogarit mulliri për ditën tjetër (T2 nëse > 0, përndryshe T1)
      const mulliriForNextDay = sourceT2.mulliriPerfund > 0 
        ? sourceT2.mulliriPerfund 
        : sourceT1.mulliriPerfund;

      // 3. Itero për çdo ditë nga fromDate+1 deri sot
      let currentDate = new Date(fromDate);
      currentDate.setDate(currentDate.getDate() + 1);
      
      let previousStock = calculatedStock;
      let previousMulliri = mulliriForNextDay;

      while (currentDate.toISOString().split('T')[0] <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        console.log(`📦 Përditësoj ${dateStr}...`);

        // Përditëso next_day_stock për këtë datë
        await this.updateNextDayStock(dateStr, previousStock, previousMulliri);

        // Merr entry-n ekzistuese për këtë datë
        const { data: existingEntry, error: entryError } = await supabase
          .from('daily_entries')
          .select('*')
          .eq('entry_date', dateStr)
          .maybeSingle();

        if (entryError) throw entryError;

        if (existingEntry) {
          // Përditëso T1 stokFillim dhe mulliriFillim
          const updatedT1 = this.updateT1WithNewStock(
            existingEntry.turn1_data as unknown as TurnData,
            previousStock,
            previousMulliri
          );

          // Rillogarit T2 stokFillim bazuar në T1 të përditësuar
          const updatedT2 = this.updateT2FromT1(
            existingEntry.turn2_data as unknown as TurnData,
            updatedT1
          );

          // Ruaj ndryshimet
          const { error: updateError } = await supabase
            .from('daily_entries')
            .update({
              turn1_data: updatedT1 as any,
              turn2_data: updatedT2 as any,
              updated_at: new Date().toISOString()
            })
            .eq('entry_date', dateStr);

          if (updateError) throw updateError;

          // Llogarit stokun e ri për ditën pasardhëse
          previousStock = {};
          Object.entries(updatedT2.products).forEach(([productName, data]) => {
            const productData = data as ProductData;
            previousStock[productName] = CalculationService.calculateNewStock(productData);
          });

          previousMulliri = updatedT2.mulliriPerfund > 0 
            ? updatedT2.mulliriPerfund 
            : updatedT1.mulliriPerfund;

          console.log(`✅ ${dateStr} përditësuar`);
        } else {
          // Nëse nuk ka entry, vetëm ruaj next_day_stock
          console.log(`⏭️ ${dateStr} nuk ka entry - vetëm next_day_stock`);
        }

        // Kalo në ditën tjetër
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Përditëso edhe ditën e nesërme
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await this.updateNextDayStock(tomorrowStr, previousStock, previousMulliri);

      console.log('✅ Propagimi përfundoi me sukses!');
      toast.success('Të dhënat u propaguan në të gjitha datat pasardhëse');

    } catch (error) {
      console.error('❌ Gabim në propagim:', error);
      toast.error('Gabim në propagimin e të dhënave');
      throw error;
    }
  }

  /**
   * Përditëso next_day_stock për një datë specifike
   */
  private static async updateNextDayStock(
    date: string, 
    stock: { [key: string]: number },
    mulliri: number
  ): Promise<void> {
    const { data: existing } = await supabase
      .from('next_day_stock')
      .select('id')
      .eq('stock_date', date)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('next_day_stock')
        .update({
          stock_data: stock,
          mulliri_fillim: mulliri,
          updated_at: new Date().toISOString()
        })
        .eq('stock_date', date);
    } else {
      await supabase
        .from('next_day_stock')
        .insert({
          stock_date: date,
          stock_data: stock,
          mulliri_fillim: mulliri
        });
    }
  }

  /**
   * Përditëso T1 me stokun e ri nga dita e mëparshme
   */
  private static updateT1WithNewStock(
    t1: TurnData,
    newStock: { [key: string]: number },
    newMulliri: number
  ): TurnData {
    const updatedProducts: { [key: string]: ProductData } = {};
    
    Object.entries(t1.products).forEach(([productName, data]) => {
      const productData = data as ProductData;
      updatedProducts[productName] = {
        ...productData,
        stokFillim: newStock[productName] ?? productData.stokFillim
      };
    });

    return {
      ...t1,
      products: updatedProducts,
      mulliriFillim: newMulliri
    };
  }

  /**
   * Përditëso T2 stokFillim bazuar në T1.gjendje (nëse plotësuar) ose llogaritje teorike
   * KRITIKE: Nëse gjendje > 0 përdor atë, përndryshe llogarit stokFillim + furnizime - shiriti
   */
  private static updateT2FromT1(t2: TurnData, t1: TurnData): TurnData {
    const updatedProducts: { [key: string]: ProductData } = {};
    
    Object.entries(t2.products).forEach(([productName, data]) => {
      const productData = data as ProductData;
      const t1Data = t1.products[productName] as ProductData;
      
      if (t1Data) {
        // KRITIKE: Nëse T1.gjendje > 0, përdor atë (vlera reale e numëruar)
        // Nëse T1.gjendje = 0 por ka stok, llogarit teorikisht
        let newStokFillim: number;
        if (t1Data.gjendje > 0) {
          newStokFillim = t1Data.gjendje;
        } else if (t1Data.stokFillim > 0 || t1Data.furnizime > 0) {
          newStokFillim = CalculationService.calculateNewStock(t1Data);
        } else {
          newStokFillim = 0;
        }
        updatedProducts[productName] = {
          ...productData,
          stokFillim: newStokFillim
        };
      } else {
        updatedProducts[productName] = productData;
      }
    });

    return {
      ...t2,
      products: updatedProducts,
      mulliriFillim: t1.mulliriPerfund
    };
  }
}
