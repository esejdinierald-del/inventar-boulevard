import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

if (Deno.env.get("DENO_DEPLOYMENT_ID") === undefined) {
  console.log("Running locally");
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
    const supabaseKey = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request body
    const { action, callId, tableNumber } = await req.json();

    if (action === "send_notification") {
      // In a real scenario, you would send a notification here
      // For now, we'll just log it and update the status
      console.log(`📞 Notification sent for table ${tableNumber}`);

      // Optionally update the call status to "acknowledged"
      const { error } = await supabase
        .from("waiter_calls")
        .update({ acknowledged_at: new Date().toISOString() })
        .eq("id", callId)
        .is("acknowledged_at", null);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: "Notification sent" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
