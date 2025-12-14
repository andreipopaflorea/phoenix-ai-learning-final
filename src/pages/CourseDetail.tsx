import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Play, 
  Star,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";

interface Course {
  id: string;
  title: string;
  description: string | null;
}

interface LearningUnit {
  id: string;
  unit_title: string;
  description: string | null;
  estimated_minutes: number;
  unit_order: number;
}

interface UserProgress {
  learning_unit_id: string;
  status: string;
  tier1_completed_at: string | null;
  tier2_completed_at: string | null;
  tier3_completed_at: string | null;
}

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<LearningUnit[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !user) return;

      // Fetch course details
      const { data: courseData } = await supabase
        .from("system_learning_courses")
        .select("id, title, description")
        .eq("id", courseId)
        .single();

      if (courseData) setCourse(courseData);

      // Fetch learning units for this course
      const { data: unitsData } = await supabase
        .from("learning_units")
        .select("id, unit_title, description, estimated_minutes, unit_order")
        .eq("course_id", courseId)
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

        if (progressData) {
          const progressMap: Record<string, UserProgress> = {};
          progressData.forEach(p => {
            if (p.learning_unit_id) progressMap[p.learning_unit_id] = p;
          });
          setUserProgress(progressMap);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [courseId, user]);

  const getUnitStatus = (unitId: string) => {
    const progress = userProgress[unitId];
    if (!progress) return "not_started";
    return progress.status;
  };

  const getCompletedTiers = (unitId: string) => {
    const progress = userProgress[unitId];
    if (!progress) return 0;
    let count = 0;
    if (progress.tier1_completed_at) count++;
    if (progress.tier2_completed_at) count++;
    if (progress.tier3_completed_at) count++;
    return count;
  };

  const totalMinutes = units.reduce((sum, u) => sum + (u.estimated_minutes || 5), 0);
  const completedUnits = units.filter(u => {
    const status = getUnitStatus(u.id);
    return status === "complete" || status === "mastered";
  }).length;
  const progressPercent = units.length > 0 ? Math.round((completedUnits / units.length) * 100) : 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-1/3"></div>
            <div className="h-4 bg-secondary rounded w-1/2"></div>
            <div className="h-32 bg-secondary rounded"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-muted-foreground">Course not found.</p>
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

        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  Phoenix Course
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{course.title}</h1>
              {course.description && (
                <p className="text-muted-foreground">{course.description}</p>
              )}
            </div>
          </div>

          {/* Course Stats */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="w-4 h-4" />
              <span>{units.length} lessons</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{totalMinutes} min total</span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium text-foreground">{progressPercent}%</span>
            </div>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full mt-2">
            <div 
              className="h-full bg-primary rounded-full transition-all" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </motion.div>

        {/* Learning Units */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Course Content</h2>
          <div className="space-y-3">
            {units.map((unit, index) => {
              const status = getUnitStatus(unit.id);
              const completedTiers = getCompletedTiers(unit.id);
              const isMastered = status === "mastered";
              const isComplete = status === "complete" || isMastered;

              return (
                <motion.div
                  key={unit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isMastered 
                        ? "bg-amber-100 text-amber-600" 
                        : isComplete 
                          ? "bg-green-100 text-green-600" 
                          : "bg-secondary text-muted-foreground"
                    }`}>
                      <span className="font-semibold">{index + 1}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">{unit.unit_title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {unit.estimated_minutes || 5} min
                        </span>
                        {completedTiers > 0 && (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3].map(tier => (
                              <Star 
                                key={tier}
                                className={`w-3 h-3 ${
                                  tier <= completedTiers 
                                    ? "text-amber-400 fill-amber-400" 
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        {isMastered && (
                          <span className="text-xs text-amber-600 font-medium">Mastered</span>
                        )}
                        {isComplete && !isMastered && (
                          <span className="text-xs text-green-600 font-medium">Complete</span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => navigate(`/learn/${unit.id}`)}
                      className="gap-2"
                      variant={isComplete ? "outline" : "default"}
                    >
                      <Play className="w-4 h-4" />
                      {isComplete ? "Review" : "Start"}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default CourseDetail;
