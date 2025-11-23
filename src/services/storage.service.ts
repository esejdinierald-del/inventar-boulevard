import { TurnData, DailyEntryData } from '@/types/turn.types';
import { MappingData } from '@/types/mapping.types';

export class StorageService {
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
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
  }

  private static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
    }
  }

  // Products
  static getProducts(): string[] | null {
    return this.getItem<string[]>('products_list');
  }

  static setProducts(products: string[]): void {
    this.setItem('products_list', products);
  }

  // Coffee types
  static getCoffeeTypes(): string[] | null {
    return this.getItem<string[]>('coffee_types_list');
  }

  static setCoffeeTypes(coffeeTypes: string[]): void {
    this.setItem('coffee_types_list', coffeeTypes);
  }

  // Stock for specific date
  static getStockForDate(date: string): { [key: string]: number } | null {
    return this.getItem<{ [key: string]: number }>(`stock_${date}`);
  }

  static setStockForDate(date: string, stock: { [key: string]: number }): void {
    this.setItem(`stock_${date}`, stock);
  }

  // Mulliri for specific date
  static getMulliriForDate(date: string): number | null {
    const value = this.getItem<string>(`mulliri_fillim_${date}`);
    return value ? Number(value) : null;
  }

  static setMulliriForDate(date: string, value: number): void {
    this.setItem(`mulliri_fillim_${date}`, value.toString());
  }

  // Product mapping
  static getProductMapping(): MappingData | null {
    const mapping = this.getItem<any>('receipt_product_mapping');
    if (!mapping) return null;

    // Convert old format to new format if needed
    const converted: MappingData = {};
    Object.entries(mapping).forEach(([key, value]) => {
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
  }

  static setProductMapping(mapping: MappingData): void {
    this.setItem('receipt_product_mapping', mapping);
  }

  static removeProductMapping(): void {
    this.removeItem('receipt_product_mapping');
  }

  // Daily entry data
  static getDailyEntryData(date: string): DailyEntryData | null {
    return this.getItem<DailyEntryData>(`daily_entry_${date}`);
  }

  static setDailyEntryData(date: string, data: DailyEntryData): void {
    this.setItem(`daily_entry_${date}`, data);
  }
}
