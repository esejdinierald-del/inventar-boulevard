import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProductData {
  stokFillim: number;
  gjendje: number;
  shiriti: number;
  furnizime: number;
}

interface TurnData {
  products: { [key: string]: ProductData };
  coffee: { [key: string]: number };
  xhiro: number;
  mulliriFillim: number;
  mulliriPerfund: number;
  shpenzime: { emertimi: string; vlera: number }[];
}

/**
 * Llogarit stokun e propaguar për turnin/ditën tjetër:
 * stokFillim + furnizime - shiriti
 */
function calculatePropagatedStock(p: ProductData): number {
  return p.stokFillim + p.furnizime - p.shiriti;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Merr të gjitha daily entries sipas datës
    const { data: entries, error: fetchError } = await supabase
      .from("daily_entries")
      .select("id, entry_date, turn1_data, turn2_data")
      .order("entry_date", { ascending: true });

    if (fetchError) throw fetchError;
    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No entries found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fixes: { date: string; action: string }[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const prevEntry = i > 0 ? entries[i - 1] : null;
      const t1 = entry.turn1_data as unknown as TurnData;
      const t2 = entry.turn2_data as unknown as TurnData;

      if (!t1?.products || !t2?.products) continue;

      let t1Changed = false;
      let t2Changed = false;

      // 1. Nëse ka datë paraprake, përditëso T1.stokFillim nga T2 e datës paraprake
      if (prevEntry) {
        const prevT2 = prevEntry.turn2_data as unknown as TurnData;
        const prevT1 = prevEntry.turn1_data as unknown as TurnData;
        if (prevT2?.products) {
          for (const [name, data] of Object.entries(t1.products)) {
            const prevT2Data = prevT2.products[name];
            if (prevT2Data) {
              const expectedStock = calculatePropagatedStock(prevT2Data);
              if (data.stokFillim !== expectedStock) {
                (t1.products[name] as ProductData).stokFillim = expectedStock;
                t1Changed = true;
                fixes.push({ date: entry.entry_date, action: `T1.${name}.stokFillim: ${data.stokFillim} → ${expectedStock}` });
              }
            }
          }

          // Mulliri T1
          const prevMulliri = prevT2.mulliriPerfund > 0 ? prevT2.mulliriPerfund : prevT1?.mulliriPerfund || 0;
          if (prevMulliri > 0 && t1.mulliriFillim !== prevMulliri) {
            fixes.push({ date: entry.entry_date, action: `T1.mulliriFillim: ${t1.mulliriFillim} → ${prevMulliri}` });
            t1.mulliriFillim = prevMulliri;
            t1Changed = true;
          }
        }
      }

      // 2. Përditëso T2.stokFillim nga T1 me formulën stokFillim + furnizime - shiriti
      for (const [name, data] of Object.entries(t2.products)) {
        const t1Data = t1.products[name];
        if (t1Data) {
          const expectedStock = calculatePropagatedStock(t1Data);
          if (data.stokFillim !== expectedStock) {
            (t2.products[name] as ProductData).stokFillim = expectedStock;
            t2Changed = true;
            fixes.push({ date: entry.entry_date, action: `T2.${name}.stokFillim: ${data.stokFillim} → ${expectedStock}` });
          }
        }
      }

      // T2 mulliriFillim = T1 mulliriPerfund
      if (t1.mulliriPerfund > 0 && t2.mulliriFillim !== t1.mulliriPerfund) {
        fixes.push({ date: entry.entry_date, action: `T2.mulliriFillim: ${t2.mulliriFillim} → ${t1.mulliriPerfund}` });
        t2.mulliriFillim = t1.mulliriPerfund;
        t2Changed = true;
      }

      // Ruaj ndryshimet
      if (t1Changed || t2Changed) {
        const updateObj: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (t1Changed) updateObj.turn1_data = t1;
        if (t2Changed) updateObj.turn2_data = t2;

        const { error: updateError } = await supabase
          .from("daily_entries")
          .update(updateObj)
          .eq("id", entry.id);

        if (updateError) {
          fixes.push({ date: entry.entry_date, action: `ERROR: ${updateError.message}` });
        }
      }

      // 3. Përditëso next_day_stock për ditën tjetër
      const nextDayStock: Record<string, number> = {};
      for (const [name, data] of Object.entries(t2.products)) {
        nextDayStock[name] = calculatePropagatedStock(data as ProductData);
      }
      const mulliriNext = t2.mulliriPerfund > 0 ? t2.mulliriPerfund : t1.mulliriPerfund;

      const nextDate = new Date(entry.entry_date);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split("T")[0];

      const { data: existing } = await supabase
        .from("next_day_stock")
        .select("id")
        .eq("stock_date", nextDateStr)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("next_day_stock")
          .update({ stock_data: nextDayStock, mulliri_fillim: mulliriNext, updated_at: new Date().toISOString() })
          .eq("stock_date", nextDateStr);
      } else {
        await supabase
          .from("next_day_stock")
          .insert({ stock_date: nextDateStr, stock_data: nextDayStock, mulliri_fillim: mulliriNext });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${entries.length} dates, ${fixes.length} fixes applied`,
        fixes: fixes.slice(0, 200), // Limit output
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
