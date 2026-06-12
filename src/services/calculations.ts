import { ProductData, TurnData } from '@/types/turn.types';

/**
 * CalculationService — Shërbimi qendror i llogaritjeve të inventarit.
 *
 * Përmban të gjitha formulat matematikore për:
 * - Diferencat e produkteve (mungesa/tepricë)
 * - Diferencat e mullirit (grinder)
 * - Totalët e kafes dhe produkteve
 * - Propagimin e stokut ndërmjet turneve dhe ditëve
 *
 * RREGULLA KRYESORE:
 * - Dif negative = mungesa (produkte të shitura pa u regjistruar)
 * - Dif pozitive = tepricë (më shumë se sa pritej)
 * - Për propagim stoku, GJITHMONË përdor calculateStockForNextTurn()
 */
export class CalculationService {
  /**
   * Llogarit diferencën e produktit për një turn.
   *
   * Formula: Dif = Shiriti + Gjendje - StokFillim - Furnizime
   *
   * @param stokFillim - Stoku fillestar i turnit (nga turni/dita e mëparshme)
   * @param furnizime  - Sasitë e furnizuara gjatë turnit
   * @param gjendje    - Numërimi fizik në fund të turnit
   * @param shiriti    - Sasitë e regjistruara në kasë (nga skaneri)
   * @returns Diferenca: negative = mungesa, pozitive = tepricë, 0 = përputhet
   *
   * @example
   * // StokFillim=10, Furnizime=5, Gjendje=7, Shiriti=8
   * // Dif = 8 + 7 - 10 - 5 = 0 (pa diferencë)
   * calculateDif(10, 5, 7, 8) // → 0
   */
  static calculateDif(
    stokFillim: number,
    furnizime: number,
    gjendje: number,
    shiriti: number
  ): number {
    return shiriti + gjendje - stokFillim - furnizime;
  }

  /**
   * Llogarit diferencën e mullirit (grinder-it).
   *
   * Formula: Dif = TotalKafe - (MulliriPerfund - MulliriFillim)
   *
   * Krahasimi: sa kafe u shitën (sipas shiritit) vs sa bluajti mulliri.
   *
   * @param fillim    - Numri i mullirit në fillim të turnit
   * @param perfund   - Numri i mullirit në fund të turnit
   * @param totalKafe - Totali i kafeve të shitura (nga CoffeeTable)
   * @returns Diferenca: negative = kafe e paregjistruar, pozitive = tepricë
   *
   * @example
   * // Fillim=100, Perfund=150, TotalKafe=50
   * // Dif = 50 - (150 - 100) = 0
   * calculateMulliriDif(100, 150, 50) // → 0
   */
  static calculateMulliriDif(
    fillim: number,
    perfund: number,
    totalKafe: number
  ): number {
    return totalKafe - (perfund - fillim);
  }

  /**
   * Llogarit totalin e produkteve të shitura (shiriti) në një turn.
   * Përdoret për statistikat e shitjeve ditore.
   */
  static calculateTotalProducts(turn: TurnData): number {
    return Object.values(turn.products).reduce((sum, p) => sum + p.shiriti, 0);
  }

  /**
   * Llogarit totalin e kafeve të shitura në një turn.
   * Përdoret për krahasimin me mullirin.
   */
  static calculateTotalCoffee(turn: TurnData): number {
    return Object.values(turn.coffee).reduce((sum, qty) => sum + qty, 0);
  }

  /**
   * Llogarit xhiro totale nga të dy turnet.
   * Xhiro = totali monetar i shiritit.
   */
  static calculateTotalXhiro(turn1: TurnData, turn2: TurnData): number {
    return turn1.xhiro + turn2.xhiro;
  }

  /**
   * Kontrollon nëse ka diferencë != 0 në ndonjë produkt të turnit.
   * Përdoret për të shfaqur paralajmërime vizuale.
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
   * Llogarit stokun teorik: StokFillim + Furnizime - Shiriti.
   *
   * KUJDES: Nuk merr parasysh gjendjen fizike!
   * Për propagim stoku ndërmjet turneve/ditëve, përdor calculateStockForNextTurn().
   */
  static calculateNewStock(productData: ProductData): number {
    return productData.stokFillim + productData.furnizime - productData.shiriti;
  }

  /**
   * Llogarit stokun për turnin/ditën tjetër.
   *
   * Logjika:
   * - Nëse `gjendjeConfirmed === true` → BESO gjendjen e plotë (përfshi 0).
   *   Stafi e ka konfirmuar numërimin fizik, kështu 0 do të thotë "produkti mbaroi"
   *   jo "nuk u numërua".
   * - Përndryshe (fallback i vjetër, për kompatibilitet me data të vjetra pa konfirmim):
   *   - gjendje > 0 → përdor gjendjen
   *   - stokFillim=0 && furnizime=0 → kthe 0
   *   - ndryshe → llogarit teorikisht stokFillim + furnizime - shiriti
   *
   * KRITIKE: Kjo formulë duhet përdorur GJITHMONË kur propagohet stoku!
   * (në useTurnData.ts, StockPropagationService, fix-t2-stock edge function)
   */
  static calculateStockForNextTurn(productData: ProductData, gjendjeConfirmed = false): number {
    if (gjendjeConfirmed) {
      // Numërimi fizik konfirmuar — beso vlerën edhe nëse është 0
      return Math.max(0, productData.gjendje);
    }
    if (productData.gjendje > 0) {
      return productData.gjendje;
    }
    if (productData.stokFillim === 0 && productData.furnizime === 0) {
      return 0;
    }
    return productData.stokFillim + productData.furnizime - productData.shiriti;
  }
}
