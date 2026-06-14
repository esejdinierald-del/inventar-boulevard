import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { TurnData, ProductData } from '@/types/turn.types';
import { StorageService } from '@/services/storage.service';
import { CalculationService } from '@/services/calculations';
import { StockPropagationService } from '@/services/stock-propagation.service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseTurnDataProps {
  products: string[];
  coffeeTypes: string[];
  selectedDate: string;
}

// Migrim për emrat e produkteve
const PRODUCT_NAME_MIGRATION: { [key: string]: string } = {
  "u.vit": "Uje .vit",
  "heineken 330": "Heineken shishe",
  "korona": "Korona",
  "paulaner": "Paulaner",
  "rose": "Rose",
  "r.bull": "Red.bull",
  "b.52": "B 52",
  "crodino": "Crodino",
  "biter": "Biter",
  "uje": "Uje",
  "caj": "Caj",
  "caj bio": "Caj bio"
};

const migrateProductNames = (turnData: TurnData, productList: string[]): TurnData => {
  const migratedProducts: { [key: string]: ProductData } = {};
  
  // Migro emrat e vjetër
  Object.entries(turnData.products).forEach(([oldName, data]) => {
    const newName = PRODUCT_NAME_MIGRATION[oldName] || oldName;
    migratedProducts[newName] = data;
  });
  
  // Shto produktet e munguara me vlera 0
  productList.forEach(product => {
    if (!migratedProducts[product]) {
      migratedProducts[product] = {
        stokFillim: 0,
        gjendje: 0,
        shiriti: 0,
        furnizime: 0
      };
    }
  });
  
  return {
    ...turnData,
    products: migratedProducts,
    shpenzime: turnData.shpenzime || []
  };
};

