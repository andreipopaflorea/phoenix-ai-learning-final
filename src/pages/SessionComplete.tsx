import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Home, 
  Clock, 
  BookOpen, 
  Loader2,
  Star,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const SessionComplete = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();
  const currentTier = parseInt(searchParams.get("tier") || "1");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [unitTitle, setUnitTitle] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchUnit = async () => {
      if (!unitId) return;
      const { data } = await supabase
        .from("learning_units")
        .select("unit_title")
        .eq("id", unitId)
        .single();
      if (data) setUnitTitle(data.unit_title);
    };
    fetchUnit();
  }, [unitId]);

  useEffect(() => {
    // Fire confetti on mount
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const updateProgress = async (status: string, tierCompleted: number) => {
    if (!user || !unitId) return;

    try {
      const { data: existing } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("learning_unit_id", unitId)
        .maybeSingle();

      const tierField = `tier${tierCompleted}_completed_at` as const;
      const updateData: any = {
        status,
        [tierField]: new Date().toISOString(),
      };

      if (existing) {
        await supabase
          .from("user_progress")
          .update(updateData)
          .eq("id", existing.id);
      } else {
        await supabase
          .from("user_progress")
          .insert({
            user_id: user.id,
            learning_unit_id: unitId,
            ...updateData,
          });
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleDashboard = async () => {
    setLoading(true);
    await updateProgress("complete", currentTier);
    toast.success("Session completed!");
    navigate("/dashboard");
  };

  const handleMoreTime = async (minutes: number) => {
    if (!unitId) return;
    setLoading(true);
    
    const nextTier = minutes === 10 ? 2 : 3;
    await updateProgress(nextTier === 3 ? "mastered" : "complete", currentTier);
    
    // Navigate to learn page with new tier
    navigate(`/learn/${unitId}?tier=${nextTier}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isMastered = currentTier === 3;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="fixed inset-0 bg-gradient-glow opacity-30 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-6"
        >
          {isMastered ? (
            <Trophy className="w-10 h-10 text-primary-foreground" />
          ) : (
            <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
          )}
        </motion.div>

        <h1 className="text-2xl font-bold mb-2">
          {isMastered ? "Topic Mastered! 🌟" : "Session Complete! 🎉"}
        </h1>
        
        {unitTitle && (
          <p className="text-muted-foreground mb-2">{unitTitle}</p>
        )}
        
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((tier) => (
            <Star
              key={tier}
              className={`w-6 h-6 ${
                tier <= currentTier
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        <p className="text-muted-foreground mb-8">
          {isMastered
            ? "You've completed all tiers for this topic. Great job!"
            : "Great progress! Would you like to continue learning?"}
        </p>

        <div className="space-y-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2"
            onClick={handleDashboard}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Home className="w-4 h-4" />
            )}
            Back to Dashboard
          </Button>

          {!isMastered && currentTier < 2 && (
            <Button
              variant="secondary"
              size="lg"
              className="w-full gap-2"
              onClick={() => handleMoreTime(10)}
              disabled={loading}
            >
              <Clock className="w-4 h-4" />
              I have 10 more minutes
              <span className="text-xs text-muted-foreground ml-1">(Extended Theory)</span>
            </Button>
          )}

          {!isMastered && currentTier < 3 && (
            <Button
              size="lg"
              className="w-full gap-2 bg-gradient-primary hover:opacity-90"
              onClick={() => handleMoreTime(20)}
              disabled={loading}
            >
              <BookOpen className="w-4 h-4" />
              I have 20 more minutes
              <span className="text-xs opacity-80 ml-1">(Practical Exercises)</span>
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SessionComplete;
