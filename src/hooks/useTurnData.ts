import { useState, useCallback, useMemo } from 'react';
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
    xhiroEmbelsira: 0,
    akullore: 0,
    mulliriFillim: 0,
    mulliriPerfund: 0
  }), [products, coffeeTypes]);

  const [turn1, setTurn1] = useState<TurnData>(createEmptyTurnData);
  const [turn2, setTurn2] = useState<TurnData>(createEmptyTurnData);

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

  // Save data for next day
  const saveForNextDay = useCallback(() => {
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
    toast.success("Stoku dhe mulliri u ruajtën për ditën e nesërme!");
  }, [turn2, selectedDate]);

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
