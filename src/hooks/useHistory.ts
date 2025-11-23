import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TurnData } from '@/types/turn.types';
import { toast } from 'sonner';

export interface HistoryEntry {
  id: string;
  entry_date: string;
  turn_number: number;
  data: TurnData;
  action_type: string | null;
  created_at: string;
}

interface HistoryDbRow {
  id: string;
  entry_date: string;
  turn_number: number;
  data: unknown;
  action_type: string | null;
  created_at: string;
}

export const useHistory = () => {
  const saveToHistory = useCallback(async (
    entryDate: string,
    turnNumber: 1 | 2,
    turnData: TurnData,
    actionType?: string
  ) => {
    try {
      const { error } = await supabase
        .from('daily_entry_history')
        .insert({
          entry_date: entryDate,
          turn_number: turnNumber,
          data: turnData as any,
          action_type: actionType || 'auto_save'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }, []);

  const getHistory = useCallback(async (
    entryDate: string,
    turnNumber?: 1 | 2,
    limit: number = 50
  ): Promise<HistoryEntry[]> => {
    try {
      let query = supabase
        .from('daily_entry_history')
        .select('*')
        .eq('entry_date', entryDate)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (turnNumber) {
        query = query.eq('turn_number', turnNumber);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map((row: HistoryDbRow) => ({
        ...row,
        data: row.data as TurnData
      }));
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Gabim në ngarkimin e historikut');
      return [];
    }
  }, []);

  const restoreFromHistory = useCallback(async (historyId: string): Promise<TurnData | null> => {
    try {
      const { data, error } = await supabase
        .from('daily_entry_history')
        .select('data')
        .eq('id', historyId)
        .single();

      if (error) throw error;
      return (data.data as unknown) as TurnData;
    } catch (error) {
      console.error('Error restoring from history:', error);
      toast.error('Gabim në rikthimin e të dhënave');
      return null;
    }
  }, []);

  return {
    saveToHistory,
    getHistory,
    restoreFromHistory
  };
};
