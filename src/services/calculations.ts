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
   * Formula e re (e thjeshtë, pa gjendje):
   *   StokFillim_pasardhës = StokFillim − Shiriti
   *
   * Pra:
   *   T2.stokFillim (data D) = T1.stokFillim (D) − T1.shiriti (D)
   *   T1.stokFillim (data D) = T2.stokFillim (D−1) − T2.shiriti (D−1)
   *
   * Gjendje NUK përdoret më për propagim — shërben vetëm për llogaritjen e Dif
   * (kontrolli fizik), jo për kalimin e stokut.
   *
   * KUJDES: Furnizimet tashmë janë mbledhur te StokFillim te useTurnData —
   * mos i shto sërish.
   */
  static calculateStockForNextTurn(productData: ProductData): number {
    return productData.stokFillim - productData.shiriti;
  }

  /**
   * Llogarit T2.stokFillim duke ruajtur furnizimet që janë futur **në vetë T2**.
   *
   * Formula:
   *   T2.stokFillim = (T1.stokFillim − T1.shiriti) + T2.furnizime
   *
   * Pse: kur ngarkohet faturë në T2, `updateTurn2Product` shton menjëherë delta-n
   * te `stokFillim` (që ta llogaritet drejt Dif-i). Por çdo auto-sync nga T1
   * (load ose efekt) e rivendos `stokFillim` pastër nga T1, duke **fshirë**
   * furnizimet e T2. Ky helper i ruan ato.
   *
   * @param t1Data        ProductData nga T1 (i njëjti produkt)
   * @param t2Existing    ProductData ekzistues i T2 (mund të jetë i pacaktuar)
   */
  static calculateT2StokFillim(
    t1Data: ProductData,
    t2Existing?: ProductData
  ): number {
    const base = t1Data.stokFillim - t1Data.shiriti;
    return base + (t2Existing?.furnizime || 0);
  }
}

