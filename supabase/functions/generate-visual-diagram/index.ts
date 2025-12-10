import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { learningUnitId, userId, mindMapData, tier, sessionContentId } = await req.json();
    console.log("Generating diagram for unit:", learningUnitId, "tier:", tier);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if we already have a cached diagram for this session content
    if (sessionContentId) {
      const { data: existingContent } = await supabase
        .from("session_content")
        .select("content_payload")
        .eq("id", sessionContentId)
        .single();

      if (existingContent?.content_payload?.generatedDiagramUrl) {
        console.log("Returning cached diagram");
        return new Response(
          JSON.stringify({ imageUrl: existingContent.content_payload.generatedDiagramUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Build the prompt from mind map data
    let prompt = "Create a clean, professional educational mind map diagram. ";
    
    if (mindMapData) {
      if (mindMapData.mainTopic) {
        prompt += `Main topic at the center: "${mindMapData.mainTopic}". `;
      }
      
      if (mindMapData.branches && Array.isArray(mindMapData.branches)) {
        const branchTitles = mindMapData.branches
          .map((b: any) => b.title || b)
          .filter(Boolean)
          .join(", ");
        prompt += `Main branches extending from center: ${branchTitles}. `;
        
        // Add sub-branches if available
        mindMapData.branches.forEach((branch: any) => {
          if (branch.details && Array.isArray(branch.details)) {
            prompt += `Under "${branch.title}": ${branch.details.join(", ")}. `;
          }
        });
      }
    }

    prompt += `
Style requirements:
- Modern, minimalist design with a clean white/light gray background
- Use a central node for the main topic with bold text
- Colorful nodes for main branches (use blues, purples, teals, and oranges)
- Clear connecting lines between nodes showing hierarchy
- Rounded rectangles or circles for nodes
- Easy to read text, not too small
- Professional infographic quality
- No 3D effects, keep it flat and clean
- Include subtle shadows for depth
Ultra high resolution educational diagram.`;

    console.log("Generating image with prompt:", prompt.substring(0, 200) + "...");

    // Call Lovable AI Gateway with Gemini image model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image generated");
    }

    // Cache the generated image in session_content if we have the ID
    if (sessionContentId) {
      const { data: currentContent } = await supabase
        .from("session_content")
        .select("content_payload")
        .eq("id", sessionContentId)
        .single();

      if (currentContent) {
        const updatedPayload = {
          ...currentContent.content_payload,
          generatedDiagramUrl: imageUrl,
        };

        await supabase
          .from("session_content")
          .update({ content_payload: updatedPayload })
          .eq("id", sessionContentId);

        console.log("Cached diagram in session_content");
      }
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-visual-diagram:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
