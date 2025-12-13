import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FlashcardDeck } from "@/components/FlashcardDeck";
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
  const [unit, setUnit] = useState<LearningUnit | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

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
        setFlashcards(flashcardsData || []);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load flashcards");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [unitId]);

  const handleComplete = () => {
    setCompleted(true);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
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

          {completed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2">Deck Complete!</h2>
              <p className="text-muted-foreground mb-6">
                Great job reviewing these flashcards!
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCompleted(false);
                  }}
                >
                  Study Again
                </Button>
                <Button onClick={() => navigate(`/learn/${unitId}`)}>
                  Continue Learning
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-6">
              <FlashcardDeck flashcards={flashcards} onComplete={handleComplete} />
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default FlashcardStudy;
