import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Landmark, Rocket, Table, FileText, ChevronDown, ChevronUp, 
  Play, Star, Lock, Sparkles, BookOpen 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  course_order: number;
}

interface LearningUnit {
  id: string;
  unit_title: string;
  description: string | null;
  estimated_minutes: number;
  unit_order: number;
  course_id: string;
}

interface UserProgress {
  learning_unit_id: string;
  status: string;
  tier1_completed_at: string | null;
  tier2_completed_at: string | null;
  tier3_completed_at: string | null;
}

const iconMap: Record<string, typeof Landmark> = {
  landmark: Landmark,
  rocket: Rocket,
  table: Table,
  "file-text": FileText,
  book: BookOpen,
};

interface FinancialCoursesProps {
  userId: string;
  userProgress: Record<string, UserProgress>;
  hasLearningStyle: boolean;
}

export const FinancialCourses = ({ userId, userProgress, hasLearningStyle }: FinancialCoursesProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [units, setUnits] = useState<Record<string, LearningUnit[]>>({});
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Fetch system courses
        const { data: coursesData, error: coursesError } = await supabase
          .from("system_learning_courses")
          .select("*")
          .order("course_order", { ascending: true });

        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        // Fetch system learning units
        const { data: unitsData, error: unitsError } = await supabase
          .from("learning_units")
          .select("*")
          .eq("is_system_content", true)
          .order("unit_order", { ascending: true });

        if (unitsError) throw unitsError;

        // Group units by course
        const unitsMap: Record<string, LearningUnit[]> = {};
        (unitsData || []).forEach(unit => {
          if (unit.course_id) {
            if (!unitsMap[unit.course_id]) {
              unitsMap[unit.course_id] = [];
            }
            unitsMap[unit.course_id].push(unit);
          }
        });
        setUnits(unitsMap);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const getUnitProgress = (unitId: string) => {
    const progress = userProgress[unitId];
    if (!progress) return { status: "not_started", completedTiers: 0 };
    
    let completedTiers = 0;
    if (progress.tier1_completed_at) completedTiers = 1;
    if (progress.tier2_completed_at) completedTiers = 2;
    if (progress.tier3_completed_at) completedTiers = 3;
    
    return { status: progress.status, completedTiers };
  };

  const getCourseProgress = (courseId: string) => {
    const courseUnits = units[courseId] || [];
    if (courseUnits.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = courseUnits.filter(u => {
      const progress = userProgress[u.id];
      return progress?.status === "complete" || progress?.status === "mastered";
    }).length;
    
    return {
      completed,
      total: courseUnits.length,
      percentage: Math.round((completed / courseUnits.length) * 100)
    };
  };

  const handleStartUnit = (unitId: string) => {
    if (!hasLearningStyle) {
      return;
    }
    navigate(`/learn/${unitId}`);
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3" />
          <div className="h-20 bg-secondary rounded" />
          <div className="h-20 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-primary">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Phoenix Financial Education</h2>
          <p className="text-sm text-muted-foreground">Pre-loaded courses to master finance</p>
        </div>
      </div>

      {!hasLearningStyle && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Select a learning style to unlock these courses
          </p>
        </div>
      )}

      <div className="space-y-3">
        {courses.map((course) => {
          const Icon = iconMap[course.icon] || BookOpen;
          const courseUnits = units[course.id] || [];
          const isExpanded = expandedCourse === course.id;
          const progress = getCourseProgress(course.id);

          return (
            <div
              key={course.id}
              className="rounded-xl border border-border overflow-hidden"
            >
              {/* Course Header */}
              <button
                onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                className="w-full p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{course.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          Phoenix Course
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {course.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium">{progress.percentage}%</p>
                      <p className="text-xs text-muted-foreground">
                        {progress.completed}/{progress.total} units
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </button>

              {/* Units List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 border-t border-border bg-background space-y-2">
                      {courseUnits.map((unit) => {
                        const { status, completedTiers } = getUnitProgress(unit.id);
                        const isCompleted = status === "complete" || status === "mastered";

                        return (
                          <div
                            key={unit.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3].map((tier) => (
                                  <Star
                                    key={tier}
                                    className={`w-3 h-3 ${
                                      tier <= completedTiers
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-muted-foreground/30"
                                    }`}
                                  />
                                ))}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{unit.unit_title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {unit.estimated_minutes} min
                                </p>
                              </div>
                            </div>
                            <Button
                              variant={isCompleted ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleStartUnit(unit.id)}
                              disabled={!hasLearningStyle}
                              className="gap-1"
                            >
                              <Play className="w-3 h-3" />
                              {isCompleted ? "Review" : "Start"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
