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

export const useTurnData = ({ products, coffeeTypes, selectedDate }: UseTurnDataProps) => {
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
    isInitialLoad.current = true;
    
    try {
      const savedData = StorageService.getDailyEntryData(selectedDate);
      
      // CRITICAL: Check if we have saved data
      if (savedData && savedData.turn1 && savedData.turn2) {
        console.log('✅ Found saved data for', selectedDate);
        console.log('Turn1 products:', Object.keys(savedData.turn1.products).length);
        console.log('Turn2 products:', Object.keys(savedData.turn2.products).length);
        
        // Use saved data directly - don't merge with empty
        setTurn1(savedData.turn1);
        setTurn2(savedData.turn2);
      } else {
        console.log('⚠️ No saved data for', selectedDate, '- creating new');
        const emptyT1 = createEmptyTurnData();
        const emptyT2 = createEmptyTurnData();
        
        // Check if we have stock from previous day
        const savedStock = StorageService.getStockForDate(selectedDate);
        const savedMulliri = StorageService.getMulliriForDate(selectedDate);
        
        if (savedStock) {
          console.log('📦 Loading stock from previous day');
          Object.keys(emptyT1.products).forEach(key => {
            if (savedStock[key] !== undefined) {
              emptyT1.products[key].stokFillim = savedStock[key];
            }
          });
        }
        
        if (savedMulliri !== null) {
          emptyT1.mulliriFillim = savedMulliri;
        }
        
        setTurn1(emptyT1);
        setTurn2(emptyT2);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setTurn1(createEmptyTurnData());
      setTurn2(createEmptyTurnData());
    }
    
    // Mark initial load as complete
    setTimeout(() => {
      isInitialLoad.current = false;
      console.log('🔓 Initial load complete - auto-save enabled');
    }, 100);
  }, [selectedDate, createEmptyTurnData]);

  // Auto-save current day data when turn1 or turn2 changes (with debouncing)
  const lastSavedData = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const forceSave = useCallback(() => {
    const dataToSave = {
      turn1,
      turn2,
      date: selectedDate
    };
    
    const dataString = JSON.stringify(dataToSave);
    if (dataString !== lastSavedData.current) {
      console.log('💾 Saving data for', selectedDate);
      console.log('Turn1 xhiro:', turn1.xhiro, 'Turn2 xhiro:', turn2.xhiro);
      StorageService.setDailyEntryData(selectedDate, dataToSave);
      lastSavedData.current = dataString;
      console.log('✅ Data saved successfully');
    } else {
      console.log('⏭️ Skip save - no changes');
    }
  }, [turn1, turn2, selectedDate]);
  
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      forceSave();
    }, 300); // Reduced debounce for faster saves

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [turn1, turn2, selectedDate, forceSave]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      forceSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [forceSave]);

  // Save when date changes
  useEffect(() => {
    return () => {
      forceSave();
    };
  }, [selectedDate]);

  // Auto-sync T1 stock to T2 when T1 changes (only sync specific critical fields)
  // IMPORTANT: Only sync fields that user explicitly changes, not on initial load
  const lastSyncedT1 = useRef<string>('');
  
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    // Serialize T1 relevant fields for comparison
    const t1Signature = JSON.stringify({
      products: Object.fromEntries(
        Object.entries(turn1.products).map(([key, data]) => [
          key, 
          { gjendje: data.gjendje, shiriti: data.shiriti, furnizime: data.furnizime }
        ])
      ),
      mulliriPerfund: turn1.mulliriPerfund
    });
    
    // Only sync if T1 actually changed
    if (t1Signature === lastSyncedT1.current) {
      return;
    }
    
    console.log('🔄 T1 changed, syncing to T2...');
    lastSyncedT1.current = t1Signature;
    
    const timeoutId = setTimeout(() => {
      setTurn2(prev => {
        // Check if sync is actually needed
        let needsUpdate = false;
        const newProducts = { ...prev.products };
        
        Object.keys(newProducts).forEach(key => {
          const t1Data = turn1.products[key];
          if (t1Data) {
            const calculatedStock = CalculationService.calculateNewStock(t1Data);
            if (newProducts[key].stokFillim !== calculatedStock) {
              newProducts[key] = { ...newProducts[key], stokFillim: calculatedStock };
              needsUpdate = true;
            }
          }
        });
        
        const mulliriNeedsUpdate = prev.mulliriFillim !== turn1.mulliriPerfund;
        
        if (!needsUpdate && !mulliriNeedsUpdate) {
          return prev; // No update needed
        }
        
        console.log('✅ Synced T1 → T2');
        
        return {
          ...prev,
          products: newProducts,
          mulliriFillim: turn1.mulliriPerfund
        };
      });
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [turn1]);

  // Auto-save T2 stock to next day when T2 changes (with smart checking)
  const lastSavedNextDay = useRef<string>('');
  
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    const timeoutId = setTimeout(() => {
      const nextDayStock = Object.fromEntries(
        Object.entries(turn2.products).map(([key, data]) => {
          const calculatedStock = CalculationService.calculateNewStock(data);
          return [key, calculatedStock];
        })
      );

      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayDate = nextDay.toISOString().split('T')[0];

      // Only save if data changed
      const saveData = JSON.stringify({ stock: nextDayStock, mulliri: turn2.mulliriPerfund });
      if (saveData !== lastSavedNextDay.current) {
        StorageService.setStockForDate(nextDayDate, nextDayStock);
        StorageService.setMulliriForDate(nextDayDate, turn2.mulliriPerfund);
        lastSavedNextDay.current = saveData;
      }
    }, 1000); // Run after T1->T2 sync

    return () => clearTimeout(timeoutId);
  }, [turn2, selectedDate]);

  // Update product in turn
  const updateTurn1Product = useCallback((product: string, field: keyof ProductData, value: number) => {
    setTurn1(prev => ({
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
  const saveCurrentDay = useCallback(() => {
    const dataToSave = {
      turn1,
      turn2,
      date: selectedDate
    };
    StorageService.setDailyEntryData(selectedDate, dataToSave);
  }, [turn1, turn2, selectedDate]);

  // Save data for next day
  const saveForNextDay = useCallback(() => {
    // First save current day
    saveCurrentDay();

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

    StorageService.setStockForDate(nextDayDate, nextDayStock);
    StorageService.setMulliriForDate(nextDayDate, turn2.mulliriPerfund);
  }, [turn1, turn2, selectedDate, saveCurrentDay]);

  // Load data from previous day
  const loadFromPreviousDay = useCallback(() => {
    const savedStock = StorageService.getStockForDate(selectedDate);
    const savedMulliri = StorageService.getMulliriForDate(selectedDate);

    if (savedStock || savedMulliri) {
      if (savedStock) {
        setTurn1(prev => ({
          ...prev,
          products: Object.fromEntries(
            Object.entries(prev.products).map(([key, data]) => [
              key,
              { ...data, stokFillim: savedStock[key] || 0 }
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

      toast.success("Të dhënat u ngarkuan nga dita e kaluar!");
    } else {
      toast.error("Nuk ka të dhëna për këtë datë");
    }
  }, [selectedDate]);

  // Handle receipt data
  const handleReceiptDataT1 = useCallback((
    productData: { [key: string]: number },
    coffeeData: { [key: string]: number },
    total?: number
  ) => {
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
  }, []);

  const handleReceiptDataT2 = useCallback((
    productData: { [key: string]: number },
    coffeeData: { [key: string]: number },
    total?: number
  ) => {
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
  }, []);

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
  };
};
