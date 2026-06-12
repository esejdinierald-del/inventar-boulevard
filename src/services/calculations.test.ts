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
  describe("calculateDif", () => {
    it("kthen 0 kur shiriti + gjendje = stokFillim + furnizime", () => {
      // stokFillim=10, furnizime=5, gjendje=7, shiriti=8
      // 8 + 7 - 10 - 5 = 0
      expect(CalculationService.calculateDif(10, 5, 7, 8)).toBe(0);
    });

    it("kthen negative kur ka mungesa (produkte të pashitura në shiriti)", () => {
      // stokFillim=10, furnizime=0, gjendje=3, shiriti=5
      // 5 + 3 - 10 - 0 = -2 (2 copa mungojnë)
      expect(CalculationService.calculateDif(10, 0, 3, 5)).toBe(-2);
    });

    it("kthen pozitive kur ka tepricë", () => {
      // stokFillim=10, furnizime=0, gjendje=5, shiriti=8
      // 8 + 5 - 10 - 0 = 3 (3 copa tepricë)
      expect(CalculationService.calculateDif(10, 0, 5, 8)).toBe(3);
    });

    it("trajton furnizime korrektësisht", () => {
      // stokFillim=5, furnizime=10, gjendje=7, shiriti=8
      // 8 + 7 - 5 - 10 = 0
      expect(CalculationService.calculateDif(5, 10, 7, 8)).toBe(0);
    });

    it("trajton vlera 0 për të gjitha fushat", () => {
      expect(CalculationService.calculateDif(0, 0, 0, 0)).toBe(0);
    });
  });

  // ---- calculateMulliriDif ----
  describe("calculateMulliriDif", () => {
    it("kthen 0 kur totalKafe = (perfund - fillim)", () => {
      // fillim=100, perfund=150, totalKafe=50
      // 50 - (150 - 100) = 0
      expect(CalculationService.calculateMulliriDif(100, 150, 50)).toBe(0);
    });

    it("kthen negative kur ka kafe të paregjistruar", () => {
      // fillim=100, perfund=160, totalKafe=50
      // 50 - (160 - 100) = -10
      expect(CalculationService.calculateMulliriDif(100, 160, 50)).toBe(-10);
    });

    it("kthen pozitive kur ka tepricë kafeje", () => {
      // fillim=100, perfund=130, totalKafe=50
      // 50 - (130 - 100) = 20
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
  describe("calculateNewStock", () => {
    it("llogarit stokFillim + furnizime - shiriti", () => {
      const data: ProductData = { stokFillim: 10, furnizime: 5, shiriti: 8, gjendje: 0 };
      expect(CalculationService.calculateNewStock(data)).toBe(7);
    });

    it("mund të kthejë negative (stok i mbaruar)", () => {
      const data: ProductData = { stokFillim: 5, furnizime: 0, shiriti: 8, gjendje: 0 };
      expect(CalculationService.calculateNewStock(data)).toBe(-3);
    });
  });

  // ---- calculateStockForNextTurn ----
  describe("calculateStockForNextTurn", () => {
    it("përdor gjendjen kur > 0 (numërim fizik)", () => {
      const data: ProductData = { stokFillim: 10, furnizime: 5, shiriti: 8, gjendje: 6 };
      expect(CalculationService.calculateStockForNextTurn(data)).toBe(6);
    });

    it("llogarit teorikisht kur gjendje = 0", () => {
      const data: ProductData = { stokFillim: 10, furnizime: 5, shiriti: 8, gjendje: 0 };
      // 10 + 5 - 8 = 7
      expect(CalculationService.calculateStockForNextTurn(data)).toBe(7);
    });

    it("kthen 0 kur asnjë e dhënë", () => {
      const data: ProductData = { stokFillim: 0, furnizime: 0, shiriti: 0, gjendje: 0 };
      expect(CalculationService.calculateStockForNextTurn(data)).toBe(0);
    });

    it("BESON gjendje=0 kur gjendjeConfirmed=true (produkti mbaroi)", () => {
      const data: ProductData = { stokFillim: 10, furnizime: 5, shiriti: 8, gjendje: 0 };
      // pa konfirmim: teorik 7
      expect(CalculationService.calculateStockForNextTurn(data, false)).toBe(7);
      // me konfirmim: numërim fizik 0
      expect(CalculationService.calculateStockForNextTurn(data, true)).toBe(0);
    });

    it("përdor gjendjen e konfirmuar edhe kur > 0", () => {
      const data: ProductData = { stokFillim: 10, furnizime: 5, shiriti: 8, gjendje: 6 };
      expect(CalculationService.calculateStockForNextTurn(data, true)).toBe(6);
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
});
