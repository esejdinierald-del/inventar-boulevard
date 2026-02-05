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

  // Load data for current date on mount and when date changes
  useEffect(() => {
    const loadData = async () => {
      console.log('📅 Loading data for date:', selectedDate);
      isInitialLoad.current = true;
      
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
          
          // Siguro që T2 mulliriFillim është sinkronizuar me T1 mulliriPerfund
          const syncedT2 = {
            ...migratedT2,
            mulliriFillim: migratedT1.mulliriPerfund
          };
          console.log(`🔄 Syncing T1 mulliriPerfund (${migratedT1.mulliriPerfund}) to T2 mulliriFillim`);
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
      
      // Mark initial load as complete after a short delay
      setTimeout(() => {
        console.log('✅ Initial load complete - auto-save enabled');
        isInitialLoad.current = false;
      }, 500);
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

  // Auto-sync T1 stock to T2 when T1 changes AND propagate if past date
  // KRITIKE: Përdor T1.gjendje nëse > 0, përndryshe llogarit teorikisht
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    const syncAndPropagate = async () => {
      console.log('🔄 Syncing T1 → T2 (gjendje if filled, otherwise calculated)');
      setTurn2(prev => {
        const newT2 = {
          ...prev,
          products: Object.fromEntries(
            Object.entries(prev.products).map(([key, data]) => {
              const t1Data = turn1.products[key];
              if (t1Data) {
                // KRITIKE: Nëse T1.gjendje > 0, përdor atë (vlera reale e numëruar)
                // Nëse T1.gjendje = 0 por ka stokFillim, llogarit teorikisht
                let newStokFillim: number;
                if (t1Data.gjendje > 0) {
                  // Gjendje e plotësuar - përdor vlerën reale
                  newStokFillim = t1Data.gjendje;
                  console.log(`  ${key}: T1.gjendje = ${t1Data.gjendje} → T2.stokFillim (vlera reale)`);
                } else if (t1Data.stokFillim > 0 || t1Data.furnizime > 0) {
                  // Gjendje e pa-plotësuar por ka stok - llogarit teorikisht
                  newStokFillim = CalculationService.calculateNewStock(t1Data);
                  console.log(`  ${key}: T1 teorik (${t1Data.stokFillim} + ${t1Data.furnizime} - ${t1Data.shiriti}) = ${newStokFillim} → T2.stokFillim`);
                } else {
                  // Asnjë të dhënë - mbaj 0
                  newStokFillim = 0;
                }
                return [key, { ...data, stokFillim: newStokFillim }];
              }
              return [key, data];
            })
          ),
          mulliriFillim: turn1.mulliriPerfund
        };
        console.log(`📊 Auto-sync T2 mulliriFillim = T1 mulliriPerfund (${turn1.mulliriPerfund})`);
        console.log('✅ T1 → T2 sync complete');
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
        const today = new Date().toISOString().split('T')[0];
        const isPastDate = selectedDate < today;
        
        console.log('💾 Saving T2 stock for next day (T2 → Next Day T1)...');
        const nextDayStock = Object.fromEntries(
          Object.entries(turn2.products).map(([key, data]) => {
            const calculatedStock = CalculationService.calculateNewStock(data);
            console.log(`  📦 ${key}: ${data.stokFillim} + ${data.furnizime} - ${data.shiriti} = ${calculatedStock}`);
            return [key, calculatedStock];
          })
        );

        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayDate = nextDay.toISOString().split('T')[0];

        console.log(`💾 Saving to ${nextDayDate}:`, nextDayStock);
        await StorageService.setStockForDate(nextDayDate, nextDayStock);
        
        // KRITIKE: Nëse T2 mulliriPerfund është 0, përdor T1 mulliriPerfund
        const mulliriForNextDay = turn2.mulliriPerfund > 0 ? turn2.mulliriPerfund : turn1.mulliriPerfund;
        console.log(`🔄 Saving mulliri for next day: T2 mulliriPerfund = ${turn2.mulliriPerfund}, T1 mulliriPerfund = ${turn1.mulliriPerfund}, using: ${mulliriForNextDay}`);
        
        // Vetëm ruaj nëse vlera është > 0, përndryshe lëre null që të kontrollohet dita e mëparshme
        if (mulliriForNextDay > 0) {
          await StorageService.setMulliriForDate(nextDayDate, mulliriForNextDay);
          console.log(`✅ Next day mulliri saved for ${nextDayDate}: ${mulliriForNextDay}`);
        } else {
          console.log(`⏭️ Skipping mulliri save for ${nextDayDate} (value is 0)`);
        }
        console.log(`✅ Next day stock saved for ${nextDayDate}`);

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

  // Update product in turn
  const updateTurn1Product = useCallback((product: string, field: keyof ProductData, value: number) => {
    console.log(`📝 Updating T1 ${product}.${field} = ${value}`);
    setTurn1(prev => {
      const updated = {
        ...prev,
        products: {
          ...prev.products,
          [product]: {
            ...prev.products[product],
            [field]: value
          }
        }
      };
      console.log('📝 New T1 state:', updated);
      return updated;
    });
  }, []);

  const updateTurn2Product = useCallback((product: string, field: keyof ProductData, value: number) => {
    console.log(`📝 Updating T2 ${product}.${field} = ${value}`);
    setTurn2(prev => {
      const updated = {
        ...prev,
        products: {
          ...prev.products,
          [product]: {
            ...prev.products[product],
            [field]: value
          }
        }
      };
      console.log('📝 New T2 state:', updated);
      return updated;
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
        const calculatedStock = CalculationService.calculateNewStock(data);
        return [key, calculatedStock];
      })
    );

    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayDate = nextDay.toISOString().split('T')[0];

    await StorageService.setStockForDate(nextDayDate, nextDayStock);
    await StorageService.setMulliriForDate(nextDayDate, turn2.mulliriPerfund);
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
  const handleReceiptDataT1 = useCallback((
    productData: { [key: string]: number },
    coffeeData: { [key: string]: number },
    alcoholicDrinksData?: { [key: string]: number },
    total?: number
  ) => {
    console.log('T1 Receipt Data - Alcoholic Drinks:', alcoholicDrinksData);
    setTurn1(prev => ({
      ...prev,
      products: Object.fromEntries(
        Object.entries(prev.products).map(([key, value]) => [
          key,
          productData[key] !== undefined ? { ...value, shiriti: productData[key] } : value
        ])
      ),
      coffee: { ...prev.coffee, ...coffeeData },
      xhiro: total !== undefined ? total : prev.xhiro
    }));
    
    // Zbrit menjëherë pijet alkoolike nga inventari
    if (alcoholicDrinksData && Object.keys(alcoholicDrinksData).length > 0) {
      applyAlcoholicDrinksImmediately(alcoholicDrinksData);
    }
  }, [applyAlcoholicDrinksImmediately]);

  const handleReceiptDataT2 = useCallback((
    productData: { [key: string]: number },
    coffeeData: { [key: string]: number },
    alcoholicDrinksData?: { [key: string]: number },
    total?: number
  ) => {
    console.log('T2 Receipt Data - Alcoholic Drinks:', alcoholicDrinksData);
    setTurn2(prev => ({
      ...prev,
      products: Object.fromEntries(
        Object.entries(prev.products).map(([key, value]) => [
          key,
          productData[key] !== undefined ? { ...value, shiriti: productData[key] } : value
        ])
      ),
      coffee: { ...prev.coffee, ...coffeeData },
      xhiro: total !== undefined ? total : prev.xhiro
    }));
    
    // Zbrit menjëherë pijet alkoolike nga inventari
    if (alcoholicDrinksData && Object.keys(alcoholicDrinksData).length > 0) {
      applyAlcoholicDrinksImmediately(alcoholicDrinksData);
    }
  }, [applyAlcoholicDrinksImmediately]);

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
    totalXhiro,
    saveStatus,
  };
};
