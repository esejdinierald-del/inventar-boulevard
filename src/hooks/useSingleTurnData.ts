import { useState, useEffect, useCallback, useRef } from 'react';
import { TurnData, ProductData, DailyEntryData } from '@/types/turn.types';
import { StorageService } from '@/services/storage.service';
import { toast } from 'sonner';

interface UseSingleTurnDataProps {
  products: string[];
  coffeeTypes: string[];
  selectedDate: string;
  turnNumber: 1 | 2;
}

export const useSingleTurnData = ({ products, coffeeTypes, selectedDate, turnNumber }: UseSingleTurnDataProps) => {
  const createEmpty = useCallback((): TurnData => ({
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

  const [turnData, setTurnData] = useState<TurnData>(createEmpty);
  const isInitialLoad = useRef(true);

  // Load data on mount/date change
  useEffect(() => {
    isInitialLoad.current = true;
    console.log(`🔄 Loading Turn ${turnNumber} for date:`, selectedDate);
    
    const savedData = StorageService.getDailyEntryData(selectedDate);
    
    if (savedData) {
      const targetTurn = turnNumber === 1 ? savedData.turn1 : savedData.turn2;
      console.log(`✅ Loaded Turn ${turnNumber}:`, targetTurn);
      setTurnData(targetTurn);
      toast.success(`Të dhënat e Turnit ${turnNumber} u ngarkuan!`);
    } else {
      console.log(`⚠️ No saved data for Turn ${turnNumber}`);
      setTurnData(createEmpty());
    }
    
    setTimeout(() => {
      isInitialLoad.current = false;
      console.log(`🔓 Turn ${turnNumber} auto-save enabled`);
    }, 100);
  }, [selectedDate, turnNumber, createEmpty]);

  // Auto-save on changes
  const lastSaved = useRef<string>('');
  
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    const timer = setTimeout(() => {
      // Load full data
      const savedData = StorageService.getDailyEntryData(selectedDate) || {
        turn1: createEmpty(),
        turn2: createEmpty(),
        date: selectedDate
      };
      
      // Update the correct turn
      if (turnNumber === 1) {
        savedData.turn1 = turnData;
      } else {
        savedData.turn2 = turnData;
      }
      
      const dataString = JSON.stringify(savedData);
      if (dataString !== lastSaved.current) {
        console.log(`💾 Auto-saving Turn ${turnNumber}...`);
        StorageService.setDailyEntryData(selectedDate, savedData);
        lastSaved.current = dataString;
        console.log(`✅ Turn ${turnNumber} saved!`);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [turnData, selectedDate, turnNumber, createEmpty]);

  // Update product
  const updateProduct = useCallback((product: string, field: keyof ProductData, value: number) => {
    setTurnData(prev => ({
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

  // Manual save
  const manualSave = useCallback(() => {
    const savedData = StorageService.getDailyEntryData(selectedDate) || {
      turn1: createEmpty(),
      turn2: createEmpty(),
      date: selectedDate
    };
    
    if (turnNumber === 1) {
      savedData.turn1 = turnData;
    } else {
      savedData.turn2 = turnData;
    }
    
    StorageService.setDailyEntryData(selectedDate, savedData);
    toast.success(`Turni ${turnNumber} u ruajt!`);
  }, [turnData, selectedDate, turnNumber, createEmpty]);

  return {
    turnData,
    setTurnData,
    updateProduct,
    manualSave
  };
};
