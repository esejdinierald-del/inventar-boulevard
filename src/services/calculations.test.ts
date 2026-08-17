import { describe, it, expect } from "vitest";
import { CalculationService } from "./calculations";
import { ProductData, TurnData } from "@/types/turn.types";

// =====================================================
// Unit Tests për CalculationService
// Mbulon të gjitha funksionet e llogaritjes së stokut,
// mullirit, xhiros dhe diferencave.
// =====================================================

describe("CalculationService", () => {
  // ---- calculateDif ----
  // Formula e re: Dif = Shiriti + Gjendje − StokFillim
  // Furnizime tashmë mblidhen automatikisht te StokFillim (shih useTurnData).
  describe("calculateDif", () => {
    it("kthen 0 kur shiriti + gjendje = stokFillim", () => {
      // stokFillim=15 (10 fillestar + 5 furnizime tashmë të mbledhura), gjendje=7, shiriti=8
      // 8 + 7 − 15 = 0
      expect(CalculationService.calculateDif(15, 5, 7, 8)).toBe(0);
    });

    it("kthen negative kur ka mungesa", () => {
      // stokFillim=10, gjendje=3, shiriti=5 → 5+3−10 = −2
      expect(CalculationService.calculateDif(10, 0, 3, 5)).toBe(-2);
    });

    it("kthen pozitive kur ka tepricë", () => {
      // stokFillim=10, gjendje=5, shiriti=8 → 8+5−10 = 3
      expect(CalculationService.calculateDif(10, 0, 5, 8)).toBe(3);
    });

    it("injoron parametrin furnizime (mbetet vetëm si regjistër)", () => {
      // I njëjti rezultat me ose pa furnizime
      expect(CalculationService.calculateDif(10, 0, 5, 8)).toBe(
        CalculationService.calculateDif(10, 99, 5, 8)
      );
    });

    it("trajton vlera 0", () => {
      expect(CalculationService.calculateDif(0, 0, 0, 0)).toBe(0);
    });
  });

  // ---- calculateMulliriDif ----
  describe("calculateMulliriDif", () => {
    it("kthen 0 kur totalKafe = (perfund - fillim)", () => {
      expect(CalculationService.calculateMulliriDif(100, 150, 50)).toBe(0);
    });

    it("kthen negative kur ka kafe të paregjistruar", () => {
      expect(CalculationService.calculateMulliriDif(100, 160, 50)).toBe(-10);
    });

    it("kthen pozitive kur ka tepricë kafeje", () => {
      expect(CalculationService.calculateMulliriDif(100, 130, 50)).toBe(20);
    });

    it("trajton vlera 0", () => {
      expect(CalculationService.calculateMulliriDif(0, 0, 0)).toBe(0);
    });
  });

  // ---- calculateTotalCoffee ----
  describe("calculateTotalCoffee", () => {
    it("mbledh të gjitha sasitë e kafes", () => {
      const turn: TurnData = {
        products: {},
        coffee: { "Espresso": 10, "Makiato": 5, "Kapuçino": 8 },
        xhiro: 0,
        mulliriFillim: 0,
        mulliriPerfund: 0,
        shpenzime: [],
      };
      expect(CalculationService.calculateTotalCoffee(turn)).toBe(23);
    });

    it("kthen 0 pa kafe", () => {
      const turn: TurnData = {
        products: {},
        coffee: {},
        xhiro: 0,
        mulliriFillim: 0,
        mulliriPerfund: 0,
        shpenzime: [],
      };
      expect(CalculationService.calculateTotalCoffee(turn)).toBe(0);
    });
  });

  // ---- calculateTotalProducts ----
  describe("calculateTotalProducts", () => {
    it("mbledh shiriti-n e të gjithë produkteve", () => {
      const turn: TurnData = {
        products: {
          "Koka-Kola": { stokFillim: 10, gjendje: 5, shiriti: 8, furnizime: 0 },
          "Fanta": { stokFillim: 5, gjendje: 3, shiriti: 4, furnizime: 0 },
        },
        coffee: {},
        xhiro: 0,
        mulliriFillim: 0,
        mulliriPerfund: 0,
        shpenzime: [],
      };
      expect(CalculationService.calculateTotalProducts(turn)).toBe(12);
    });
  });

  // ---- calculateTotalXhiro ----
  describe("calculateTotalXhiro", () => {
    it("mbledh xhiron e dy turneve", () => {
      const empty: TurnData = {
        products: {},
        coffee: {},
        xhiro: 0,
        mulliriFillim: 0,
        mulliriPerfund: 0,
        shpenzime: [],
      };
      const t1 = { ...empty, xhiro: 50000 };
      const t2 = { ...empty, xhiro: 45000 };
      expect(CalculationService.calculateTotalXhiro(t1, t2)).toBe(95000);
    });
  });

  // ---- calculateNewStock ----
  // Formula e re: StokFillim − Shiriti (Furnizime tashmë te StokFillim)
  describe("calculateNewStock", () => {
    it("llogarit stokFillim − shiriti", () => {
      const data: ProductData = { stokFillim: 15, furnizime: 5, shiriti: 8, gjendje: 0 };
      expect(CalculationService.calculateNewStock(data)).toBe(7);
    });

    it("mund të kthejë negative (stok i mbaruar)", () => {
      const data: ProductData = { stokFillim: 5, furnizime: 0, shiriti: 8, gjendje: 0 };
      expect(CalculationService.calculateNewStock(data)).toBe(-3);
    });
  });

  // ---- calculateStockForNextTurn ----
  // Formula e re: StokFillim − Shiriti (pa marrë parasysh gjendjen)
  describe("calculateStockForNextTurn", () => {
    it("kthen stokFillim − shiriti edhe kur gjendje > 0", () => {
      const data: ProductData = { stokFillim: 15, furnizime: 5, shiriti: 8, gjendje: 6 };
      // 15 − 8 = 7 (gjendje injorohet për propagim)
      expect(CalculationService.calculateStockForNextTurn(data)).toBe(7);
    });

    it("kthen stokFillim − shiriti kur gjendje = 0", () => {
      const data: ProductData = { stokFillim: 15, furnizime: 5, shiriti: 8, gjendje: 0 };
      expect(CalculationService.calculateStockForNextTurn(data)).toBe(7);
    });

    it("kthen 0 kur asnjë e dhënë", () => {
      const data: ProductData = { stokFillim: 0, furnizime: 0, shiriti: 0, gjendje: 0 };
      expect(CalculationService.calculateStockForNextTurn(data)).toBe(0);
    });

    it("mund të kthejë negative kur shiriti > stokFillim", () => {
      const data: ProductData = { stokFillim: 5, furnizime: 0, shiriti: 8, gjendje: 0 };
      expect(CalculationService.calculateStockForNextTurn(data)).toBe(-3);
    });
  });

  // ---- calculateT2StokFillim ----
  // Formula: (T1.stokFillim − T1.shiriti) + T2.furnizime
  describe("calculateT2StokFillim", () => {
    it("kthen T1.stokFillim − T1.shiriti kur T2 nuk ka furnizime", () => {
      const t1: ProductData = { stokFillim: 20, furnizime: 0, shiriti: 5, gjendje: 0 };
      const t2: ProductData = { stokFillim: 0, furnizime: 0, shiriti: 0, gjendje: 0 };
      expect(CalculationService.calculateT2StokFillim(t1, t2)).toBe(15);
    });

    it("shton T2.furnizime mbi bazën e T1", () => {
      const t1: ProductData = { stokFillim: 20, furnizime: 0, shiriti: 5, gjendje: 0 };
      const t2: ProductData = { stokFillim: 0, furnizime: 7, shiriti: 0, gjendje: 0 };
      // 20 − 5 + 7 = 22
      expect(CalculationService.calculateT2StokFillim(t1, t2)).toBe(22);
    });

    it("trajton T2 të pacaktuar (treats as no furnizime)", () => {
      const t1: ProductData = { stokFillim: 10, furnizime: 0, shiriti: 3, gjendje: 0 };
      expect(CalculationService.calculateT2StokFillim(t1, undefined)).toBe(7);
    });

    it("punon kur T1.shiriti = 0", () => {
      const t1: ProductData = { stokFillim: 10, furnizime: 0, shiriti: 0, gjendje: 0 };
      const t2: ProductData = { stokFillim: 0, furnizime: 3, shiriti: 0, gjendje: 0 };
      expect(CalculationService.calculateT2StokFillim(t1, t2)).toBe(13);
    });

    it("ruan furnizime edhe kur baza T1 është negative", () => {
      const t1: ProductData = { stokFillim: 5, furnizime: 0, shiriti: 8, gjendje: 0 };
      const t2: ProductData = { stokFillim: 0, furnizime: 4, shiriti: 0, gjendje: 0 };
      // 5 − 8 + 4 = 1
      expect(CalculationService.calculateT2StokFillim(t1, t2)).toBe(1);
    });
  });


  // ---- hasAnyDifferences ----
  describe("hasAnyDifferences", () => {
    it("kthen true kur ka diferenca", () => {
      const products = {
        "A": { stokFillim: 10, furnizime: 0, gjendje: 5, shiriti: 3 },
      };
      expect(
        CalculationService.hasAnyDifferences(products, CalculationService.calculateDif)
      ).toBe(true);
    });

    it("kthen false kur nuk ka diferenca", () => {
      const products = {
        "A": { stokFillim: 10, furnizime: 0, gjendje: 2, shiriti: 8 },
      };
      expect(
        CalculationService.hasAnyDifferences(products, CalculationService.calculateDif)
      ).toBe(false);
    });
  });

  // ---- calculateT1StokFillim + enforceFurnizimeInStok (rregulli i 15 Gushtit) ----
  describe("calculateT1StokFillim", () => {
    it("shton furnizimet mbi stokun e trashëguar", () => {
      const p: ProductData = { stokFillim: 47, furnizime: 264, gjendje: 0, shiriti: 0 };
      expect(CalculationService.calculateT1StokFillim(47, p)).toBe(311);
    });

    it("ruan stokFillim kur produkti s'ka stok të trashëguar", () => {
      const p: ProductData = { stokFillim: 20, furnizime: 5, gjendje: 0, shiriti: 0 };
      expect(CalculationService.calculateT1StokFillim(undefined, p)).toBe(20);
    });

    it("Dif = 0 kur gjendja përputhet pas furnizimit", () => {
      const stok = CalculationService.calculateT1StokFillim(36, {
        stokFillim: 36, furnizime: 180, gjendje: 0, shiriti: 0,
      });
      expect(CalculationService.calculateDif(stok, 180, 163, 53)).toBe(0);
    });
  });

  describe("enforceFurnizimeInStok", () => {
    it("korrigjon produktin ku furnizimet mungojnë te stokFillim", () => {
      const fixed = CalculationService.enforceFurnizimeInStok(
        { Uje: { stokFillim: 47, furnizime: 264, gjendje: 0, shiriti: 0 } },
        { Uje: 47 }
      );
      expect(fixed.Uje.stokFillim).toBe(311);
    });

    it("nuk prek produktet e sakta", () => {
      const products = { Uje: { stokFillim: 311, furnizime: 264, gjendje: 0, shiriti: 0 } };
      expect(CalculationService.enforceFurnizimeInStok(products, { Uje: 47 })).toBe(products);
    });
  });
});
