import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Goal {
  id: string;
  title: string;
  description: string | null;
}

interface RequestBody {
  inspirationId: string;
  title: string;
  description: string;
  filePath: string | null;
  goals: Goal[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { inspirationId, title, description, filePath, goals }: RequestBody = await req.json();

    console.log(`[analyze-inspiration] Processing inspiration: ${inspirationId}`);
    console.log(`[analyze-inspiration] Title: ${title}`);
    console.log(`[analyze-inspiration] Goals count: ${goals.length}`);

    // Read file content if available
    let fileContent = "";
    if (filePath) {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("inspiration")
          .download(filePath);
        
        if (!downloadError && fileData) {
          fileContent = await fileData.text();
          // Limit content length for API
          if (fileContent.length > 10000) {
            fileContent = fileContent.substring(0, 10000) + "...[truncated]";
          }
        }
      } catch (e) {
        console.log("[analyze-inspiration] Could not read file content:", e);
      }
    }

    // Build the goals context
    const goalsContext = goals
      .map((g, i) => `${i + 1}. "${g.title}"${g.description ? ` - ${g.description}` : ""}`)
      .join("\n");

    // Build the inspiration context
    const inspirationContext = `
Title: ${title}
${description ? `Notes: ${description}` : ""}
${fileContent ? `Content:\n${fileContent}` : ""}
    `.trim();

    const systemPrompt = `You are an insight discovery AI. Your job is to find non-obvious, hidden connections between inspiration material and long-term goals.

You must:
1. Analyze the inspiration material deeply
2. Look for unexpected patterns, analogies, or transferable concepts
3. Identify which goal has the strongest connection
4. Generate a "Hidden Insight" - a non-obvious connection that the user might not have considered
5. Rate the connection strength from 1-10

Be creative and insightful. Don't state obvious connections. Find the unexpected link.`;

    const userPrompt = `Analyze this inspiration material and find its hidden connection to one of my goals.

MY GOALS:
${goalsContext}

INSPIRATION MATERIAL:
${inspirationContext}

Respond using the find_insight function.`;

    console.log("[analyze-inspiration] Calling AI Gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "find_insight",
              description: "Report the hidden insight discovered between the inspiration and a goal",
              parameters: {
                type: "object",
                properties: {
                  connected_goal_id: {
                    type: "string",
                    description: "The ID of the most relevant goal",
                  },
                  hidden_insight: {
                    type: "string",
                    description: "A concise, non-obvious insight connecting the inspiration to the goal (max 100 chars)",
                  },
                  insight_strength: {
                    type: "integer",
                    description: "How strong the connection is (1-10, where 10 is profound)",
                    minimum: 1,
                    maximum: 10,
                  },
                  summary: {
                    type: "string",
                    description: "Brief summary of the inspiration content",
                  },
                },
                required: ["connected_goal_id", "hidden_insight", "insight_strength", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "find_insight" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[analyze-inspiration] AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("[analyze-inspiration] AI Response received");

    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("[analyze-inspiration] No tool call in response");
      throw new Error("AI did not return structured output");
    }

    const insight = JSON.parse(toolCall.function.arguments);
    console.log("[analyze-inspiration] Insight extracted:", insight);

    // Validate the goal ID exists
    const validGoalId = goals.find(g => g.id === insight.connected_goal_id)?.id || null;

    // Update the inspiration with analysis results
    const { error: updateError } = await supabase
      .from("inspirations")
      .update({
        hidden_insight: insight.hidden_insight,
        connected_goal_id: validGoalId,
        insight_strength: insight.insight_strength,
        content_summary: insight.summary,
      })
      .eq("id", inspirationId);

    if (updateError) {
      console.error("[analyze-inspiration] Update error:", updateError);
      throw updateError;
    }

    console.log("[analyze-inspiration] Inspiration updated successfully");

    // If insight strength is high, trigger push notification
    if (insight.insight_strength >= 7) {
      console.log("[analyze-inspiration] Strong insight detected, triggering notification");
      
      // Get the user_id from the inspiration
      const { data: inspirationData } = await supabase
        .from("inspirations")
        .select("user_id")
        .eq("id", inspirationId)
        .single();

      if (inspirationData?.user_id) {
        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              action: "send",
              userId: inspirationData.user_id,
              title: "💡 Hidden Insight Discovered!",
              body: insight.hidden_insight,
              url: "/creativity",
            },
          });
        } catch (e) {
          console.log("[analyze-inspiration] Push notification failed:", e);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      insight: {
        hidden_insight: insight.hidden_insight,
        connected_goal_id: validGoalId,
        insight_strength: insight.insight_strength,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[analyze-inspiration] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
