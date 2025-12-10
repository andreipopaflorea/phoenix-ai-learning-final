import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReadingWritingContent } from "@/components/learn/ReadingWritingContent";
import { AuditoryContent } from "@/components/learn/AuditoryContent";
import { VisualContent } from "@/components/learn/VisualContent";
import { KinestheticContent } from "@/components/learn/KinestheticContent";

type LearningStyle = "visual" | "auditory" | "reading_writing" | "kinesthetic";

interface LearningUnit {
  id: string;
  unit_title: string;
  description: string | null;
  text: string;
  estimated_minutes: number;
  unit_order: number;
}

interface SessionContent {
  id: string;
  tier: number;
  content_payload: any;
  learning_style: LearningStyle;
}

const Learn = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [unit, setUnit] = useState<LearningUnit | null>(null);
  const [content, setContent] = useState<SessionContent | null>(null);
  const [learningStyle, setLearningStyle] = useState<LearningStyle | null>(null);
  const [currentTier, setCurrentTier] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const tier = parseInt(searchParams.get("tier") || "1");
    setCurrentTier(tier);
    setContent(null); // Reset content when tier changes
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !unitId) return;

      try {
        // Fetch learning unit
        const { data: unitData, error: unitError } = await supabase
          .from("learning_units")
          .select("*")
          .eq("id", unitId)
          .single();

        if (unitError) throw unitError;
        setUnit(unitData);

        // Fetch user's learning style
        const { data: prefData } = await supabase
          .from("user_learning_preferences")
          .select("learning_style")
          .eq("user_id", user.id)
          .maybeSingle();

        if (prefData) {
          setLearningStyle(prefData.learning_style as LearningStyle);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load learning content");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, unitId]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const generateContent = async () => {
      if (!user || !unitId || !learningStyle || generating || content) return;

      setGenerating(true);
      try {
        const { data, error } = await supabase.functions.invoke("generate-session-content", {
          body: {
            learningUnitId: unitId,
            learningStyle,
            tier: currentTier,
            userId: user.id,
          },
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        setContent(data.content);
      } catch (error: any) {
        console.error("Error generating content:", error);
        toast.error(error.message || "Failed to generate content");
      } finally {
        setGenerating(false);
      }
    };

    if (learningStyle && !content) {
      generateContent();
    }
  }, [user, unitId, learningStyle, currentTier, content]);

  const handleComplete = () => {
    navigate(`/session-complete/${unitId}?tier=${currentTier}`);
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
        <p className="text-muted-foreground">Learning unit not found</p>
      </div>
    );
  }

  const renderContent = () => {
    if (generating || !content) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Generating your personalized content...</p>
        </div>
      );
    }

    const props = { content: content.content_payload, tier: currentTier };

    switch (learningStyle) {
      case "reading_writing":
        return <ReadingWritingContent {...props} />;
      case "auditory":
        return <AuditoryContent {...props} />;
      case "visual":
        return <VisualContent {...props} />;
      case "kinesthetic":
        return <KinestheticContent {...props} />;
      default:
        return <ReadingWritingContent {...props} />;
    }
  };

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
            <span className="text-sm text-muted-foreground">
              Tier {currentTier} • {unit.estimated_minutes} min
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">Unit {unit.unit_order}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{unit.unit_title}</h1>
            {unit.description && (
              <p className="text-muted-foreground">{unit.description}</p>
            )}
          </div>

          <div className="glass-card p-6 mb-8">
            {renderContent()}
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleComplete}
              disabled={generating || !content}
              className="gap-2"
            >
              Complete Session
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Learn;
