import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  ArrowRight, 
  Star, 
  Upload, 
  BookOpen,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LearningStyleSelector, type LearningStyle } from "@/components/LearningStyleSelector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OnboardingProps {
  userId: string;
  displayName: string | null;
  onComplete: () => void;
}

const Onboarding = ({ userId, displayName, onComplete }: OnboardingProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<LearningStyle | null>(null);
  const [savingStyle, setSavingStyle] = useState(false);

  const handleSelectStyle = async (style: LearningStyle) => {
    setSelectedStyle(style);
  };

  const handleSaveStyleAndContinue = async () => {
    if (!selectedStyle) {
      toast.error("Please select a learning style");
      return;
    }

    setSavingStyle(true);
    try {
      const { error } = await supabase
        .from("user_learning_preferences")
        .upsert({
          user_id: userId,
          learning_style: selectedStyle,
        });

      if (error) throw error;
      setStep(2);
    } catch (error: any) {
      toast.error("Failed to save preference");
    } finally {
      setSavingStyle(false);
    }
  };

  const handleFirstAction = (action: "upload" | "courses") => {
    onComplete();
    if (action === "upload") {
      navigate("/materials");
    } else {
      // Stay on dashboard, courses are shown there
    }
  };

  const steps = [
    // Step 0: Welcome
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Welcome{displayName ? `, ${displayName}` : ""}! 🎉
      </h2>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Phoenix adapts to how <strong>YOU</strong> learn best. Let's set up your personalized learning experience in just a minute.
      </p>
      <Button onClick={() => setStep(1)} className="gap-2">
        Let's Go <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>,

    // Step 1: Learning Style
    <motion.div
      key="learning-style"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl font-bold text-foreground mb-2 text-center">
        How do you learn best?
      </h2>
      <p className="text-muted-foreground mb-6 text-center text-sm">
        Choose your preferred learning style. Don't worry, you can change this anytime!
      </p>
      <LearningStyleSelector
        currentStyle={selectedStyle}
        onSelect={handleSelectStyle}
        loading={savingStyle}
      />
      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={() => setStep(0)}>
          Back
        </Button>
        <Button 
          onClick={handleSaveStyleAndContinue} 
          disabled={!selectedStyle || savingStyle}
          className="gap-2"
        >
          {savingStyle ? "Saving..." : "Continue"} <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>,

    // Step 2: Tier System Explanation
    <motion.div
      key="tiers"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl font-bold text-foreground mb-2 text-center">
        Learn at your own pace
      </h2>
      <p className="text-muted-foreground mb-6 text-center text-sm">
        Every lesson has 3 tiers. Choose how deep you want to go based on your time.
      </p>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
          <div className="flex gap-1">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <Star className="w-5 h-5 text-muted-foreground/30" />
            <Star className="w-5 h-5 text-muted-foreground/30" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground text-sm">Tier 1 • 5 min</p>
            <p className="text-xs text-muted-foreground">Quick summary for busy moments</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
          <div className="flex gap-1">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <Star className="w-5 h-5 text-primary fill-primary" />
            <Star className="w-5 h-5 text-muted-foreground/30" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground text-sm">Tier 2 • +10 min</p>
            <p className="text-xs text-muted-foreground">Deeper understanding when you have more time</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
          <div className="flex gap-1">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <Star className="w-5 h-5 text-primary fill-primary" />
            <Star className="w-5 h-5 text-primary fill-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground text-sm">Tier 3 • +20 min</p>
            <p className="text-xs text-muted-foreground">Master through practice & exercises</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button onClick={() => setStep(3)} className="gap-2">
          Got it! <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>,

    // Step 3: First Action
    <motion.div
      key="first-action"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl font-bold text-foreground mb-2 text-center">
        Ready to start learning?
      </h2>
      <p className="text-muted-foreground mb-6 text-center text-sm">
        Choose how you'd like to begin your journey.
      </p>
      
      <div className="space-y-3">
        <button
          onClick={() => handleFirstAction("upload")}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Upload Your Materials</p>
            <p className="text-sm text-muted-foreground">
              Got PDFs? Upload them and we'll create personalized lessons.
            </p>
          </div>
        </button>

        <button
          onClick={() => handleFirstAction("courses")}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Explore Phoenix Courses</p>
            <p className="text-sm text-muted-foreground">
              Start with our pre-made financial education courses.
            </p>
          </div>
        </button>
      </div>

      <div className="flex justify-start mt-6">
        <Button variant="ghost" onClick={() => setStep(2)}>
          Back
        </Button>
      </div>
    </motion.div>,
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl"
      >
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? "bg-primary" : i < step ? "bg-primary/50" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Onboarding;
