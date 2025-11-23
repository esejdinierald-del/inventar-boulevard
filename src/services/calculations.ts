import { ProductData, TurnData } from '@/types/turn.types';

export class CalculationService {
  /**
   * Llogarit diferencën: Stok Fillim + Furnizime - Gjendje - Shiriti
   */
  static calculateDif(
    stokFillim: number,
    furnizime: number,
    gjendje: number,
    shiriti: number
  ): number {
    return stokFillim + furnizime - gjendje - shiriti;
  }

  /**
   * Llogarit diferencën e mullirit: (Mulliri Perfund - Mulliri Fillim) - Total Kafe
   */
  static calculateMulliriDif(
    fillim: number,
    perfund: number,
    totalKafe: number
  ): number {
    return (perfund - fillim) - totalKafe;
  }

  /**
   * Llogarit totalin e produkteve të shitura në një turn
   */
  static calculateTotalProducts(turn: TurnData): number {
    return Object.values(turn.products).reduce((sum, p) => sum + p.shiriti, 0);
  }

  /**
   * Llogarit totalin e kafes në një turn
   */
  static calculateTotalCoffee(turn: TurnData): number {
    return Object.values(turn.coffee).reduce((sum, qty) => sum + qty, 0);
  }

  /**
   * Llogarit xhiro totale nga të dy turnet
   */
  static calculateTotalXhiro(turn1: TurnData, turn2: TurnData): number {
    return turn1.xhiro + turn2.xhiro;
  }

  /**
   * Kontrollon nëse ka diferenca në produktet e një turni
   */
  static hasAnyDifferences(
    products: { [key: string]: ProductData },
    calculateDif: (s: number, f: number, g: number, sh: number) => number
  ): boolean {
    return Object.values(products).some((data) => {
      const dif = calculateDif(data.stokFillim, data.furnizime, data.gjendje, data.shiriti);
      return dif !== 0;
    });
  }

  /**
   * Llogarit stokun e ri bazuar në formulën: Stok Fillim + Furnizime - Shiriti
   */
  static calculateNewStock(productData: ProductData): number {
    return productData.stokFillim + productData.furnizime - productData.shiriti;
  }
}
