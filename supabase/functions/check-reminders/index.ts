import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationToSend {
  userId: string;
  type: string;
  referenceId: string | null;
  title: string;
  body: string;
  url: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[check-reminders] Starting reminder check...");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const notifications: NotificationToSend[] = [];
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  try {
    // 1. Check for goal deadlines (24h and 1h warnings)
    console.log("[check-reminders] Checking goal deadlines...");
    
    const { data: goals, error: goalsError } = await supabase
      .from("goals")
      .select("id, title, deadline, user_id")
      .eq("is_completed", false)
      .not("deadline", "is", null);

    if (goalsError) {
      console.error("[check-reminders] Error fetching goals:", goalsError);
    } else if (goals) {
      for (const goal of goals) {
        const deadline = new Date(goal.deadline);
        const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Check for 24h warning
        if (hoursUntilDeadline > 23 && hoursUntilDeadline <= 24) {
          // Check if we already sent this notification
          const { data: existing } = await supabase
            .from("sent_notifications")
            .select("id")
            .eq("user_id", goal.user_id)
            .eq("notification_type", "goal_deadline_24h")
            .eq("reference_id", goal.id)
            .gte("sent_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle();

          if (!existing) {
            // Check user preferences
            const { data: prefs } = await supabase
              .from("notification_preferences")
              .select("goal_deadline_enabled, push_enabled")
              .eq("user_id", goal.user_id)
              .maybeSingle();

            if (prefs?.push_enabled && prefs?.goal_deadline_enabled) {
              notifications.push({
                userId: goal.user_id,
                type: "goal_deadline_24h",
                referenceId: goal.id,
                title: "⏰ Goal Deadline Approaching",
                body: `"${goal.title}" is due in 24 hours!`,
                url: "/goals"
              });
            }
          }
        }

        // Check for 1h warning
        if (hoursUntilDeadline > 0 && hoursUntilDeadline <= 1) {
          const { data: existing } = await supabase
            .from("sent_notifications")
            .select("id")
            .eq("user_id", goal.user_id)
            .eq("notification_type", "goal_deadline_1h")
            .eq("reference_id", goal.id)
            .gte("sent_at", new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString())
            .maybeSingle();

          if (!existing) {
            const { data: prefs } = await supabase
              .from("notification_preferences")
              .select("goal_deadline_enabled, push_enabled")
              .eq("user_id", goal.user_id)
              .maybeSingle();

            if (prefs?.push_enabled && prefs?.goal_deadline_enabled) {
              notifications.push({
                userId: goal.user_id,
                type: "goal_deadline_1h",
                referenceId: goal.id,
                title: "🚨 Goal Due Soon!",
                body: `"${goal.title}" is due in less than 1 hour!`,
                url: "/goals"
              });
            }
          }
        }
      }
    }

    // 2. Check for daily study reminders
    console.log("[check-reminders] Checking daily study reminders...");
    
    const { data: studyPrefs, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("user_id, study_reminder_time")
      .eq("push_enabled", true)
      .eq("study_reminder_enabled", true);

    if (prefsError) {
      console.error("[check-reminders] Error fetching study prefs:", prefsError);
    } else if (studyPrefs) {
      for (const pref of studyPrefs) {
        if (!pref.study_reminder_time) continue;

        const [reminderHour, reminderMinute] = pref.study_reminder_time.split(":").map(Number);
        
        // Check if current time matches reminder time (within 15-minute window)
        if (currentHour === reminderHour && currentMinute >= reminderMinute && currentMinute < reminderMinute + 15) {
          // Check if already sent today
          const todayStart = new Date(now);
          todayStart.setUTCHours(0, 0, 0, 0);
          
          const { data: existing } = await supabase
            .from("sent_notifications")
            .select("id")
            .eq("user_id", pref.user_id)
            .eq("notification_type", "daily_study_reminder")
            .gte("sent_at", todayStart.toISOString())
            .maybeSingle();

          if (!existing) {
            notifications.push({
              userId: pref.user_id,
              type: "daily_study_reminder",
              referenceId: null,
              title: "📚 Time to Study!",
              body: "Your daily study session awaits. Let's learn something new!",
              url: "/learn"
            });
          }
        }
      }
    }

    // 3. Check for flashcard reviews due
    console.log("[check-reminders] Checking flashcard reviews...");
    
    const { data: dueReviews, error: reviewsError } = await supabase
      .from("flashcard_reviews")
      .select("user_id, flashcard_id")
      .lte("next_review_at", now.toISOString());

    if (reviewsError) {
      console.error("[check-reminders] Error fetching reviews:", reviewsError);
    } else if (dueReviews && dueReviews.length > 0) {
      // Group by user
      const userReviews = dueReviews.reduce((acc: Record<string, number>, review) => {
        acc[review.user_id] = (acc[review.user_id] || 0) + 1;
        return acc;
      }, {});

      for (const [userId, count] of Object.entries(userReviews)) {
        // Only send once every 4 hours
        const { data: existing } = await supabase
          .from("sent_notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("notification_type", "flashcard_review")
          .gte("sent_at", new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString())
          .maybeSingle();

        if (!existing) {
          const { data: prefs } = await supabase
            .from("notification_preferences")
            .select("flashcard_reminder_enabled, push_enabled")
            .eq("user_id", userId)
            .maybeSingle();

          if (prefs?.push_enabled && prefs?.flashcard_reminder_enabled) {
            notifications.push({
              userId,
              type: "flashcard_review",
              referenceId: null,
              title: "🃏 Flashcards Ready for Review",
              body: `You have ${count} flashcard${count > 1 ? "s" : ""} ready for review!`,
              url: "/flashcards"
            });
          }
        }
      }
    }

    // Send all notifications
    console.log(`[check-reminders] Sending ${notifications.length} notifications...`);
    
    for (const notif of notifications) {
      try {
        // Call the send-push-notification function
        const response = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              action: "send",
              userId: notif.userId,
              title: notif.title,
              body: notif.body,
              url: notif.url,
              tag: notif.type,
            }),
          }
        );

        if (response.ok) {
          // Record sent notification
          await supabase.from("sent_notifications").insert({
            user_id: notif.userId,
            notification_type: notif.type,
            reference_id: notif.referenceId,
          });
          console.log(`[check-reminders] Sent ${notif.type} to user ${notif.userId.substring(0, 8)}...`);
        } else {
          console.error(`[check-reminders] Failed to send ${notif.type}:`, await response.text());
        }
      } catch (error) {
        console.error(`[check-reminders] Error sending notification:`, error);
      }
    }

    // Cleanup old sent_notifications (older than 7 days)
    const cleanupDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    await supabase
      .from("sent_notifications")
      .delete()
      .lt("sent_at", cleanupDate.toISOString());

    console.log(`[check-reminders] Completed. Sent ${notifications.length} notifications.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: notifications.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[check-reminders] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
