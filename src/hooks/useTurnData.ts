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
    console.log('📅 Loading data for date:', selectedDate);
    isInitialLoad.current = true;
    const savedData = StorageService.getDailyEntryData(selectedDate);
    if (savedData) {
      console.log('📂 Found saved data:', savedData);
      setTurn1(savedData.turn1);
      setTurn2(savedData.turn2);
    } else {
      console.log('📝 No saved data - creating empty');
      setTurn1(createEmptyTurnData());
      setTurn2(createEmptyTurnData());
    }
    // Mark initial load as complete after a short delay
    setTimeout(() => {
      console.log('✅ Initial load complete - auto-save enabled');
      isInitialLoad.current = false;
    }, 100);
  }, [selectedDate, createEmptyTurnData]);

  // Auto-save current day data when turn1 or turn2 changes
  useEffect(() => {
    if (isInitialLoad.current) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          turn1,
          turn2,
          date: selectedDate
        };
        StorageService.setDailyEntryData(selectedDate, dataToSave);
        
        // Verify save
        const verified = StorageService.getDailyEntryData(selectedDate);
        if (!verified) {
          toast.error('❌ Të dhënat NUK u ruajtën!');
        }
      } catch (error) {
        toast.error(`❌ Gabim në ruajtje: ${error}`);
      }
    }, 500);

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

      StorageService.setStockForDate(nextDayDate, nextDayStock);
      StorageService.setMulliriForDate(nextDayDate, turn2.mulliriPerfund);
    }, 1000); // Run after T1->T2 sync

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
