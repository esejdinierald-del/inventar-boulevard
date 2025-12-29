import { TurnData, DailyEntryData } from '@/types/turn.types';
import { MappingData } from '@/types/mapping.types';
import { supabase } from '@/integrations/supabase/client';

export class StorageService {
  // DEPRECATED: Local storage methods (kept for migration)
  private static getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      throw error;
    }
  }

  private static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
    }
  }

  // Products (në Supabase)
  static async getProducts(): Promise<string[] | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('name')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data?.map(p => p.name) || null;
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to localStorage
      return this.getItem<string[]>('products_list');
    }
  }

  static async setProducts(products: string[]): Promise<void> {
    try {
      // Fshi të gjitha dhe ri-shto me order të ri
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.error('Error deleting products:', deleteError);
      }
      
      const productsData = products.map((name, index) => ({
        name,
        sort_order: index
      }));
      
      if (productsData.length > 0) {
        const { error } = await supabase.from('products').insert(productsData);
        if (error) throw error;
      }
      
      // Backup në localStorage
      this.setItem('products_list', products);
    } catch (error) {
      console.error('Error saving products:', error);
      // Fallback to localStorage only
      this.setItem('products_list', products);
    }
  }

  // Coffee types (në Supabase)
  static async getCoffeeTypes(): Promise<string[] | null> {
    try {
      const { data, error } = await supabase
        .from('coffee_types')
        .select('name')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data?.map(c => c.name) || null;
    } catch (error) {
      console.error('Error fetching coffee types:', error);
      // Fallback to localStorage
      return this.getItem<string[]>('coffee_types_list');
    }
  }

  static async setCoffeeTypes(coffeeTypes: string[]): Promise<void> {
    try {
      // Fshi të gjitha dhe ri-shto me order të ri
      const { error: deleteError } = await supabase
        .from('coffee_types')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.error('Error deleting coffee types:', deleteError);
      }
      
      const coffeeTypesData = coffeeTypes.map((name, index) => ({
        name,
        sort_order: index
      }));
      
      if (coffeeTypesData.length > 0) {
        const { error } = await supabase.from('coffee_types').insert(coffeeTypesData);
        if (error) throw error;
      }
      
      // Backup në localStorage
      this.setItem('coffee_types_list', coffeeTypes);
    } catch (error) {
      console.error('Error saving coffee types:', error);
      // Fallback to localStorage only
      this.setItem('coffee_types_list', coffeeTypes);
    }
  }

  // Stock for specific date (në Supabase)
  static async getStockForDate(date: string): Promise<{ [key: string]: number } | null> {
    try {
      const { data, error } = await supabase
        .from('next_day_stock')
        .select('stock_data')
        .eq('stock_date', date)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        return data.stock_data as { [key: string]: number };
      }
      
      return this.getItem<{ [key: string]: number }>(`stock_${date}`);
    } catch (error) {
      console.error('Error fetching stock:', error);
      return this.getItem<{ [key: string]: number }>(`stock_${date}`);
    }
  }

  static async setStockForDate(date: string, stock: { [key: string]: number }): Promise<void> {
    try {
      // Provo të update fillimisht
      const { data: existing } = await supabase
        .from('next_day_stock')
        .select('id')
        .eq('stock_date', date)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('next_day_stock')
          .update({
            stock_data: stock,
            updated_at: new Date().toISOString()
          })
          .eq('stock_date', date);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('next_day_stock')
          .insert({
            stock_date: date,
            stock_data: stock
          });
        
        if (error) throw error;
      }
      
      this.setItem(`stock_${date}`, stock);
    } catch (error) {
      console.error('Error saving stock:', error);
      this.setItem(`stock_${date}`, stock);
    }
  }

  // Mulliri for specific date (në Supabase)
  static async getMulliriForDate(date: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('next_day_stock')
        .select('mulliri_fillim')
        .eq('stock_date', date)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        return data.mulliri_fillim;
      }
      
      const value = this.getItem<string>(`mulliri_fillim_${date}`);
      return value ? Number(value) : null;
    } catch (error) {
      console.error('Error fetching mulliri:', error);
      const value = this.getItem<string>(`mulliri_fillim_${date}`);
      return value ? Number(value) : null;
    }
  }

  static async setMulliriForDate(date: string, value: number): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('next_day_stock')
        .select('id, stock_data')
        .eq('stock_date', date)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('next_day_stock')
          .update({
            mulliri_fillim: value,
            updated_at: new Date().toISOString()
          })
          .eq('stock_date', date);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('next_day_stock')
          .insert({
            stock_date: date,
            mulliri_fillim: value,
            stock_data: {}
          });
        
        if (error) throw error;
      }
      
      this.setItem(`mulliri_fillim_${date}`, value.toString());
    } catch (error) {
      console.error('Error saving mulliri:', error);
      this.setItem(`mulliri_fillim_${date}`, value.toString());
    }
  }

  // Product mapping (në Supabase)
  static async getProductMapping(): Promise<MappingData | null> {
    try {
      const { data, error } = await supabase
        .from('product_mappings')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const mapping: MappingData = {};
        data.forEach(item => {
          mapping[item.receipt_name] = {
            type: item.product_type as 'product' | 'coffee' | 'kitchen' | 'alcoholic_drink',
            name: item.product_name,
            quantity: item.quantity || 1
          };
        });
        return mapping;
      }
      
      // Fallback to localStorage
      const localMapping = this.getItem<any>('receipt_product_mapping');
      if (!localMapping) return null;

      const converted: MappingData = {};
      Object.entries(localMapping).forEach(([key, value]) => {
        if (typeof value === 'string') {
          converted[key] = { type: 'product', name: value, quantity: 1 };
        } else if (value && typeof value === 'object' && 'type' in value && 'name' in value) {
          converted[key] = { 
            type: value.type as 'product' | 'coffee' | 'kitchen' | 'alcoholic_drink', 
            name: value.name as string, 
            quantity: (value as any).quantity || 1 
          };
        }
      });
      return converted;
    } catch (error) {
      console.error('Error fetching product mapping:', error);
      return this.getItem<any>('receipt_product_mapping');
    }
  }

  static async setProductMapping(mapping: MappingData): Promise<void> {
    try {
      // Fshi të gjitha dhe ri-shto
      const { error: deleteError } = await supabase
        .from('product_mappings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.error('Error deleting mappings:', deleteError);
      }
      
      const mappingsData = Object.entries(mapping).map(([receiptName, value]) => ({
        receipt_name: receiptName,
        product_type: value.type,
        product_name: value.name,
        quantity: value.quantity
      }));
      
      if (mappingsData.length > 0) {
        const { error } = await supabase.from('product_mappings').insert(mappingsData);
        if (error) throw error;
      }
      
      this.setItem('receipt_product_mapping', mapping);
    } catch (error) {
      console.error('Error saving product mapping:', error);
      this.setItem('receipt_product_mapping', mapping);
    }
  }

  static async removeProductMapping(): Promise<void> {
    try {
      await supabase.from('product_mappings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      this.removeItem('receipt_product_mapping');
    } catch (error) {
      console.error('Error removing product mapping:', error);
      this.removeItem('receipt_product_mapping');
    }
  }

  // Invoice mapping (për faturat e blerjes)
  static async getInvoiceMapping(): Promise<MappingData | null> {
    try {
      const { data, error } = await supabase
        .from('invoice_mappings')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const mapping: MappingData = {};
        data.forEach(item => {
          mapping[item.invoice_name] = {
            type: item.product_type as 'product' | 'coffee' | 'kitchen' | 'alcoholic_drink',
            name: item.product_name,
            quantity: item.quantity || 1
          };
        });
        return mapping;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching invoice mapping:', error);
      return null;
    }
  }

  static async setInvoiceMapping(mapping: MappingData): Promise<void> {
    try {
      console.log('setInvoiceMapping called with:', mapping);
      
      // Fshi të gjitha dhe ri-shto
      const { error: deleteError } = await supabase
        .from('invoice_mappings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.error('Error deleting invoice mappings:', deleteError);
      }
      
      const mappingsData = Object.entries(mapping).map(([invoiceName, value]) => ({
        invoice_name: invoiceName,
        product_type: value.type,
        product_name: value.name,
        quantity: value.quantity || 1
      }));
      
      console.log('Inserting mappings:', mappingsData);
      
      if (mappingsData.length > 0) {
        const { error, data } = await supabase.from('invoice_mappings').insert(mappingsData).select();
        console.log('Insert result:', { error, data });
        if (error) throw error;
      } else {
        console.warn('No mappings to insert!');
      }
    } catch (error) {
      console.error('Error saving invoice mapping:', error);
      throw error;
    }
  }

  static async removeInvoiceMapping(): Promise<void> {
    try {
      await supabase.from('invoice_mappings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.error('Error removing invoice mapping:', error);
    }
  }

  // Daily entry data (në Supabase)
  static async getDailyEntryData(date: string): Promise<DailyEntryData | null> {
    try {
      const { data: entry, error } = await supabase
        .from('daily_entries')
        .select('entry_date, turn1_data, turn2_data')
        .eq('entry_date', date)
        .maybeSingle();
      
      if (error) throw error;
      
      if (entry && entry.turn1_data && entry.turn2_data) {
        return {
          turn1: entry.turn1_data as unknown as TurnData,
          turn2: entry.turn2_data as unknown as TurnData,
          date: entry.entry_date
        };
      }
      
      // Fallback to localStorage for migration
      return this.getItem<DailyEntryData>(`daily_entry_${date}`);
    } catch (error) {
      console.error('Error fetching daily entry:', error);
      return this.getItem<DailyEntryData>(`daily_entry_${date}`);
    }
  }

  static async setDailyEntryData(date: string, data: DailyEntryData): Promise<void> {
    try {
      // Provo të update fillimisht
      const { data: existing } = await supabase
        .from('daily_entries')
        .select('id')
        .eq('entry_date', date)
        .maybeSingle();
      
      if (existing) {
        // Nëse ekziston, bëj update
        const { error } = await supabase
          .from('daily_entries')
          .update({
            turn1_data: data.turn1 as any,
            turn2_data: data.turn2 as any,
            updated_at: new Date().toISOString()
          })
          .eq('entry_date', date);
        
        if (error) throw error;
      } else {
        // Nëse nuk ekziston, bëj insert
        const { error } = await supabase
          .from('daily_entries')
          .insert({
            entry_date: date,
            turn1_data: data.turn1 as any,
            turn2_data: data.turn2 as any
          });
        
        if (error) throw error;
      }
      
      // Backup në localStorage
      this.setItem(`daily_entry_${date}`, data);
    } catch (error) {
      console.error('Error saving daily entry:', error);
      // Fallback to localStorage only
      this.setItem(`daily_entry_${date}`, data);
      throw error;
    }
  }

  // Turn lock status (kyçja e turnit pas printimit)
  static async getTurnLockStatus(date: string): Promise<{ turn1Locked: boolean; turn2Locked: boolean; turn1LockedBy: string | null; turn2LockedBy: string | null }> {
    try {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('turn1_locked, turn2_locked, turn1_locked_by, turn2_locked_by')
        .eq('entry_date', date)
        .maybeSingle();
      
      if (error) throw error;
      
      return {
        turn1Locked: data?.turn1_locked || false,
        turn2Locked: data?.turn2_locked || false,
        turn1LockedBy: data?.turn1_locked_by || null,
        turn2LockedBy: data?.turn2_locked_by || null
      };
    } catch (error) {
      console.error('Error fetching turn lock status:', error);
      return { turn1Locked: false, turn2Locked: false, turn1LockedBy: null, turn2LockedBy: null };
    }
  }

  static async lockTurn(date: string, turnNumber: 1 | 2, lockedBy: string): Promise<boolean> {
    try {
      const lockColumn = turnNumber === 1 ? 'turn1_locked' : 'turn2_locked';
      const lockAtColumn = turnNumber === 1 ? 'turn1_locked_at' : 'turn2_locked_at';
      const lockByColumn = turnNumber === 1 ? 'turn1_locked_by' : 'turn2_locked_by';
      
      // Provo të update fillimisht
      const { data: existing } = await supabase
        .from('daily_entries')
        .select('id')
        .eq('entry_date', date)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('daily_entries')
          .update({
            [lockColumn]: true,
            [lockAtColumn]: new Date().toISOString(),
            [lockByColumn]: lockedBy,
            updated_at: new Date().toISOString()
          })
          .eq('entry_date', date);
        
        if (error) throw error;
      } else {
        // Krijo entry të ri me turn të kyçur
        const { error } = await supabase
          .from('daily_entries')
          .insert({
            entry_date: date,
            [lockColumn]: true,
            [lockAtColumn]: new Date().toISOString(),
            [lockByColumn]: lockedBy
          });
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error locking turn:', error);
      return false;
    }
  }

  static async unlockTurn(date: string, turnNumber: 1 | 2): Promise<boolean> {
    try {
      const lockColumn = turnNumber === 1 ? 'turn1_locked' : 'turn2_locked';
      const lockAtColumn = turnNumber === 1 ? 'turn1_locked_at' : 'turn2_locked_at';
      const lockByColumn = turnNumber === 1 ? 'turn1_locked_by' : 'turn2_locked_by';
      
      const { error } = await supabase
        .from('daily_entries')
        .update({
          [lockColumn]: false,
          [lockAtColumn]: null,
          [lockByColumn]: null,
          updated_at: new Date().toISOString()
        })
        .eq('entry_date', date);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unlocking turn:', error);
      return false;
    }
  }
}
