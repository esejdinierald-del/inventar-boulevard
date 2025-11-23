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
            content: `Ju jeni një sistem OCR që lexon shiritat e shitjeve nga bar/restorant. 
            Detyrë juaj është të ekstraktoni të dhënat në këtë format JSON:
            {
              "items": [
                {"name": "emri i produktit", "quantity": sasia},
                ...
              ],
              "total": totali_i_xhiros
            }
            Rregullat:
            - Ekstraktoni vetëm emrin e produktit dhe sasinë (nga kolona "Sasia")
            - Gjeni dhe ekstraktoni totalin e shiritit (zakonisht në fund me etiketë "Total", "Totali", "TOTALI", etj.)
            - Totali duhet të jetë një numër (pa simbole valutore)
            - Mos përfshini çmimet individuale të produkteve
            - Emrat duhet të jenë SAKTËSISHT siç janë në shiriti
            - Sasitë duhet të jenë numra të plotë
            - Mos përfshini rreshtat e totaleve ose rreshtat që nuk janë produkte
            - Ktheni VETËM JSON-in, asnjë tekst tjetër`
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
