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
  // Lock per-datë me timeout automatik — zëvendëson boolean global të vjetër
  private static activePropagations = new Map<string, { startedAt: Date }>();
  private static readonly LOCK_TIMEOUT_MS = 60_000; // 60s max për një propagim

  private static acquireLock(fromDate: string): boolean {
    const existing = StockPropagationService.activePropagations.get(fromDate);
    if (existing) {
      const ageMs = Date.now() - existing.startedAt.getTime();
      if (ageMs < StockPropagationService.LOCK_TIMEOUT_MS) {
        console.warn(`⚠️ Propagimi për ${fromDate} aktiv (${Math.round(ageMs / 1000)}s) — duke shmangur`);
        return false;
      }
      console.warn(`⏱️ Lock për ${fromDate} skadoi (${Math.round(ageMs / 1000)}s) — rimerr automatikisht`);
    }
    StockPropagationService.activePropagations.set(fromDate, { startedAt: new Date() });
    return true;
  }

  private static releaseLock(fromDate: string): void {
    StockPropagationService.activePropagations.delete(fromDate);
  }

  /**
   * Propago ndryshimet e stokut nga një datë e caktuar deri tek data aktuale.
   * Kjo thirret kur modifikohen të dhënat e një date të kaluar.
   */
  static async propagateFromDate(fromDate: string): Promise<void> {
    if (!StockPropagationService.acquireLock(fromDate)) return;

    const today = new Date().toISOString().split('T')[0];

    // Nëse data është sot ose e ardhme, nuk ka nevojë për propagim
    if (fromDate >= today) {
      console.log('📅 Data është sot ose e ardhme - nuk ka propagim');
      StockPropagationService.releaseLock(fromDate);
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
      // KRITIKE: Përdor calculateStockForNextTurn që respekton gjendje (numërim fizik)
      const calculatedStock: { [key: string]: number } = {};
      Object.entries(sourceT2.products).forEach(([productName, data]) => {
        const productData = data as ProductData;
        calculatedStock[productName] = CalculationService.calculateStockForNextTurn(productData);
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
          // KRITIKE: Përdor calculateStockForNextTurn që respekton gjendje
          previousStock = {};
          Object.entries(updatedT2.products).forEach(([productName, data]) => {
            const productData = data as ProductData;
            previousStock[productName] = CalculationService.calculateStockForNextTurn(productData);
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
    } finally {
      StockPropagationService.releaseLock(fromDate);
    }
  }

  /**
   * Rivendos stokun e ditëve pasardhëse duke u nisur nga numërimi fizik (gjendje)
   * i datës `fromDate`. Përdoret nga admini pas rregullimit të Dif: gjendja
   * reale bëhet stoku fillestar i ditës pasardhëse, dhe propagimi vazhdon normal.
   *
   * Seed për produkt: T2.gjendje > 0 ? T2.gjendje
   *                : T1.gjendje > 0 ? T1.gjendje
   *                : calculateStockForNextTurn(T2)
   */
  static async rebaseFromGjendje(fromDate: string): Promise<void> {
    if (!StockPropagationService.acquireLock(fromDate)) return;

    const today = new Date().toISOString().split('T')[0];
    console.log(`🧮 Rebase nga gjendja: ${fromDate} → ${today}`);

    try {
      const { data: sourceEntry, error: sourceError } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('entry_date', fromDate)
        .maybeSingle();
      if (sourceError) throw sourceError;
      if (!sourceEntry) {
        toast.error('Nuk ka të dhëna për këtë datë');
        return;
      }

      const sourceT1 = sourceEntry.turn1_data as unknown as TurnData;
      const sourceT2 = sourceEntry.turn2_data as unknown as TurnData;

      // Seed nga gjendja (T2 ka prioritet — numërim përfundimtar i ditës)
      const calculatedStock: { [key: string]: number } = {};
      const productNames = new Set<string>([
        ...Object.keys(sourceT1?.products || {}),
        ...Object.keys(sourceT2?.products || {}),
      ]);
      productNames.forEach((name) => {
        const t1p = sourceT1?.products?.[name] as ProductData | undefined;
        const t2p = sourceT2?.products?.[name] as ProductData | undefined;
        if (t2p && t2p.gjendje > 0) {
          calculatedStock[name] = t2p.gjendje;
        } else if (t1p && t1p.gjendje > 0 && (!t2p || (t2p.stokFillim === 0 && t2p.shiriti === 0))) {
          calculatedStock[name] = t1p.gjendje;
        } else if (t2p) {
          calculatedStock[name] = CalculationService.calculateStockForNextTurn(t2p);
        } else if (t1p) {
          calculatedStock[name] = CalculationService.calculateStockForNextTurn(t1p);
        }
      });

      const mulliriForNextDay = sourceT2.mulliriPerfund > 0
        ? sourceT2.mulliriPerfund
        : sourceT1.mulliriPerfund;

      // Forward loop — identike me propagateFromDate
      let currentDate = new Date(fromDate);
      currentDate.setDate(currentDate.getDate() + 1);
      let previousStock = calculatedStock;
      let previousMulliri = mulliriForNextDay;

      while (currentDate.toISOString().split('T')[0] <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        await this.updateNextDayStock(dateStr, previousStock, previousMulliri);

        const { data: existingEntry, error: entryError } = await supabase
          .from('daily_entries')
          .select('*')
          .eq('entry_date', dateStr)
          .maybeSingle();
        if (entryError) throw entryError;

        if (existingEntry) {
          const updatedT1 = this.updateT1WithNewStock(
            existingEntry.turn1_data as unknown as TurnData,
            previousStock,
            previousMulliri
          );
          const updatedT2 = this.updateT2FromT1(
            existingEntry.turn2_data as unknown as TurnData,
            updatedT1
          );

          const { error: updateError } = await supabase
            .from('daily_entries')
            .update({
              turn1_data: updatedT1 as any,
              turn2_data: updatedT2 as any,
              updated_at: new Date().toISOString(),
            })
            .eq('entry_date', dateStr);
          if (updateError) throw updateError;

          previousStock = {};
          Object.entries(updatedT2.products).forEach(([productName, data]) => {
            const productData = data as ProductData;
            previousStock[productName] = CalculationService.calculateStockForNextTurn(productData);
          });
          previousMulliri = updatedT2.mulliriPerfund > 0
            ? updatedT2.mulliriPerfund
            : updatedT1.mulliriPerfund;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      await this.updateNextDayStock(
        tomorrow.toISOString().split('T')[0],
        previousStock,
        previousMulliri
      );

      toast.success('Stoku u rivendos nga gjendja dhe u propagua përpara');
    } catch (error) {
      console.error('❌ Gabim në rebase:', error);
      toast.error('Gabim në rivendosjen e stokut');
      throw error;
    } finally {
      StockPropagationService.releaseLock(fromDate);
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

    // 1. Përditëso produktet ekzistuese me stokun e ri
    Object.entries(t1.products).forEach(([productName, data]) => {
      const productData = data as ProductData;
      updatedProducts[productName] = {
        ...productData,
        stokFillim: newStock[productName] ?? productData.stokFillim
      };
    });

    // 2. Shto produktet që ekzistojnë në newStock por jo në T1 aktual
    // (rastet kur produkti u shtua më vonë dhe ka humbur propagimin)
    Object.entries(newStock).forEach(([productName, stock]) => {
      if (!updatedProducts[productName]) {
        updatedProducts[productName] = {
          stokFillim: stock,
          furnizime: 0,
          gjendje: 0,
          shiriti: 0,
        };
      }
    });

    return {
      ...t1,
      products: updatedProducts,
      mulliriFillim: newMulliri
    };
  }

  /**
   * Përditëso T2 stokFillim bazuar në T1 (ruaj T2.furnizime gjithmonë).
   * KRITIKE: calculateT2StokFillim shton furnizimet T2 mbi bazën T1 —
   * pa këtë, çdo propagim do të fshinte furnizimet e ngarkuara në T2.
   */
  private static updateT2FromT1(t2: TurnData, t1: TurnData): TurnData {
    const updatedProducts: { [key: string]: ProductData } = {};

    Object.entries(t2.products).forEach(([productName, data]) => {
      const productData = data as ProductData;
      const t1Data = t1.products[productName] as ProductData;

      if (t1Data) {
        // KRITIKE: Ruaj T2.furnizime — `calculateT2StokFillim` shton furnizimet
        // që janë futur tashmë në T2 (përndryshe propagimi i fshin).
        const newStokFillim = CalculationService.calculateT2StokFillim(t1Data, productData);
        updatedProducts[productName] = {
          ...productData,
          stokFillim: newStokFillim
        };
      } else {
        updatedProducts[productName] = productData;
      }
    });

    // Mos e zero-o mulliriFillim nga T1.mulliriPerfund=0
    const nextMulliriFillim = t1.mulliriPerfund > 0 ? t1.mulliriPerfund : t2.mulliriFillim;

    return {
      ...t2,
      products: updatedProducts,
      mulliriFillim: nextMulliriFillim
    };
  }
}
