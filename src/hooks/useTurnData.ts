import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { TurnData, ProductData } from '@/types/turn.types';
import { StorageService } from '@/services/storage.service';
import { CalculationService } from '@/services/calculations';
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
    products: migratedProducts
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
    mulliriPerfund: 0
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
        const savedData = await StorageService.getDailyEntryData(selectedDate);
        if (savedData) {
          console.log('📂 Found saved data - migrating if needed');
          // Migro emrat e produkteve
          const migratedT1 = migrateProductNames(savedData.turn1, products);
          const migratedT2 = migrateProductNames(savedData.turn2, products);
          setTurn1(migratedT1);
          setTurn2(migratedT2);
          // Ruaj të dhënat e migruara vetëm nëse ka ndryshime
          const hasChanges = JSON.stringify(savedData.turn1) !== JSON.stringify(migratedT1) ||
                            JSON.stringify(savedData.turn2) !== JSON.stringify(migratedT2);
          if (hasChanges) {
            await StorageService.setDailyEntryData(selectedDate, {
              turn1: migratedT1,
              turn2: migratedT2,
              date: selectedDate
            });
          }
        } else {
          console.log('📝 No saved data - creating empty');
          setTurn1(createEmptyTurnData());
          setTurn2(createEmptyTurnData());
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
  }, [selectedDate, products]);

  // Auto-save current day data when turn1 or turn2 changes
  useEffect(() => {
    if (isInitialLoad.current) {
      console.log('⏭️ Skipping auto-save during initial load');
      return;
    }
    
    const saveData = async () => {
      console.log('💾 Auto-saving data for date:', selectedDate);
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
  }, [turn1, turn2, selectedDate]);

  // Auto-sync T1 stock to T2 when T1 changes
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    const timeoutId = setTimeout(() => {
      setTurn2(prev => ({
        ...prev,
        products: Object.fromEntries(
          Object.entries(prev.products).map(([key, data]) => {
            const t1Data = turn1.products[key];
            if (t1Data) {
              const calculatedStock = CalculationService.calculateNewStock(t1Data);
              return [key, { ...data, stokFillim: calculatedStock }];
            }
            return [key, data];
          })
        ),
        mulliriFillim: turn1.mulliriPerfund
      }));
    }, 800); // Run after main save

    return () => clearTimeout(timeoutId);
  }, [turn1]);

  // Auto-save T2 stock to next day when T2 changes
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    const saveNextDay = async () => {
      try {
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
      } catch (error) {
        console.error('Error saving next day stock:', error);
      }
    };
    
    const timeoutId = setTimeout(saveNextDay, 1000); // Run after T1->T2 sync
    return () => clearTimeout(timeoutId);
  }, [turn2, selectedDate]);

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
    setTurn2(prev => ({
      ...prev,
      products: {
        ...prev.products,
        [product]: {
          ...prev.products[product],
          [field]: value
        }
      }
    }));
  }, []);

  // Sync mulliri from T1 to T2
  const syncMulliriT1ToT2 = useCallback((perfundValue: number) => {
    setTurn2(prev => ({
      ...prev,
      mulliriFillim: perfundValue
    }));
  }, []);

  // Copy T1 stock to T2
  const copyT1ToT2 = useCallback(() => {
    setTurn2(prev => ({
      ...prev,
      products: Object.fromEntries(
        Object.entries(prev.products).map(([key, data]) => {
          const t1Data = turn1.products[key];
          const calculatedStock = CalculationService.calculateNewStock(t1Data);
          return [key, { ...data, stokFillim: calculatedStock }];
        })
      )
    }));
    toast.success("Stoku i T1 u kalkulua dhe u kopjua në T2");
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
    
    // Ruaj shitjet e pijeve alkoolike në localStorage per tu zbritur me vone
    if (alcoholicDrinksData && Object.keys(alcoholicDrinksData).length > 0) {
      const key = `alcoholic_sales_t1_${selectedDate}`;
      localStorage.setItem(key, JSON.stringify(alcoholicDrinksData));
    }
  }, [selectedDate]);

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
    
    // Ruaj shitjet e pijeve alkoolike në localStorage per tu zbritur me vone
    if (alcoholicDrinksData && Object.keys(alcoholicDrinksData).length > 0) {
      const key = `alcoholic_sales_t2_${selectedDate}`;
      localStorage.setItem(key, JSON.stringify(alcoholicDrinksData));
    }
  }, [selectedDate]);

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