export const useTurnData = ({ products, coffeeTypes, selectedDate }: UseTurnDataProps) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const createEmptyTurnData = useCallback((): TurnData => ({
    products: Object.fromEntries(products.map(p => [p, {
      stokFillim: 0,
      gjendje: 0,
      shiriti: 0,
      furnizime: 0
    }])),
    coffee: Object.fromEntries(coffeeTypes.map(c => [c, 0])),
    xhiro: 0,
    mulliriFillim: 0,
    mulliriPerfund: 0,
    shpenzime: []
  }), [products, coffeeTypes]);

  const [turn1, setTurn1] = useState<TurnData>(createEmptyTurnData);
  const [turn2, setTurn2] = useState<TurnData>(createEmptyTurnData);
  const isInitialLoad = useRef(true);
  const loadCompleteCounter = useRef(0); // Tracks how many times data was loaded
  // KRITIKE: Track cilat produkte në T2.stokFillim u redaktuan manualisht
  // që auto-sync T1→T2 të mos i mbishkruajë
  const t2ManuallyEditedStokFillim = useRef<Set<string>>(new Set());

  // Load data for current date on mount and when date changes
  useEffect(() => {
    const loadData = async () => {
      console.log('📅 Loading data for date:', selectedDate);
      isInitialLoad.current = true;
      // Reset manual edit tracking për datën e re
      t2ManuallyEditedStokFillim.current = new Set();
      
      try {
        // GJITHMONË kontrollo për next_day_stock fillimisht
        const savedStock = await StorageService.getStockForDate(selectedDate);
        let savedMulliri = await StorageService.getMulliriForDate(selectedDate);
        
        // KRITIKE: Nëse mulliri është 0, kontrollo ditën e mëparshme
        if (savedMulliri === 0 || savedMulliri === null) {
          console.log('⚠️ Mulliri është 0 ose null, duke kontrolluar ditën e mëparshme...');
          const previousDay = new Date(selectedDate);
          previousDay.setDate(previousDay.getDate() - 1);
          const previousDayDate = previousDay.toISOString().split('T')[0];
          
          const previousDayData = await StorageService.getDailyEntryData(previousDayDate);
          if (previousDayData) {
            // Përdor T2 mulliriPerfund nëse > 0, përndryshe T1 mulliriPerfund
            const previousMulliri = previousDayData.turn2.mulliriPerfund > 0 
              ? previousDayData.turn2.mulliriPerfund 
              : previousDayData.turn1.mulliriPerfund;
            
            if (previousMulliri > 0) {
              console.log(`✅ Gjetur mulliri nga dita e mëparshme (${previousDayDate}): ${previousMulliri}`);
              savedMulliri = previousMulliri;
              // Ruaj për herë të ardhshme
              await StorageService.setMulliriForDate(selectedDate, previousMulliri);
            }
          }
        }
        
        const savedData = await StorageService.getDailyEntryData(selectedDate);
        if (savedData) {
          console.log('📂 Found saved data - migrating if needed');
          // Migro emrat e produkteve
          let migratedT1 = migrateProductNames(savedData.turn1, products);
          const migratedT2 = migrateProductNames(savedData.turn2, products);
          
          // KRITIKE: Nëse ka next_day_stock, mbishkruaj stokFillim në T1
          if (savedStock || savedMulliri) {
            console.log('📦 Found next_day_stock - overriding T1 stokFillim & mulliriFillim');
            if (savedStock) {
              const migratedStock: { [key: string]: number } = {};
              Object.entries(savedStock).forEach(([oldName, value]) => {
                const newName = PRODUCT_NAME_MIGRATION[oldName] || oldName;
                migratedStock[newName] = value;
              });
              
              console.log('🔄 Loading stock from previous day T2:', migratedStock);
              migratedT1 = {
                ...migratedT1,
                products: Object.fromEntries(
                  Object.entries(migratedT1.products).map(([key, data]) => [
                    key,
                    { ...data, stokFillim: migratedStock[key] || 0 }
                  ])
                )
              };
            }
            
            if (savedMulliri !== null) {
              console.log(`📦 Setting T1 mulliriFillim from previous day T2: ${savedMulliri}`);
              migratedT1 = {
                ...migratedT1,
                mulliriFillim: savedMulliri
              };
            }
          }
          
          // KRITIKE: Sinkronizo T2 stokFillim nga T1 — përfshi edhe produktet që mungojnë në T2
          const syncedT2Products: { [key: string]: ProductData } = { ...migratedT2.products };
          Object.entries(migratedT1.products).forEach(([key, t1Data]) => {
            const newStokFillim = CalculationService.calculateNewStock(t1Data);
            const existing = syncedT2Products[key] || { stokFillim: 0, gjendje: 0, shiriti: 0, furnizime: 0 };
            syncedT2Products[key] = { ...existing, stokFillim: newStokFillim };
          });

          const syncedT2 = {
            ...migratedT2,
            products: syncedT2Products,
            mulliriFillim: migratedT1.mulliriPerfund
          };
          console.log(`🔄 Syncing T1 → T2 (gjendje if filled, otherwise calculated)`);
          console.log('📊 T1 data:', { mulliriFillim: migratedT1.mulliriFillim, mulliriPerfund: migratedT1.mulliriPerfund });
          console.log('📊 T2 data:', { mulliriFillim: syncedT2.mulliriFillim, mulliriPerfund: syncedT2.mulliriPerfund });
          
          setTurn1(migratedT1);
          setTurn2(syncedT2);
          
          // Ruaj të dhënat e përditësuara
          await StorageService.setDailyEntryData(selectedDate, {
            turn1: migratedT1,
            turn2: syncedT2,
            date: selectedDate
          });
        } else {
          console.log('📝 No saved data - checking for next day stock');
          const newT1 = createEmptyTurnData();
          const newT2 = createEmptyTurnData();
          
          if (savedStock || savedMulliri) {
            console.log('📦 Found next day stock - loading into T1');
            if (savedStock) {
              // Migro emrat e produkteve
              const migratedStock: { [key: string]: number } = {};
              Object.entries(savedStock).forEach(([oldName, value]) => {
                const newName = PRODUCT_NAME_MIGRATION[oldName] || oldName;
                migratedStock[newName] = value;
              });
              
              console.log('🔄 Initializing T1 stock from previous day T2:', migratedStock);
              newT1.products = Object.fromEntries(
                Object.entries(newT1.products).map(([key, data]) => [
                  key,
                  { ...data, stokFillim: migratedStock[key] || 0 }
                ])
              );
            }
            
            if (savedMulliri !== null) {
              console.log(`📦 Setting new T1 mulliriFillim from previous day T2: ${savedMulliri}`);
              newT1.mulliriFillim = savedMulliri;
            }
          }
          
          // Siguro që T2 mulliriFillim është sinkronizuar me T1 mulliriPerfund
          newT2.mulliriFillim = newT1.mulliriPerfund;
          console.log(`🔄 Syncing new T1 mulliriPerfund (${newT1.mulliriPerfund}) to T2 mulliriFillim`);
          console.log('📊 New T1 data:', { mulliriFillim: newT1.mulliriFillim, mulliriPerfund: newT1.mulliriPerfund });
          console.log('📊 New T2 data:', { mulliriFillim: newT2.mulliriFillim, mulliriPerfund: newT2.mulliriPerfund });
          
          setTurn1(newT1);
          setTurn2(newT2);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setTurn1(createEmptyTurnData());
        setTurn2(createEmptyTurnData());
      }
      
      // Mark initial load as complete after sync timeouts have passed
      // T1→T2 sync fires at 800ms, T2→next_day at 1200ms
      // Wait 1500ms to ensure all initial syncs complete before enabling auto-save
      loadCompleteCounter.current += 1;
      const currentLoad = loadCompleteCounter.current;
      setTimeout(() => {
        // Only mark complete if no newer load has started
        if (loadCompleteCounter.current === currentLoad) {
          console.log('✅ Initial load complete - auto-save enabled');
          isInitialLoad.current = false;
        }
      }, 1500);
    };
    
    loadData();
  }, [selectedDate, products, createEmptyTurnData]);

  // Auto-save current day data when turn1 or turn2 changes
  useEffect(() => {
    if (isInitialLoad.current) {
      console.log('⏭️ Skipping auto-save during initial load');
      return;
    }
    
    const saveData = async () => {
      console.log('💾 Auto-saving data for date:', selectedDate);
      console.log('📊 Turn1:', turn1);
      console.log('📊 Turn2:', turn2);
      setSaveStatus('saving');
      try {
        const dataToSave = {
          turn1,
          turn2,
          date: selectedDate
        };
        await StorageService.setDailyEntryData(selectedDate, dataToSave);
        console.log('✅ Data saved successfully');
        
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('idle');
        const errorMessage = error instanceof Error ? error.message : 'Gabim në ruajtje';
        console.error('❌ Save error:', errorMessage);
        toast.error(`❌ ${errorMessage}`);
      }
    };
    
    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [turn1, turn2, selectedDate, setSaveStatus]);

  // Auto-sync T1 stock to T2 when T1 changes
  // Formula e re: T2.stokFillim = T1.stokFillim − T1.shiriti (pa marrë parasysh gjendjen)
  // T2 ndjek GJITHMONË T1 — nuk ka më manual-edit lock për stokFillim.
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    const syncAndPropagate = async () => {
      console.log('🔄 Syncing T1 → T2 (stokFillim − shiriti, pa gjendje)');
      setTurn2(prev => {
        const merged: { [key: string]: ProductData } = { ...prev.products };

        Object.entries(turn1.products).forEach(([key, t1Data]) => {
          const newStokFillim = CalculationService.calculateStockForNextTurn(t1Data);
          const existing = merged[key] || { stokFillim: 0, gjendje: 0, shiriti: 0, furnizime: 0 };
          merged[key] = { ...existing, stokFillim: newStokFillim };
          console.log(`  ${key}: T1 → T2.stokFillim = ${newStokFillim}`);
        });

        const newT2 = {
          ...prev,
          products: merged,
          mulliriFillim: turn1.mulliriPerfund
        };
        console.log(`📊 Auto-sync T2 mulliriFillim = T1 mulliriPerfund (${turn1.mulliriPerfund})`);
        return newT2;
      });
    };
    
    const timeoutId = setTimeout(syncAndPropagate, 800);

    return () => clearTimeout(timeoutId);
  }, [turn1, selectedDate]);

  // Auto-save T2 stock to next day when T2 changes AND propagate to future dates if past date
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    const saveNextDayAndPropagate = async () => {
      try {
        // MBROJTJE SHTESË: Mos mbishkruaj next_day_stock me 0 nëse T2 nuk ka të dhëna reale
        const hasAnyT2Data = Object.values(turn2.products).some(
          p => p.stokFillim > 0 || p.furnizime > 0 || p.shiriti > 0 || p.gjendje > 0
        );
        if (!hasAnyT2Data && turn2.xhiro === 0) {
          console.log('⏭️ T2 nuk ka të dhëna reale - duke shmangur mbishkrimin e next_day_stock');
          return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        const isPastDate = selectedDate < today;
        
        console.log('💾 Saving T2 stock for next day (T2 → Next Day T1)...');
        const nextDayStock = Object.fromEntries(
          Object.entries(turn2.products).map(([key, data]) => {
            const calculatedStock = CalculationService.calculateStockForNextTurn(data);
            console.log(`  📦 ${key}: stok=${data.stokFillim}+furn=${data.furnizime}-shir=${data.shiriti} gjendje=${data.gjendje} → ${calculatedStock}`);
            return [key, calculatedStock];
          })
        );

        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayDate = nextDay.toISOString().split('T')[0];

        // KRITIKE: Përdor ruajtje atomike - stock DHE mulliri bashkë
        const mulliriForNextDay = turn2.mulliriPerfund > 0 ? turn2.mulliriPerfund : turn1.mulliriPerfund;
        console.log(`💾 Saving stock & mulliri atomically to ${nextDayDate}:`, { stock: nextDayStock, mulliri: mulliriForNextDay });
        
        await StorageService.setStockAndMulliriForDate(nextDayDate, nextDayStock, mulliriForNextDay);
        console.log(`✅ Next day stock & mulliri saved for ${nextDayDate}`);

        // KRITIKE: Nëse është datë e kaluar, propago ndryshimet në të gjitha datat pasardhëse
        if (isPastDate) {
          console.log('🔄 Data e kaluar detektuar - filloj propagimin...');
          await StockPropagationService.propagateFromDate(selectedDate);
        }
      } catch (error) {
        console.error('Error saving next day stock:', error);
      }
    };
    
    const timeoutId = setTimeout(saveNextDayAndPropagate, 1200); // Run after T1->T2 sync
    return () => clearTimeout(timeoutId);
  }, [turn2, turn1.mulliriPerfund, selectedDate]);

  // Update product in turn — siguron strukturë të plotë ProductData edhe për produkte të reja
  const EMPTY_PRODUCT: ProductData = { stokFillim: 0, gjendje: 0, shiriti: 0, furnizime: 0 };

  const updateTurn1Product = useCallback((product: string, field: keyof ProductData, value: number) => {
    console.log(`📝 Updating T1 ${product}.${field} = ${value}`);
    setTurn1(prev => {
      const existing = { ...EMPTY_PRODUCT, ...(prev.products[product] || {}) };
      const next: ProductData = { ...existing, [field]: value };
      // KRITIKE: Kur ndryshon Furnizime, shto delta-n te StokFillim i të njëjtit turn.
      // Furnizime mbetet si regjistër historie; Dif tashmë llogaritet pa Furnizime.
      if (field === 'furnizime') {
        const delta = value - (existing.furnizime || 0);
        next.stokFillim = (existing.stokFillim || 0) + delta;
      }
      return {
        ...prev,
        products: { ...prev.products, [product]: next },
      };
    });
  }, []);

  const updateTurn2Product = useCallback((product: string, field: keyof ProductData, value: number) => {
    console.log(`📝 Updating T2 ${product}.${field} = ${value}`);
    // KRITIKE: Nëse stafi redakton manualisht stokFillim në T2, mos e mbishkruaj
    // me auto-sync nga T1. Furnizime po ashtu prek stokFillim, prandaj e shenjojmë.
    if (field === 'stokFillim' || field === 'furnizime') {
      t2ManuallyEditedStokFillim.current.add(product);
    }
    setTurn2(prev => {
      const existing = { ...EMPTY_PRODUCT, ...(prev.products[product] || {}) };
      const next: ProductData = { ...existing, [field]: value };
      if (field === 'furnizime') {
        const delta = value - (existing.furnizime || 0);
        next.stokFillim = (existing.stokFillim || 0) + delta;
      }
      return {
        ...prev,
        products: { ...prev.products, [product]: next },
      };
    });
  }, []);

  // Sync mulliri from T1 to T2
  const syncMulliriT1ToT2 = useCallback((perfundValue: number) => {
    setTurn2(prev => ({
      ...prev,
      mulliriFillim: perfundValue
    }));
  }, []);

  // Copy T1 stock to T2 - përdor gjendje (vlera reale) jo llogaritje teorike
  const copyT1ToT2 = useCallback(() => {
    setTurn2(prev => ({
      ...prev,
      products: Object.fromEntries(
        Object.entries(prev.products).map(([key, data]) => {
          const t1Data = turn1.products[key];
          // KRITIKE: Përdor gjendje (vlera reale e numëruar)
          return [key, { ...data, stokFillim: t1Data.gjendje }];
        })
      )
    }));
    toast.success("Gjendje e T1 u kopjua në T2 stokFillim");
  }, [turn1]);

  // Save current day data
  const saveCurrentDay = useCallback(async () => {
    const dataToSave = {
      turn1,
      turn2,
      date: selectedDate
    };
    await StorageService.setDailyEntryData(selectedDate, dataToSave);
  }, [turn1, turn2, selectedDate]);

  // Save data for next day
  const saveForNextDay = useCallback(async () => {
    // First save current day
    await saveCurrentDay();

    // Then prepare for next day
    const nextDayStock = Object.fromEntries(
      Object.entries(turn2.products).map(([key, data]) => {
        const calculatedStock = CalculationService.calculateStockForNextTurn(data);
        return [key, calculatedStock];
      })
    );

    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayDate = nextDay.toISOString().split('T')[0];

    const mulliriForNextDay = turn2.mulliriPerfund > 0 ? turn2.mulliriPerfund : turn1.mulliriPerfund;
    await StorageService.setStockAndMulliriForDate(nextDayDate, nextDayStock, mulliriForNextDay);
  }, [turn1, turn2, selectedDate, saveCurrentDay]);

  // Load data from previous day
  const loadFromPreviousDay = useCallback(async () => {
    try {
      const savedStock = await StorageService.getStockForDate(selectedDate);
      const savedMulliri = await StorageService.getMulliriForDate(selectedDate);

      if (savedStock || savedMulliri) {
        if (savedStock) {
          // Migro emrat e produkteve
          const migratedStock: { [key: string]: number } = {};
          Object.entries(savedStock).forEach(([oldName, value]) => {
            const newName = PRODUCT_NAME_MIGRATION[oldName] || oldName;
            migratedStock[newName] = value;
          });
          
          setTurn1(prev => ({
            ...prev,
            products: Object.fromEntries(
              Object.entries(prev.products).map(([key, data]) => [
                key,
                { ...data, stokFillim: migratedStock[key] || 0 }
              ])
            )
          }));
        }

        if (savedMulliri !== null) {
          setTurn1(prev => ({
            ...prev,
            mulliriFillim: savedMulliri
          }));
        }

        toast.success("Të dhënat u ngarkuan dhe u përditësuan!");
      } else {
        toast.error("Nuk ka të dhëna për këtë datë");
      }
    } catch (error) {
      console.error('Error loading from previous day:', error);
      toast.error("Gabim në ngarkimin e të dhënave");
    }
  }, [selectedDate]);

  // Funksion për të zbritur menjëherë pijet alkoolike nga inventari
  const applyAlcoholicDrinksImmediately = useCallback(async (alcoholicDrinksData: { [key: string]: number }) => {
    try {
      for (const [drinkName, soldQuantity] of Object.entries(alcoholicDrinksData)) {
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
            console.log(`✅ Zbritur ${drinkName}: shitje +${soldQuantity}, gjendje: ${newGjendje}`);
          }
        }
      }
      toast.success('Pijet alkoolike u zbritën automatikisht!');
    } catch (error) {
      console.error('Error applying alcoholic drinks:', error);
      toast.error('Gabim në zbritjen e pijeve alkoolike');
    }
  }, []);

  // Handle receipt data
  /**
   * Apliko të dhënat e shiritit për T1.
   * KRITIKE: ZËVENDËSON plotësisht shiritin e vjetër — produktet që nuk
   * janë në faturën e re marrin shiriti=0. Kështu ringarkimi i shiritit
   * jep gjithmonë vlerën e fundit, jo shumën me ngarkimet e mëparshme.
   */
  const handleReceiptDataT1 = useCallback((
    productData: { [key: string]: number },
    coffeeData: { [key: string]: number },
    alcoholicDrinksData?: { [key: string]: number },
    total?: number
  ) => {
    console.log('T1 Receipt Data (REPLACE mode) - Alcoholic Drinks:', alcoholicDrinksData);
    setTurn1(prev => ({
      ...prev,
      products: Object.fromEntries(
        Object.entries(prev.products).map(([key, value]) => [
          key,
          { ...value, shiriti: productData[key] ?? 0 }
        ])
      ),
      coffee: Object.fromEntries(
        Object.keys(prev.coffee).map(key => [key, coffeeData[key] ?? 0])
      ),
      xhiro: total !== undefined ? total : prev.xhiro
    }));
    
    // Zbrit menjëherë pijet alkoolike nga inventari
    if (alcoholicDrinksData && Object.keys(alcoholicDrinksData).length > 0) {
      applyAlcoholicDrinksImmediately(alcoholicDrinksData);
    }
  }, [applyAlcoholicDrinksImmediately]);

  /**
   * Apliko të dhënat e shiritit për T2 — zëvendësim total, jo shtim.
   */
  const handleReceiptDataT2 = useCallback((
    productData: { [key: string]: number },
    coffeeData: { [key: string]: number },
    alcoholicDrinksData?: { [key: string]: number },
    total?: number
  ) => {
    console.log('T2 Receipt Data (REPLACE mode) - Alcoholic Drinks:', alcoholicDrinksData);
    setTurn2(prev => ({
      ...prev,
      products: Object.fromEntries(
        Object.entries(prev.products).map(([key, value]) => [
          key,
          { ...value, shiriti: productData[key] ?? 0 }
        ])
      ),
      coffee: Object.fromEntries(
        Object.keys(prev.coffee).map(key => [key, coffeeData[key] ?? 0])
      ),
      xhiro: total !== undefined ? total : prev.xhiro
    }));
    
    // Zbrit menjëherë pijet alkoolike nga inventari
    if (alcoholicDrinksData && Object.keys(alcoholicDrinksData).length > 0) {
      applyAlcoholicDrinksImmediately(alcoholicDrinksData);
    }
  }, [applyAlcoholicDrinksImmediately]);

  // KRITIKE: Forco ruajtjen e stokut për ditën tjetër - thirret kur kyçet turni
  const forceSaveNextDayStock = useCallback(async () => {
    try {
      console.log('🔒 Force saving next day stock on turn lock...');
      const nextDayStock = Object.fromEntries(
        Object.entries(turn2.products).map(([key, data]) => {
          const calculatedStock = CalculationService.calculateStockForNextTurn(data);
          return [key, calculatedStock];
        })
      );

      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayDate = nextDay.toISOString().split('T')[0];
      const mulliriForNextDay = turn2.mulliriPerfund > 0 ? turn2.mulliriPerfund : turn1.mulliriPerfund;

      await StorageService.setStockAndMulliriForDate(nextDayDate, nextDayStock, mulliriForNextDay);
      console.log(`✅ Force saved next day stock for ${nextDayDate}`, { stock: nextDayStock, mulliri: mulliriForNextDay });
    } catch (error) {
      console.error('❌ Error force saving next day stock:', error);
    }
  }, [turn1, turn2, selectedDate]);

  // Memoized calculations
  const totalXhiro = useMemo(
    () => CalculationService.calculateTotalXhiro(turn1, turn2),
    [turn1.xhiro, turn2.xhiro]
  );

  return {
    turn1,
    turn2,
    setTurn1,
    setTurn2,
    updateTurn1Product,
    updateTurn2Product,
    syncMulliriT1ToT2,
    copyT1ToT2,
    saveForNextDay,
    loadFromPreviousDay,
    handleReceiptDataT1,
    handleReceiptDataT2,
    forceSaveNextDayStock,
    totalXhiro,
    saveStatus,
  };
};
