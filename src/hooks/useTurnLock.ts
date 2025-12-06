import { useState, useCallback, useEffect } from 'react';
import { StorageService } from '@/services/storage.service';
import { toast } from 'sonner';

interface TurnLockState {
  turn1Locked: boolean;
  turn2Locked: boolean;
  turn1LockedBy: string | null;
  turn2LockedBy: string | null;
}

export const useTurnLock = (selectedDate: string) => {
  const [lockState, setLockState] = useState<TurnLockState>({
    turn1Locked: false,
    turn2Locked: false,
    turn1LockedBy: null,
    turn2LockedBy: null
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load lock status when date changes
  useEffect(() => {
    const loadLockStatus = async () => {
      setIsLoading(true);
      try {
        const status = await StorageService.getTurnLockStatus(selectedDate);
        setLockState(status);
        console.log('🔒 Lock status loaded for', selectedDate, status);
      } catch (error) {
        console.error('Error loading lock status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLockStatus();
  }, [selectedDate]);

  // Lock a turn (called when printing)
  const lockTurn = useCallback(async (turnNumber: 1 | 2, staffName: string) => {
    try {
      const success = await StorageService.lockTurn(selectedDate, turnNumber, staffName);
      if (success) {
        setLockState(prev => ({
          ...prev,
          [`turn${turnNumber}Locked`]: true,
          [`turn${turnNumber}LockedBy`]: staffName
        }));
        toast.success(`🔒 Turni ${turnNumber} u kyç nga ${staffName}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error locking turn:', error);
      toast.error('Gabim gjatë kyçjes së turnit');
      return false;
    }
  }, [selectedDate]);

  // Unlock a turn (admin only)
  const unlockTurn = useCallback(async (turnNumber: 1 | 2) => {
    try {
      const success = await StorageService.unlockTurn(selectedDate, turnNumber);
      if (success) {
        setLockState(prev => ({
          ...prev,
          [`turn${turnNumber}Locked`]: false,
          [`turn${turnNumber}LockedBy`]: null
        }));
        toast.success(`🔓 Turni ${turnNumber} u zhbllokua`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unlocking turn:', error);
      toast.error('Gabim gjatë zhbllokimit të turnit');
      return false;
    }
  }, [selectedDate]);

  // Check if a specific turn is locked
  const isTurnLocked = useCallback((turnNumber: 1 | 2) => {
    return turnNumber === 1 ? lockState.turn1Locked : lockState.turn2Locked;
  }, [lockState]);

  // Get who locked a specific turn
  const getLockedBy = useCallback((turnNumber: 1 | 2) => {
    return turnNumber === 1 ? lockState.turn1LockedBy : lockState.turn2LockedBy;
  }, [lockState]);

  return {
    lockState,
    isLoading,
    lockTurn,
    unlockTurn,
    isTurnLocked,
    getLockedBy
  };
};
