import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LessonContent {
  title: string;
  content: string;
  activity?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studyMaterialId, filePath, learningStyle } = await req.json();
    
    if (!studyMaterialId || !filePath || !learningStyle) {
      throw new Error("Missing required parameters");
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
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    console.log("PDF downloaded, size:", arrayBuffer.byteLength, "bytes");

    // Build learning style specific instructions
    const styleInstructions: Record<string, string> = {
      visual: `For VISUAL learners:
- Include descriptions of diagrams, flowcharts, or mind maps that could represent the concepts
- Use spatial metaphors and visual analogies
- Suggest color-coding schemes for key concepts
- Reference how concepts connect visually`,
      auditory: `For AUDITORY learners:
- Write in a conversational, spoken tone
- Include mnemonics and rhymes where helpful
- Suggest sections to read aloud
- Use rhythm and patterns in explanations`,
      reading_writing: `For READING/WRITING learners:
- Use bullet points and numbered lists
- Include key definitions and terminology
- Provide note-taking prompts
- Focus on clear, written explanations`,
      kinesthetic: `For KINESTHETIC learners:
- Include hands-on activities and exercises
- Relate concepts to real-world applications
- Suggest physical movements or actions to remember concepts
- Provide practice problems or experiments`
    };

    const systemPrompt = `You are an expert educational content creator. Your task is to analyze the PDF document and transform it into effective micro-lessons.

${styleInstructions[learningStyle] || styleInstructions.visual}

Respond with valid JSON only (no markdown, no code blocks).`;

    const userPrompt = `Analyze this PDF document and create micro-lessons from it.

Create a JSON response with this exact structure:
{
  "summary": "A concise 2-3 sentence summary of the main topics covered",
  "lessons": [
    {
      "title": "Lesson title",
      "content": "Main lesson content (2-3 paragraphs)",
      "activity": "A suggested activity or exercise for this lesson"
    }
  ]
}

Create 5-7 micro-lessons that break down the key concepts. Each lesson should be self-contained and build upon previous ones.`;

    console.log("Calling Lovable AI Gateway with PDF...");
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

    // Parse the JSON response (handle potential markdown code blocks)
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

    const { summary, lessons } = parsedContent;

    if (!summary || !lessons || !Array.isArray(lessons)) {
      throw new Error("Invalid response structure from AI");
    }

    console.log("Generated", lessons.length, "lessons");

    return new Response(JSON.stringify({ summary, lessons }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("process-pdf error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
