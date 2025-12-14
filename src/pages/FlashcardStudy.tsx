import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Sparkles, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FlashcardDeck } from "@/components/FlashcardDeck";
import { useSpacedRepetition } from "@/hooks/useSpacedRepetition";
import { toast } from "sonner";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
}

interface LearningUnit {
  id: string;
  unit_title: string;
  description: string | null;
}

const FlashcardStudy = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { recordReview, getDueCards, getReviewStats } = useSpacedRepetition();
  
  const [unit, setUnit] = useState<LearningUnit | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [dueFlashcards, setDueFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [studyMode, setStudyMode] = useState<"due" | "all" | null>(null);
  const [stats, setStats] = useState({ due: 0, mastered: 0, learning: 0 });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!unitId) return;

      try {
        // Fetch learning unit
        const { data: unitData, error: unitError } = await supabase
          .from("learning_units")
          .select("id, unit_title, description")
          .eq("id", unitId)
          .single();

        if (unitError) throw unitError;
        setUnit(unitData);

        // Fetch flashcards
        const { data: flashcardsData, error: flashcardsError } = await supabase
          .from("flashcards")
          .select("*")
          .eq("learning_unit_id", unitId)
          .order("card_order", { ascending: true });

        if (flashcardsError) throw flashcardsError;
        const cards = flashcardsData || [];
        setFlashcards(cards);

        // Get due cards and stats
        if (cards.length > 0) {
          const cardIds = cards.map(c => c.id);
          const dueIds = await getDueCards(cardIds);
          const dueCards = cards.filter(c => dueIds.includes(c.id));
          setDueFlashcards(dueCards);

          const reviewStats = await getReviewStats(cardIds);
          setStats(reviewStats);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load flashcards");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [unitId, getDueCards, getReviewStats]);

  const handleRateCard = async (cardId: string, quality: number) => {
    await recordReview(cardId, quality);
  };

  const handleComplete = () => {
    setCompleted(true);
  };

  const startStudy = (mode: "due" | "all") => {
    setStudyMode(mode);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Unit not found</p>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No flashcards available for this unit</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const cardsToStudy = studyMode === "due" ? dueFlashcards : flashcards;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/flashcards")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Flashcard Mode</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">{unit.unit_title}</h1>
            {unit.description && (
              <p className="text-muted-foreground">{unit.description}</p>
            )}
          </div>

          {/* Mode Selection */}
          {!studyMode && !completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.due}</p>
                  <p className="text-xs text-muted-foreground">Due</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.learning}</p>
                  <p className="text-xs text-muted-foreground">Learning</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.mastered}</p>
                  <p className="text-xs text-muted-foreground">Mastered</p>
                </div>
              </div>

              {/* Study Options */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-semibold text-center mb-4">Choose Study Mode</h3>
                
                {dueFlashcards.length > 0 && (
                  <Button
                    className="w-full gap-2"
                    onClick={() => startStudy("due")}
                  >
                    <Clock className="w-4 h-4" />
                    Review Due Cards ({dueFlashcards.length})
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => startStudy("all")}
                >
                  <Sparkles className="w-4 h-4" />
                  Study All Cards ({flashcards.length})
                </Button>
              </div>

              {dueFlashcards.length === 0 && (
                <p className="text-center text-muted-foreground text-sm">
                  🎉 No cards due for review! Come back later or study all cards.
                </p>
              )}
            </motion.div>
          )}

          {/* Flashcard Deck */}
          {studyMode && !completed && (
            <div className="glass-card p-6">
              <FlashcardDeck 
                flashcards={cardsToStudy} 
                onComplete={handleComplete}
                onRateCard={handleRateCard}
              />
            </div>
          )}

          {/* Completion Screen */}
          {completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2">Session Complete!</h2>
              <p className="text-muted-foreground mb-6">
                Great job! Your progress has been saved using spaced repetition.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCompleted(false);
                    setStudyMode(null);
                  }}
                >
                  Study More
                </Button>
                <Button onClick={() => navigate(`/learn/${unitId}`)}>
                  Continue Learning
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default FlashcardStudy;
