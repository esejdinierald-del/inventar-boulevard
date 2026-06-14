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
   * Formula (e re): Dif = Shiriti + Gjendje − StokFillim
   *
   * KUJDES: Çdo Furnizim që futet shtohet AUTOMATIKISHT te StokFillim i të
   * njëjtit turn (shih useTurnData.updateTurn{1,2}Product). Prandaj formula
   * NUK e zbret më Furnizime — do të numëronte dy herë. Parametri `furnizime`
   * mbetet në signature për përputhshmëri por nuk përdoret.
   *
   * @returns Diferenca: negative = mungesa, pozitive = tepricë, 0 = përputhet
   *
   * @example
   * // StokFillim=15 (10 fillestar + 5 furnizime), Gjendje=7, Shiriti=8
   * // Dif = 8 + 7 − 15 = 0
   * calculateDif(15, 5, 7, 8) // → 0
   */
  static calculateDif(
    stokFillim: number,
    _furnizime: number,
    gjendje: number,
    shiriti: number
  ): number {
    return shiriti + gjendje - stokFillim;
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
   * Llogarit stokun teorik: StokFillim − Shiriti.
   *
   * Furnizimet tashmë janë të mbledhura te StokFillim (shih useTurnData),
   * prandaj NUK shtohen sërish këtu.
   *
   * KUJDES: Nuk merr parasysh gjendjen fizike!
   * Për propagim stoku ndërmjet turneve/ditëve, përdor calculateStockForNextTurn().
   */
  static calculateNewStock(productData: ProductData): number {
    return productData.stokFillim - productData.shiriti;
  }

  /**
   * Llogarit stokun për turnin/ditën tjetër.
   *
   * Logjika:
   * 1. Nëse gjendje > 0 → përdor gjendjen (numërim fizik i bërë)
   * 2. Nëse ka stok por pa gjendje → llogarit teorikisht (StokFillim − Shiriti)
   * 3. Nëse asnjë e dhënë → kthe 0
   *
   * KRITIKE: Furnizimet tashmë janë te StokFillim — mos i shto sërish!
   * Kjo formulë duhet përdorur GJITHMONË kur propagohet stoku
   * (në useTurnData.ts, StockPropagationService, edge functions).
   */
  static calculateStockForNextTurn(productData: ProductData): number {
    if (productData.gjendje > 0) {
      return productData.gjendje;
    }
    if (productData.stokFillim === 0) {
      return 0;
    }
    return productData.stokFillim - productData.shiriti;
  }
}
