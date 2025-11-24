import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error("No image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing invoice with Lovable AI...");

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
            role: "user",
            content: [
              {
                type: "text",
                text: `Analizoni këtë faturë dhe ekstraktoni këto të dhëna në format JSON:
                
                {
                  "date": "YYYY-MM-DD" (data e faturës),
                  "items": [
                    {
                      "name": "emri i produktit",
                      "quantity": numri (nëse ka),
                      "price": çmimi total për atë produkt (në lekë)
                    }
                  ],
                  "total": totali i faturës (në lekë)
                }
                
                RREGULLAT:
                - Nëse data nuk është e qartë, përdor datën e sotme
                - Nëse nuk ka sasi specifike, vendos quantity = 1
                - Çmimet duhen të jenë në lekë (ALL)
                - Përfshini VETËM produktet që shihni qartë
                - Nëse fatura është e paqartë, ktheni një array bosh për items
                
                Ktheni VETËM JSON, pa tekst shtesë.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse, null, 2));

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Extract JSON from response (might be wrapped in markdown code blocks)
    let jsonText = content;
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsedData = JSON.parse(jsonText);
    console.log("Parsed invoice data:", parsedData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: parsedData 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error analyzing invoice:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});