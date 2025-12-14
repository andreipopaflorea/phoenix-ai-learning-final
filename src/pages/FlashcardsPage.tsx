import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layers, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";

interface FlashcardDeck {
  id: string;
  title: string;
  courseName: string;
  cardCount: number;
  mastered: number;
}

const FlashcardsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);

  useEffect(() => {
    const fetchDecks = async () => {
      if (!user) return;

      // Fetch learning units that have flashcards
      const { data: units } = await supabase
        .from("learning_units")
        .select(`
          id,
          unit_title,
          system_learning_courses (title)
        `);

      if (units) {
        // Fetch flashcard counts for each unit
        const decksData: FlashcardDeck[] = [];
        
        for (const unit of units) {
          const { count } = await supabase
            .from("flashcards")
            .select("*", { count: "exact", head: true })
            .eq("learning_unit_id", unit.id);

          if (count && count > 0) {
            decksData.push({
              id: unit.id,
              title: unit.unit_title,
              courseName: (unit as any).system_learning_courses?.title || "Your Materials",
              cardCount: count,
              mastered: Math.floor(count * Math.random()), // Placeholder
            });
          }
        }

        setDecks(decksData);
      }
    };

    fetchDecks();
  }, [user]);

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
            Review and master key concepts
          </p>
        </motion.div>

        {/* Decks Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {decks.length > 0 ? decks.map((deck, i) => {
            const masteryPercent = Math.round((deck.mastered / deck.cardCount) * 100);
            
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
                  <span className="text-sm text-muted-foreground">{deck.cardCount} cards</span>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-1">{deck.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{deck.courseName}</p>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Mastered</span>
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
                  variant="outline"
                  onClick={() => navigate(`/flashcards/${deck.id}`)}
                >
                  <BookOpen className="w-4 h-4" />
                  Study Now
                </Button>
              </motion.div>
            );
          }) : (
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
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default FlashcardsPage;
