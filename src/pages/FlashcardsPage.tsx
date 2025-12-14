import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layers, BookOpen, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";

interface FlashcardDeck {
  id: string;
  title: string;
  courseName: string;
  cardCount: number;
  dueCount: number;
  masteredCount: number;
}

const FlashcardsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDecks = async () => {
      if (!user) return;

      try {
        // Fetch learning units that have flashcards
        const { data: units } = await supabase
          .from("learning_units")
          .select(`
            id,
            unit_title,
            system_learning_courses (title)
          `);

        if (units) {
          const decksData: FlashcardDeck[] = [];
          const now = new Date().toISOString();
          
          for (const unit of units) {
            // Get flashcards for this unit
            const { data: flashcards } = await supabase
              .from("flashcards")
              .select("id")
              .eq("learning_unit_id", unit.id);

            if (flashcards && flashcards.length > 0) {
              const cardIds = flashcards.map(f => f.id);
              
              // Get review data for these cards
              const { data: reviews } = await supabase
                .from("flashcard_reviews")
                .select("flashcard_id, next_review_at, repetitions")
                .eq("user_id", user.id)
                .in("flashcard_id", cardIds);

              let dueCount = 0;
              let masteredCount = 0;
              
              const reviewedIds = new Set(reviews?.map(r => r.flashcard_id) || []);
              
              // Cards never reviewed are due
              dueCount += cardIds.filter(id => !reviewedIds.has(id)).length;
              
              reviews?.forEach(review => {
                if (review.repetitions >= 5) {
                  masteredCount++;
                }
                if (new Date(review.next_review_at) <= new Date(now)) {
                  dueCount++;
                }
              });

              decksData.push({
                id: unit.id,
                title: unit.unit_title,
                courseName: (unit as any).system_learning_courses?.title || "Your Materials",
                cardCount: flashcards.length,
                dueCount,
                masteredCount,
              });
            }
          }

          setDecks(decksData);
        }
      } catch (error) {
        console.error("Error fetching decks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, [user]);

  const totalDue = decks.reduce((acc, d) => acc + d.dueCount, 0);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-1">Flashcards</h1>
          <p className="text-muted-foreground">
            Review and master key concepts with spaced repetition
          </p>
        </motion.div>

        {/* Summary Stats */}
        {decks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6 p-4 bg-card border border-border rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{totalDue} cards due</p>
                  <p className="text-sm text-muted-foreground">Ready for review</p>
                </div>
              </div>
              {totalDue > 0 && (
                <Button onClick={() => {
                  const deckWithDue = decks.find(d => d.dueCount > 0);
                  if (deckWithDue) navigate(`/flashcards/${deckWithDue.id}`);
                }}>
                  Start Review
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Decks Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {decks.length > 0 ? decks.map((deck, i) => {
            const masteryPercent = deck.cardCount > 0 
              ? Math.round((deck.masteredCount / deck.cardCount) * 100) 
              : 0;
            
            return (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Layers className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    {deck.dueCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                        {deck.dueCount} due
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">{deck.cardCount} cards</span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-1">{deck.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{deck.courseName}</p>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Mastered
                  </span>
                  <span className="text-sm font-medium text-primary">{masteryPercent}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full mb-4">
                  <div 
                    className="h-full bg-primary rounded-full transition-all" 
                    style={{ width: `${masteryPercent}%` }}
                  />
                </div>

                <Button 
                  className="w-full gap-2" 
                  variant={deck.dueCount > 0 ? "default" : "outline"}
                  onClick={() => navigate(`/flashcards/${deck.id}`)}
                >
                  <BookOpen className="w-4 h-4" />
                  {deck.dueCount > 0 ? "Review Now" : "Study"}
                </Button>
              </motion.div>
            );
          }) : !loading ? (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No flashcards yet</h3>
              <p className="text-muted-foreground mb-4">
                Complete lessons to unlock flashcard decks
              </p>
              <Button onClick={() => navigate("/materials")}>
                Browse Materials
              </Button>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default FlashcardsPage;
