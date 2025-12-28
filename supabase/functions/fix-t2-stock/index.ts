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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Merr të gjitha daily entries
    const { data: entries, error: fetchError } = await supabase
      .from("daily_entries")
      .select("id, entry_date, turn1_data, turn2_data")
      .order("entry_date", { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    const results: { date: string; fixed: string[]; skipped: string[] }[] = [];

    for (const entry of entries || []) {
      const turn1 = entry.turn1_data as unknown as TurnData;
      const turn2 = entry.turn2_data as unknown as TurnData;
      
      if (!turn1?.products || !turn2?.products) {
        results.push({
          date: entry.entry_date,
          fixed: [],
          skipped: ["No products data"]
        });
        continue;
      }

      const fixed: string[] = [];
      const skipped: string[] = [];
      let hasChanges = false;

      // Për çdo produkt në T2, vendos stokFillim = T1.gjendje
      const newT2Products: { [key: string]: ProductData } = {};
      
      for (const [productName, t2Data] of Object.entries(turn2.products)) {
        const t1Data = turn1.products[productName];
        
        if (t1Data) {
          const expectedStokFillim = t1Data.gjendje;
          const currentStokFillim = t2Data.stokFillim;
          
          if (currentStokFillim !== expectedStokFillim) {
            newT2Products[productName] = {
              ...t2Data,
              stokFillim: expectedStokFillim
            };
            fixed.push(`${productName}: ${currentStokFillim} → ${expectedStokFillim}`);
            hasChanges = true;
          } else {
            newT2Products[productName] = t2Data;
            skipped.push(`${productName}: OK (${currentStokFillim})`);
          }
        } else {
          newT2Products[productName] = t2Data;
          skipped.push(`${productName}: No T1 data`);
        }
      }

      if (hasChanges) {
        const newT2: TurnData = {
          ...turn2,
          products: newT2Products
        };

        const { error: updateError } = await supabase
          .from("daily_entries")
          .update({ turn2_data: newT2 })
          .eq("id", entry.id);

        if (updateError) {
          results.push({
            date: entry.entry_date,
            fixed: [],
            skipped: [`Error: ${updateError.message}`]
          });
          continue;
        }
      }

      results.push({
        date: entry.entry_date,
        fixed,
        skipped: hasChanges ? [] : skipped.slice(0, 3) // Limit skipped output
      });
    }

    const totalFixed = results.reduce((sum, r) => sum + r.fixed.length, 0);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Fixed ${totalFixed} products across ${results.filter(r => r.fixed.length > 0).length} dates`,
        details: results.filter(r => r.fixed.length > 0)
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
