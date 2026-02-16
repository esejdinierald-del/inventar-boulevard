import { ProductData, TurnData } from '@/types/turn.types';

export class CalculationService {
  /**
   * Llogarit diferencën: Shiriti + Gjendje - Stok Fillim - Furnizime
   * Nëse rezultati është negativ = mungesa (pa regjistruar në banakun)
   * Nëse rezultati është pozitiv = tepricë
   */
  static calculateDif(
    stokFillim: number,
    furnizime: number,
    gjendje: number,
    shiriti: number
  ): number {
    // Invertuar: sasitë e paregjistruara dalin negative
    return shiriti + gjendje - stokFillim - furnizime;
  }

  /**
   * Llogarit diferencën e mullirit: Total Kafe - (Mulliri Perfund - Mulliri Fillim)
   * Nëse rezultati është negativ = kafe e paregjistruar
   * Nëse rezultati është pozitiv = tepricë
   */
  static calculateMulliriDif(
    fillim: number,
    perfund: number,
    totalKafe: number
  ): number {
    // Invertuar: kafeja e paregjistruar del negative
    return totalKafe - (perfund - fillim);
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
   * KUJDES: Kjo formulë nuk merr parasysh gjendjen fizike!
   * Për propagim stoku, përdor calculateStockForNextTurn()
   */
  static calculateNewStock(productData: ProductData): number {
    return productData.stokFillim + productData.furnizime - productData.shiriti;
  }

  /**
   * Llogarit stokun për turnin/ditën tjetër:
   * - Nëse gjendje > 0 (numërim fizik i bërë), përdor gjendjen
   * - Përndryshe llogarit teorikisht: stokFillim + furnizime - shiriti
   * Kjo formulë duhet përdorur GJITHMONË kur propagohet stoku
   */
  static calculateStockForNextTurn(productData: ProductData): number {
    if (productData.gjendje > 0) {
      return productData.gjendje;
    }
    // Nëse nuk ka asnjë të dhënë, kthe 0
    if (productData.stokFillim === 0 && productData.furnizime === 0) {
      return 0;
    }
    return productData.stokFillim + productData.furnizime - productData.shiriti;
  }
}
