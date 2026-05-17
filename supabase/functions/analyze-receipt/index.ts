import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing receipt image with AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Ju jeni një sistem OCR specialist për shiritat e shitjeve nga bar/restorant shqiptar.
            Detyra: ekstraktoni produktet dhe totalin në format JSON:
            {
              "items": [{"name": "emri pastruar", "quantity": numri}, ...],
              "total": totali_xhiro_si_numer
            }

            RREGULLA TË RREPTA:
            1. EMRAT: 
               - Pastroni hapësira të dyfishta dhe karaktere parazitare (*, ., :, #, numra serish/kodesh në fillim)
               - P.sh. "01. DUVEL BELGIU *" → "DUVEL BELGIU"
               - Nëse emri vazhdon në rresht tjetër, bashkojini në një emër të vetëm
               - Ruani diakritikët shqip (ë, ç) saktë
               - Mos shtoni asgjë që nuk është në shiriti
            2. SASIA:
               - Nga kolona "Sasia" / "Cope" / "Qty" — duhet numër (mund të jetë decimal për 0.5 etj.)
               - Nëse shihet "x2", "2x", merrni 2
            3. ÇFARË TË INJORONI:
               - Rreshtat me "Total", "Totali", "Subtotal", "TVSH", "Tatim", "Tax", "Skonto", "Discount", "Cash", "Card"
               - Rreshtat e header-it (datë, kohë, kasier, NIPT, adresë)
               - Rreshtat bosh ose separatorë (---, ===)
               - Çmimet individuale të produkteve (vetëm sasia interesa)
            4. TOTALI: numri ngjitur me "Total"/"Totali"/"TOTALI" në fund. Pa simbole valutore.
            5. FORMAT: vetëm JSON i pastër, pa shpjegime, pa markdown.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Lexo këtë shiriti shitjesh dhe kthe të dhënat në formatin e kërkuar JSON."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse));
    
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Extract JSON from the response (it might be wrapped in markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsedData = JSON.parse(jsonStr);
    console.log("Parsed receipt data:", parsedData);

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing receipt:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to analyze receipt" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
