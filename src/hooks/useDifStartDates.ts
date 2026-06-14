import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalculationService } from "@/services/calculations";
import { ProductData } from "@/types/turn.types";

/**
 * useDifStartDates — për çdo produkt kthen datën (YYYY-MM-DD) ku ka filluar
 * gabimi me Dif, duke ecur prapa nga `currentDate` deri max `lookbackDays`.
 *
 * Logjika:
 *  - Për çdo ditë llogarit Dif total ditor = Dif(T1) + Dif(T2)
 *    (Dif = shiriti + gjendje − stokFillim).
 *  - Gjen datën më të fundit ku Dif total ditor = 0 (produkti në rregull).
 *  - "Dif fillon" = data e parë pas saj me Dif ≠ 0 në seri të pandërprerë
 *    deri te `currentDate`.
 *  - Nëse Dif i `currentDate` = 0  → null (UI shfaq "—").
 *  - Nëse asnjë ditë me Dif=0 brenda dritares → "out_of_range".
 */
export type DifStart = string | null | "out_of_range";

const LOOKBACK_DAYS = 30;

const toIso = (d: Date) => d.toISOString().slice(0, 10);

const safeProduct = (raw: unknown): ProductData => {
  const p = (raw ?? {}) as Partial<ProductData>;
  return {
    stokFillim: Number(p.stokFillim) || 0,
    gjendje: Number(p.gjendje) || 0,
    shiriti: Number(p.shiriti) || 0,
    furnizime: Number(p.furnizime) || 0,
  };
};

export const useDifStartDates = (products: string[], currentDate: string) => {
  const [map, setMap] = useState<Record<string, DifStart>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentDate || products.length === 0) {
      setMap({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const end = new Date(currentDate + "T00:00:00");
        const start = new Date(end);
        start.setDate(start.getDate() - (LOOKBACK_DAYS - 1));
        const { data, error } = await supabase
          .from("daily_entries")
          .select("entry_date, turn1_data, turn2_data")
          .gte("entry_date", toIso(start))
          .lte("entry_date", toIso(end))
          .order("entry_date", { ascending: false });
        if (error) throw error;
        if (cancelled) return;

        const rows = data ?? [];
        const result: Record<string, DifStart> = {};

        for (const product of products) {
          // ecim nga më e reja (rows[0]) drejt më të vjetrës
          let lastErrorDate: string | null = null;
          let foundZero = false;
          let currentDayHasError = false;

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i] as { entry_date: string; turn1_data: any; turn2_data: any };
            const t1 = safeProduct(row.turn1_data?.products?.[product]);
            const t2 = safeProduct(row.turn2_data?.products?.[product]);
            const dif1 = CalculationService.calculateDif(t1.stokFillim, t1.furnizime, t1.gjendje, t1.shiriti);
            const dif2 = CalculationService.calculateDif(t2.stokFillim, t2.furnizime, t2.gjendje, t2.shiriti);
            const daily = dif1 + dif2;

            if (i === 0) {
              currentDayHasError = daily !== 0;
              if (currentDayHasError) lastErrorDate = row.entry_date;
              continue;
            }
            if (!currentDayHasError) break;

            if (daily === 0) {
              foundZero = true;
              break;
            }
            lastErrorDate = row.entry_date;
          }

          if (!currentDayHasError) {
            result[product] = null;
          } else if (foundZero) {
            result[product] = lastErrorDate;
          } else {
            result[product] = "out_of_range";
          }
        }

        if (!cancelled) setMap(result);
      } catch (e) {
        console.error("useDifStartDates error", e);
        if (!cancelled) setMap({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [products.join("|"), currentDate]);

  return { difStartDates: map, loading };
};

/** Formaton një vlerë DifStart për UI: "dd/MM", "—", ose ">30d". */
export const formatDifStart = (v: DifStart | undefined): string => {
  if (v === undefined || v === null) return "—";
  if (v === "out_of_range") return `>${LOOKBACK_DAYS}d`;
  const [, m, d] = v.split("-");
  return `${d}/${m}`;
};
