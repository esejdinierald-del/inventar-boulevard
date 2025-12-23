export interface ProductData {
  stokFillim: number;
  gjendje: number;
  shiriti: number;
  furnizime: number;
}

export interface CoffeeData {
  [key: string]: number;
}

export interface ShpenzimiData {
  emertimi: string;
  vlera: number;
}

export interface TurnData {
  products: {
    [key: string]: ProductData;
  };
  coffee: CoffeeData;
  xhiro: number;
  mulliriFillim: number;
  mulliriPerfund: number;
  shpenzime: ShpenzimiData[];
}

export interface FurnizimeData {
  emertimi: string;
  vlera: number;
}

export interface DailyEntryData {
  turn1: TurnData;
  turn2: TurnData;
  date: string;
}
