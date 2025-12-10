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
    const { studyMaterialId, filePath, userId } = await req.json();
    
    if (!studyMaterialId || !filePath || !userId) {
      throw new Error("Missing required parameters: studyMaterialId, filePath, userId");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download PDF from storage
    console.log("Downloading PDF from storage:", filePath);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("study-materials")
      .download(filePath);

    if (downloadError) {
      console.error("Download error:", downloadError);
      throw new Error(`Failed to download PDF: ${downloadError.message}`);
    }

    // Convert PDF to base64 for Gemini's vision capability
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Pdf = btoa(binaryString);
    
    console.log("PDF downloaded, size:", arrayBuffer.byteLength, "bytes");

    const systemPrompt = `You are an expert educational content analyzer. Your task is to analyze PDF documents and break them into logical learning units.

Respond with valid JSON only (no markdown, no code blocks).`;

    const userPrompt = `Analyze this PDF document and break it into logical learning units.

Create a JSON response with this exact structure:
{
  "units": [
    {
      "unitTitle": "Clear, descriptive title for this section",
      "description": "Brief 1-2 sentence description of what this unit covers",
      "text": "The full extracted text content for this learning unit",
      "estimatedMinutes": 5
    }
  ]
}

Guidelines:
- Break the document into 3-10 logical learning units
- Each unit should cover a coherent topic or concept
- Estimate reading/learning time based on content complexity (5-15 minutes typical)
- Extract the actual text content, not just summaries
- Maintain the logical order from the document`;

    console.log("Calling Lovable AI Gateway to chunk PDF...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: userPrompt },
              { 
                type: "image_url", 
                image_url: { 
                  url: `data:application/pdf;base64,${base64Pdf}` 
                } 
              }
            ]
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content received from AI");
    }

    console.log("AI response received, parsing...");

    // Parse the JSON response
    let parsedContent;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      parsedContent = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    const { units } = parsedContent;

    if (!units || !Array.isArray(units)) {
      throw new Error("Invalid response structure from AI");
    }

    // Save learning units to database
    const learningUnits = units.map((unit: any, index: number) => ({
      study_material_id: studyMaterialId,
      user_id: userId,
      unit_title: unit.unitTitle,
      description: unit.description || null,
      text: unit.text,
      estimated_minutes: unit.estimatedMinutes || 5,
      unit_order: index + 1,
    }));

    const { data: savedUnits, error: insertError } = await supabase
      .from("learning_units")
      .insert(learningUnits)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to save learning units: ${insertError.message}`);
    }

    console.log("Saved", savedUnits.length, "learning units");

    return new Response(JSON.stringify({ 
      success: true, 
      units: savedUnits,
      count: savedUnits.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("chunk-pdf error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
