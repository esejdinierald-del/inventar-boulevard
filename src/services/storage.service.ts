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
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const productsData = products.map((name, index) => ({
        name,
        sort_order: index
      }));
      
      const { error } = await supabase.from('products').insert(productsData);
      if (error) throw error;
      
      // Backup në localStorage
      this.setItem('products_list', products);
    } catch (error) {
      console.error('Error saving products:', error);
      // Fallback to localStorage only
      this.setItem('products_list', products);
    }
  }

  // Coffee types
  static getCoffeeTypes(): string[] | null {
    return this.getItem<string[]>('coffee_types_list');
  }

  static setCoffeeTypes(coffeeTypes: string[]): void {
    this.setItem('coffee_types_list', coffeeTypes);
  }

  // Stock for specific date (në Supabase)
  static async getStockForDate(date: string): Promise<{ [key: string]: number } | null> {
    try {
      const { data, error } = await supabase
        .from('next_day_stock')
        .select('stock_data')
        .eq('stock_date', date)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
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
      const { error } = await supabase
        .from('next_day_stock')
        .upsert({
          stock_date: date,
          stock_data: stock
        }, {
          onConflict: 'stock_date'
        });
      
      if (error) throw error;
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
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
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
        .select('stock_data')
        .eq('stock_date', date)
        .single();
      
      const { error } = await supabase
        .from('next_day_stock')
        .upsert({
          stock_date: date,
          mulliri_fillim: value,
          stock_data: existing?.stock_data || {}
        }, {
          onConflict: 'stock_date'
        });
      
      if (error) throw error;
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
            type: item.product_type as 'product' | 'coffee',
            name: item.product_name,
            quantity: item.quantity
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
            type: value.type as 'product' | 'coffee', 
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
      await supabase.from('product_mappings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
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
      const { error } = await supabase
        .from('daily_entries')
        .upsert({
          entry_date: date,
          turn1_data: data.turn1 as any,
          turn2_data: data.turn2 as any
        });
      
      if (error) throw error;
      
      // Backup në localStorage
      this.setItem(`daily_entry_${date}`, data);
    } catch (error) {
      console.error('Error saving daily entry:', error);
      // Fallback to localStorage only
      this.setItem(`daily_entry_${date}`, data);
      throw error;
    }
  }
}
