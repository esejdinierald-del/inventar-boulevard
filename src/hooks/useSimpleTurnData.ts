import { useState, useEffect, useCallback } from 'react';
import { TurnData } from '@/types/turn.types';
import { SimpleStorageService } from '@/services/simple-storage.service';
import { toast } from 'sonner';

interface UseSimpleTurnDataProps {
  products: string[];
  coffeeTypes: string[];
  selectedDate: string;
}

export const useSimpleTurnData = ({ products, coffeeTypes, selectedDate }: UseSimpleTurnDataProps) => {
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

  const [turn1, setTurn1] = useState<TurnData>(createEmpty);
  const [turn2, setTurn2] = useState<TurnData>(createEmpty);

  // LOAD on mount/date change
  useEffect(() => {
    console.log('🔄 Loading for date:', selectedDate);
    const saved = SimpleStorageService.load(selectedDate);
    
    if (saved) {
      setTurn1(saved.turn1);
      setTurn2(saved.turn2);
      toast.success('Të dhënat u ngarkuan!');
    } else {
      setTurn1(createEmpty());
      setTurn2(createEmpty());
    }
  }, [selectedDate, createEmpty]);

  // SAVE on every change (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      SimpleStorageService.save(selectedDate, turn1, turn2);
    }, 500);
    return () => clearTimeout(timer);
  }, [turn1, turn2, selectedDate]);

  // Manual save
  const manualSave = useCallback(() => {
    SimpleStorageService.save(selectedDate, turn1, turn2);
    toast.success('Ruajtur!');
  }, [selectedDate, turn1, turn2]);

  return {
    turn1,
    turn2,
    setTurn1,
    setTurn2,
    manualSave
  };
};
