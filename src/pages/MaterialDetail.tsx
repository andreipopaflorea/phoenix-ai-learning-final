import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Star, BookOpen, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";

interface StudyMaterial {
  id: string;
  file_name: string;
  created_at: string;
}

interface LearningUnit {
  id: string;
  unit_title: string;
  description: string | null;
  estimated_minutes: number | null;
  unit_order: number;
}

interface UserProgress {
  learning_unit_id: string;
  status: string;
  tier1_completed_at: string | null;
  tier2_completed_at: string | null;
  tier3_completed_at: string | null;
}

const MaterialDetail = () => {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [units, setUnits] = useState<LearningUnit[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!materialId || !user) return;

      // Fetch material details
      const { data: materialData } = await supabase
        .from("study_materials")
        .select("*")
        .eq("id", materialId)
        .single();

      if (materialData) setMaterial(materialData);

      // Fetch learning units for this material
      const { data: unitsData } = await supabase
        .from("learning_units")
        .select("*")
        .eq("study_material_id", materialId)
        .order("unit_order", { ascending: true });

      if (unitsData) setUnits(unitsData);

      // Fetch user progress
      if (unitsData && unitsData.length > 0) {
        const unitIds = unitsData.map(u => u.id);
        const { data: progressData } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", user.id)
          .in("learning_unit_id", unitIds);

        if (progressData) setUserProgress(progressData);
      }

      setLoading(false);
    };

    fetchData();
  }, [materialId, user]);

  const getUnitStatus = (unitId: string) => {
    const progress = userProgress.find(p => p.learning_unit_id === unitId);
    return progress?.status || "not_started";
  };

  const getCompletedTiers = (unitId: string) => {
    const progress = userProgress.find(p => p.learning_unit_id === unitId);
    if (!progress) return 0;
    let count = 0;
    if (progress.tier1_completed_at) count++;
    if (progress.tier2_completed_at) count++;
    if (progress.tier3_completed_at) count++;
    return count;
  };

  const totalMinutes = units.reduce((acc, unit) => acc + (unit.estimated_minutes || 5), 0);
  const completedUnits = units.filter(u => {
    const status = getUnitStatus(u.id);
    return status === "complete" || status === "mastered";
  }).length;
  const progressPercentage = units.length > 0 ? Math.round((completedUnits / units.length) * 100) : 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!material) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Material not found</p>
          <Button variant="outline" onClick={() => navigate("/materials")} className="mt-4">
            Back to Materials
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate("/materials")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Materials
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {material.file_name.replace('.pdf', '')}
          </h1>
          <p className="text-muted-foreground mb-6">
            Uploaded on {new Date(material.created_at).toLocaleDateString()}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="w-5 h-5" />
              <span>{units.length} lessons</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5" />
              <span>{totalMinutes} min total</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="w-5 h-5 text-primary" />
              <span>{progressPercentage}% complete</span>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="w-full h-2 bg-secondary rounded-full">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }} 
            />
          </div>
        </motion.div>

        {/* Lessons List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">Lessons</h2>
          <div className="space-y-4">
            {units.map((unit, index) => {
              const status = getUnitStatus(unit.id);
              const completedTiers = getCompletedTiers(unit.id);
              const isMastered = status === "mastered";
              const isComplete = status === "complete" || isMastered;

              return (
                <motion.div
                  key={unit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`bg-card border rounded-2xl p-5 transition-all ${
                    isComplete ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold ${
                        isMastered 
                          ? "bg-primary text-primary-foreground" 
                          : isComplete 
                            ? "bg-primary/20 text-primary" 
                            : "bg-secondary text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground">{unit.unit_title}</h3>
                          {isMastered && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              Mastered
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {unit.estimated_minutes || 5} min
                          </span>
                          {completedTiers > 0 && (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3].map(tier => (
                                <Star 
                                  key={tier}
                                  className={`w-3 h-3 ${
                                    tier <= completedTiers 
                                      ? "text-primary fill-primary" 
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={isComplete ? "outline" : "default"}
                      size="sm"
                      onClick={() => navigate(`/learn/${unit.id}`)}
                      className="gap-2"
                    >
                      {isComplete ? (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          Review
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Start
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {units.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-2xl">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No lessons found for this material.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try processing the PDF again from the Materials page.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MaterialDetail;
