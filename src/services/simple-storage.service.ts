import { TurnData, DailyEntryData } from '@/types/turn.types';

/**
 * Super simple storage service - NO complexity, JUST works
 */
export class SimpleStorageService {
  private static DAILY_KEY = 'daily_data_';
  
  static save(date: string, turn1: TurnData, turn2: TurnData): void {
    try {
      const key = this.DAILY_KEY + date;
      const data: DailyEntryData = { turn1, turn2, date };
      const json = JSON.stringify(data);
      localStorage.setItem(key, json);
      console.log('💾 SAVED:', key, 'Size:', json.length, 'chars');
    } catch (e) {
      console.error('❌ SAVE FAILED:', e);
      alert('Gabim në ruajtje! ' + e);
    }
  }
  
  static load(date: string): DailyEntryData | null {
    try {
      const key = this.DAILY_KEY + date;
      const json = localStorage.getItem(key);
      
      if (!json) {
        console.log('⚠️ NO DATA for', key);
        return null;
      }
      
      const data = JSON.parse(json) as DailyEntryData;
      console.log('✅ LOADED:', key, 'Turn1 xhiro:', data.turn1.xhiro, 'Turn2 xhiro:', data.turn2.xhiro);
      return data;
    } catch (e) {
      console.error('❌ LOAD FAILED:', e);
      return null;
    }
  }
  
  static getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.DAILY_KEY)) {
        keys.push(key);
      }
    }
    console.log('📋 Total saved dates:', keys.length);
    return keys;
  }
}
