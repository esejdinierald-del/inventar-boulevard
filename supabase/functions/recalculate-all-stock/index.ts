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
 * Llogarit stokun për turnin/ditën pasardhëse — pasqyron
 * `CalculationService.calculateStockForNextTurn` në klient.
 * Nëse gjendja është konfirmuar (gjendje_locks), besohet edhe gjendja = 0.
 */
function calculateStockForNextTurn(p: ProductData, gjendjeConfirmed: boolean): number {
  if (gjendjeConfirmed) return Math.max(0, p.gjendje);
  if (p.gjendje > 0) return p.gjendje;
  if (p.stokFillim === 0 && p.furnizime === 0) return 0;
  return p.stokFillim + p.furnizime - p.shiriti;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1) Auth: vetëm admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const authClient = createClient(supabaseUrl, anonKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authErr } = await authClient.auth.getClaims(token);
    const userId = claims?.claims?.sub;
    if (authErr || !userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr || isAdmin !== true) {
      return new Response(JSON.stringify({ error: "Forbidden — admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Merr të gjitha entries + locks
    const { data: entries, error: fetchError } = await admin
      .from("daily_entries")
      .select("id, entry_date, turn1_data, turn2_data")
      .order("entry_date", { ascending: true });
    if (fetchError) throw fetchError;
    if (!entries?.length) {
      return new Response(JSON.stringify({ success: true, message: "No entries found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: locks } = await admin
      .from("gjendje_locks")
      .select("entry_date, turn_number");
    const lockSet = new Set<string>(
      (locks ?? []).map((l: { entry_date: string; turn_number: number }) => `${l.entry_date}:${l.turn_number}`),
    );
    const isConfirmed = (date: string, turn: 1 | 2) => lockSet.has(`${date}:${turn}`);

    const fixes: { date: string; action: string }[] = [];
    let datesUpdated = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const prev = i > 0 ? entries[i - 1] : null;
      const t1 = entry.turn1_data as unknown as TurnData;
      const t2 = entry.turn2_data as unknown as TurnData;
      if (!t1?.products || !t2?.products) continue;

      let t1Changed = false;
      let t2Changed = false;

      // (A) T1.stokFillim nga T2 e datës paraprake (sipas gjendje_locks)
      if (prev) {
        const prevT1 = prev.turn1_data as unknown as TurnData;
        const prevT2 = prev.turn2_data as unknown as TurnData;
        const prevT2Confirmed = isConfirmed(prev.entry_date, 2);

        if (prevT2?.products) {
          for (const [name, data] of Object.entries(t1.products)) {
            const prevT2Data = prevT2.products[name];
            if (prevT2Data) {
              const expected = calculateStockForNextTurn(prevT2Data, prevT2Confirmed);
              if (data.stokFillim !== expected) {
                (t1.products[name] as ProductData).stokFillim = expected;
                t1Changed = true;
                fixes.push({ date: entry.entry_date, action: `T1.${name}.stokFillim: ${data.stokFillim} → ${expected}` });
              }
            }
          }

          const prevMulliri = prevT2.mulliriPerfund > 0 ? prevT2.mulliriPerfund : prevT1?.mulliriPerfund || 0;
          if (prevMulliri > 0 && t1.mulliriFillim !== prevMulliri) {
            fixes.push({ date: entry.entry_date, action: `T1.mulliriFillim: ${t1.mulliriFillim} → ${prevMulliri}` });
            t1.mulliriFillim = prevMulliri;
            t1Changed = true;
          }
        }
      }

      // (B) T2.stokFillim nga T1 (sipas gjendje_locks për T1)
      const t1Confirmed = isConfirmed(entry.entry_date, 1);
      for (const [name, data] of Object.entries(t2.products)) {
        const t1Data = t1.products[name];
        if (t1Data) {
          const expected = calculateStockForNextTurn(t1Data, t1Confirmed);
          if (data.stokFillim !== expected) {
            (t2.products[name] as ProductData).stokFillim = expected;
            t2Changed = true;
            fixes.push({ date: entry.entry_date, action: `T2.${name}.stokFillim: ${data.stokFillim} → ${expected}` });
          }
        }
      }

      if (t1.mulliriPerfund > 0 && t2.mulliriFillim !== t1.mulliriPerfund) {
        fixes.push({ date: entry.entry_date, action: `T2.mulliriFillim: ${t2.mulliriFillim} → ${t1.mulliriPerfund}` });
        t2.mulliriFillim = t1.mulliriPerfund;
        t2Changed = true;
      }

      // (C) Ruaj
      if (t1Changed || t2Changed) {
        datesUpdated++;
        const updateObj: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (t1Changed) updateObj.turn1_data = t1;
        if (t2Changed) updateObj.turn2_data = t2;
        const { error: updateError } = await admin
          .from("daily_entries")
          .update(updateObj)
          .eq("id", entry.id);
        if (updateError) {
          fixes.push({ date: entry.entry_date, action: `ERROR: ${updateError.message}` });
        }
      }

      // (D) next_day_stock për ditën pasardhëse
      const t2Confirmed = isConfirmed(entry.entry_date, 2);
      const nextDayStock: Record<string, number> = {};
      for (const [name, data] of Object.entries(t2.products)) {
        nextDayStock[name] = calculateStockForNextTurn(data as ProductData, t2Confirmed);
      }
      const mulliriNext = t2.mulliriPerfund > 0 ? t2.mulliriPerfund : t1.mulliriPerfund;

      const nextDate = new Date(entry.entry_date);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split("T")[0];

      const { data: existing } = await admin
        .from("next_day_stock")
        .select("id")
        .eq("stock_date", nextDateStr)
        .maybeSingle();

      if (existing) {
        await admin
          .from("next_day_stock")
          .update({ stock_data: nextDayStock, mulliri_fillim: mulliriNext, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await admin
          .from("next_day_stock")
          .insert({ stock_date: nextDateStr, stock_data: nextDayStock, mulliri_fillim: mulliriNext });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `U përpunuan ${entries.length} data, ${datesUpdated} u përditësuan, ${fixes.length} ndryshime totale`,
        datesUpdated,
        totalFixes: fixes.length,
        fixes: fixes.slice(0, 200),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
