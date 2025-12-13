import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LearningStyle = "visual" | "auditory" | "reading_writing" | "kinesthetic";

const getTierPrompt = (tier: number, learningStyle: LearningStyle, unitText: string) => {
  const baseContext = `Here is the learning content:\n\n${unitText}`;
  
  const stylePrompts: Record<LearningStyle, Record<number, string>> = {
    reading_writing: {
      1: `${baseContext}

Create Tier 1 content (core learning, ~5 min) for a reading/writing learner.

Return JSON:
{
  "introduction": "A welcoming 2-3 sentence introduction to what we'll learn",
  "coreContent": "A comprehensive 300-400 word explanation of the key concepts. Use clear headings, explain terminology, and provide examples. This should be educational and thorough, not just a summary.",
  "keyTakeaways": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "summary": "A 100-150 word summary consolidating the main points",
  "flashcards": [
    { "question": "...", "answer": "..." }
  ],
  "quiz": [
    { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0 }
  ]
}

Create 5-8 flashcards and 3-5 quiz questions. Focus on making the coreContent truly educational.`,
      2: `${baseContext}

Create Tier 2 content (extended theory, +10 min) for a reading/writing learner.

Return JSON:
{
  "deepDive": "Detailed 500-600 word explanation expanding on the core concepts with advanced insights, historical context, and nuanced understanding",
  "keyTerminology": [
    { "term": "...", "definition": "..." }
  ],
  "connections": "How these concepts connect to broader topics or real-world applications (150-200 words)",
  "advancedFlashcards": [
    { "question": "...", "answer": "..." }
  ]
}

Include 8-12 key terms and 5-7 advanced flashcards.`,
      3: `${baseContext}

Create Tier 3 content (practical exercises, +20 min) for a reading/writing learner.

Return JSON:
{
  "exercises": [
    { "problem": "...", "solution": "...", "hints": ["hint1", "hint2"] }
  ],
  "realWorldExamples": ["Example 1 with detailed explanation", "Example 2 with detailed explanation"],
  "selfAssessment": [
    { "question": "Reflection question", "guideline": "How to think about this" }
  ],
  "caseStu": "A detailed case study (200-300 words) applying the concepts"
}

Create 3-5 exercises, 2-3 real-world examples, and 2-3 self-assessment questions.`
    },
    auditory: {
      1: `${baseContext}

Create Tier 1 content (core learning, ~5 min) for an auditory learner.

Return JSON:
{
  "introduction": "A warm, conversational 2-3 sentence intro as if starting a podcast",
  "script": "A conversational 500-600 word script explaining the concepts as if speaking to a friend. Use rhythm, repetition, and memorable phrases. Include dialogue-style explanations and storytelling elements. Make it engaging and educational.",
  "mnemonics": ["Mnemonic 1", "Mnemonic 2", "Mnemonic 3"],
  "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
  "summary": "A brief 2-3 sentence verbal summary to conclude"
}

Make it sound natural when read aloud. The script should teach, not just summarize.`,
      2: `${baseContext}

Create Tier 2 content (extended theory, +10 min) for an auditory learner.

Return JSON:
{
  "extendedScript": "A longer 800-1000 word conversational explanation that goes deeper into the concepts. Include analogies, storytelling, and practical examples woven into the narrative.",
  "discussionQuestions": ["Question to ponder 1", "Question 2", "Question 3"],
  "rhymes": ["Any helpful rhymes or jingles to remember key concepts"]
}`,
      3: `${baseContext}

Create Tier 3 content (practical exercises, +20 min) for an auditory learner.

Return JSON:
{
  "verbalExercises": [
    { "task": "Explain X concept out loud", "criteria": "What a good explanation includes" }
  ],
  "debateTopics": ["Topic to discuss or argue both sides"],
  "teachBackPrompts": ["Prompt for teaching this to someone else"],
  "podcastScript": "A 200-word script for a mini-podcast episode applying these concepts"
}

Create 3-4 verbal exercises, 2 debate topics, and 2-3 teach-back prompts.`
    },
    visual: {
      1: `${baseContext}

Create Tier 1 content (core learning, ~5 min) for a visual learner.

Return JSON:
{
  "introduction": "A brief 2-3 sentence overview of what we'll visualize",
  "coreExplanation": "A 200-250 word explanation of the key concepts to provide context",
  "bulletPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "mindMap": {
    "mainTopic": "Central concept",
    "branches": [
      { "title": "Branch 1", "details": ["Detail A", "Detail B"] },
      { "title": "Branch 2", "details": ["Detail A", "Detail B"] },
      { "title": "Branch 3", "details": ["Detail A", "Detail B"] }
    ]
  },
  "diagramIdeas": ["Suggestion for a diagram that would help visualize this"],
  "keyInsight": "One powerful visual metaphor or analogy to remember this concept"
}

Create 5-8 bullet points, a mind map with 3-5 branches, and 2-3 diagram ideas.`,
      2: `${baseContext}

Create Tier 2 content (extended theory, +10 min) for a visual learner.

Return JSON:
{
  "deepExplanation": "A 300-400 word explanation with visual language and metaphors",
  "detailedMindMap": {
    "mainTopic": "Central concept",
    "branches": [
      { 
        "title": "Main Branch", 
        "subBranches": [
          { "title": "Sub-topic", "details": ["Detail 1", "Detail 2"] }
        ]
      }
    ]
  },
  "flowchartSteps": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "colorCodingScheme": {
    "category1": "What this color represents",
    "category2": "What this color represents"
  },
  "visualAnalogies": ["Visual analogy 1", "Visual analogy 2"]
}`,
      3: `${baseContext}

Create Tier 3 content (practical exercises, +20 min) for a visual learner.

Return JSON:
{
  "sketchExercises": [
    { "task": "Draw or diagram X", "purpose": "What this helps understand" }
  ],
  "infographicPrompts": ["Create an infographic showing..."],
  "visualComparison": {
    "concept1": "How to visualize this",
    "concept2": "How to visualize this",
    "comparison": "How they relate visually"
  },
  "visualProject": "A hands-on visual project (150 words) to create something that represents these concepts"
}

Create 3-4 sketch exercises and 2-3 infographic prompts.`
    },
    kinesthetic: {
      1: `${baseContext}

Create Tier 1 content (core learning, ~5 min) for a kinesthetic learner.

Return JSON:
{
  "introduction": "A brief 2-3 sentence intro framing learning as doing",
  "coreExplanation": "A 200-300 word action-oriented explanation with practical examples woven in",
  "summary": "Brief action-oriented summary (100-150 words)",
  "quickActivities": [
    { "action": "Something to do physically while learning", "duration": "1-2 min", "learning": "What this teaches" }
  ],
  "realWorldConnections": ["How this applies to hands-on situations"],
  "tryItNow": "One immediate hands-on activity to apply what was learned (50-75 words)"
}

Create 3-5 quick activities and 2-3 real-world connections.`,
      2: `${baseContext}

Create Tier 2 content (extended theory, +10 min) for a kinesthetic learner.

Return JSON:
{
  "walkThrough": "Step-by-step walkthrough of concepts with actions to take (400-500 words). Frame each concept as something to DO, not just understand.",
  "simulations": [
    { "scenario": "Imagine you are...", "actions": ["What you would do"], "learning": "What this teaches" }
  ],
  "movementBreaks": ["Movement to do while processing this information"],
  "practicalDemo": "A practical demonstration or experiment to try (100-150 words)"
}

Create 2-3 simulations and 2-3 movement suggestions.`,
      3: `${baseContext}

Create Tier 3 content (practical exercises, +20 min) for a kinesthetic learner.

Return JSON:
{
  "handsonProjects": [
    { 
      "project": "Project description", 
      "materials": ["What you need"],
      "steps": ["Step 1", "Step 2", "Step 3"],
      "learningOutcome": "What this teaches"
    }
  ],
  "rolePlayScenarios": ["Scenario to act out with detailed setup"],
  "experiments": [
    { "experiment": "What to try", "observation": "What to notice", "conclusion": "What this demonstrates" }
  ],
  "realWorldChallenge": "A real-world challenge to complete (150 words) applying these concepts"
}

Create 2-3 hands-on projects, 2 role-play scenarios, and 1-2 experiments.`
    }
  };

  return stylePrompts[learningStyle][tier];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { learningUnitId, learningStyle, tier, userId } = await req.json();
    
    if (!learningUnitId || !learningStyle || !tier || !userId) {
      throw new Error("Missing required parameters");
    }

    if (tier < 1 || tier > 3) {
      throw new Error("Tier must be 1, 2, or 3");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if content already exists
    const { data: existingContent } = await supabase
      .from("session_content")
      .select("*")
      .eq("learning_unit_id", learningUnitId)
      .eq("user_id", userId)
      .eq("learning_style", learningStyle)
      .eq("tier", tier)
      .maybeSingle();

    if (existingContent) {
      console.log("Returning cached content for tier", tier);
      return new Response(JSON.stringify({ 
        success: true, 
        content: existingContent,
        cached: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the learning unit text
    const { data: unit, error: unitError } = await supabase
      .from("learning_units")
      .select("*")
      .eq("id", learningUnitId)
      .single();

    if (unitError || !unit) {
      throw new Error("Learning unit not found");
    }

    const systemPrompt = `You are an expert educational content creator. Generate learning content tailored to specific learning styles.

Respond with valid JSON only (no markdown, no code blocks).`;

    const userPrompt = getTierPrompt(tier, learningStyle as LearningStyle, unit.text);

    console.log("Generating tier", tier, "content for", learningStyle, "learner...");
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
          { role: "user", content: userPrompt },
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

    // Save to database
    const { data: savedContent, error: insertError } = await supabase
      .from("session_content")
      .insert({
        learning_unit_id: learningUnitId,
        user_id: userId,
        learning_style: learningStyle,
        tier,
        content_payload: parsedContent,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to save content: ${insertError.message}`);
    }

    console.log("Generated and saved tier", tier, "content");

    return new Response(JSON.stringify({ 
      success: true, 
      content: savedContent,
      cached: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-session-content error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
