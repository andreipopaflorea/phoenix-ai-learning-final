import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// SM-2 Algorithm implementation
// Quality ratings: 0 = complete blackout, 1 = incorrect, 2 = hard, 3 = good, 4 = easy

interface ReviewData {
  flashcard_id: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
}

export const useSpacedRepetition = () => {
  const { user } = useAuth();

  const calculateNextReview = (
    quality: number, // 0-4 rating
    currentInterval: number,
    currentEaseFactor: number,
    currentRepetitions: number
  ): { interval: number; easeFactor: number; repetitions: number } => {
    let newInterval: number;
    let newEaseFactor = currentEaseFactor;
    let newRepetitions = currentRepetitions;

    // SM-2 Algorithm
    if (quality < 3) {
      // Failed review - reset
      newRepetitions = 0;
      newInterval = 1;
    } else {
      // Successful review
      if (newRepetitions === 0) {
        newInterval = 1;
      } else if (newRepetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(currentInterval * currentEaseFactor);
      }
      newRepetitions++;
    }

    // Update ease factor
    newEaseFactor = Math.max(
      1.3,
      currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    return {
      interval: newInterval,
      easeFactor: newEaseFactor,
      repetitions: newRepetitions,
    };
  };

  const recordReview = useCallback(
    async (flashcardId: string, quality: number) => {
      if (!user) return;

      try {
        // Get existing review data
        const { data: existingReview } = await supabase
          .from("flashcard_reviews")
          .select("*")
          .eq("user_id", user.id)
          .eq("flashcard_id", flashcardId)
          .maybeSingle();

        const currentData: ReviewData = existingReview || {
          flashcard_id: flashcardId,
          interval_days: 1,
          ease_factor: 2.5,
          repetitions: 0,
        };

        // Calculate next review
        const { interval, easeFactor, repetitions } = calculateNextReview(
          quality,
          currentData.interval_days,
          Number(currentData.ease_factor),
          currentData.repetitions
        );

        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + interval);

        if (existingReview) {
          // Update existing review
          await supabase
            .from("flashcard_reviews")
            .update({
              interval_days: interval,
              ease_factor: easeFactor,
              repetitions: repetitions,
              next_review_at: nextReviewAt.toISOString(),
              last_reviewed_at: new Date().toISOString(),
            })
            .eq("id", existingReview.id);
        } else {
          // Insert new review
          await supabase.from("flashcard_reviews").insert({
            user_id: user.id,
            flashcard_id: flashcardId,
            interval_days: interval,
            ease_factor: easeFactor,
            repetitions: repetitions,
            next_review_at: nextReviewAt.toISOString(),
            last_reviewed_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Error recording review:", error);
      }
    },
    [user]
  );

  const getDueCards = useCallback(
    async (flashcardIds: string[]) => {
      if (!user || flashcardIds.length === 0) return flashcardIds;

      try {
        const now = new Date().toISOString();

        // Get reviews for these flashcards
        const { data: reviews } = await supabase
          .from("flashcard_reviews")
          .select("flashcard_id, next_review_at")
          .eq("user_id", user.id)
          .in("flashcard_id", flashcardIds);

        if (!reviews || reviews.length === 0) {
          // No reviews yet, all cards are due
          return flashcardIds;
        }

        const reviewMap = new Map(
          reviews.map((r) => [r.flashcard_id, r.next_review_at])
        );

        // Return cards that are due or have never been reviewed
        return flashcardIds.filter((id) => {
          const nextReview = reviewMap.get(id);
          if (!nextReview) return true; // Never reviewed
          return new Date(nextReview) <= new Date(now);
        });
      } catch (error) {
        console.error("Error getting due cards:", error);
        return flashcardIds;
      }
    },
    [user]
  );

  const getReviewStats = useCallback(
    async (flashcardIds: string[]) => {
      if (!user || flashcardIds.length === 0) {
        return { due: 0, mastered: 0, learning: 0 };
      }

      try {
        const now = new Date().toISOString();

        const { data: reviews } = await supabase
          .from("flashcard_reviews")
          .select("flashcard_id, next_review_at, repetitions")
          .eq("user_id", user.id)
          .in("flashcard_id", flashcardIds);

        if (!reviews) {
          return { due: flashcardIds.length, mastered: 0, learning: 0 };
        }

        let due = 0;
        let mastered = 0;
        let learning = 0;

        const reviewedIds = new Set(reviews.map((r) => r.flashcard_id));

        // Cards never reviewed are due
        due += flashcardIds.filter((id) => !reviewedIds.has(id)).length;

        reviews.forEach((review) => {
          if (review.repetitions >= 5) {
            mastered++;
          } else {
            learning++;
          }

          if (new Date(review.next_review_at) <= new Date(now)) {
            due++;
          }
        });

        return { due, mastered, learning };
      } catch (error) {
        console.error("Error getting review stats:", error);
        return { due: 0, mastered: 0, learning: 0 };
      }
    },
    [user]
  );

  return {
    recordReview,
    getDueCards,
    getReviewStats,
  };
};
