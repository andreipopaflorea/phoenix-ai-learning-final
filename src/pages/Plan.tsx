import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Calendar,
  Clock,
  Play,
  BookOpen,
  Zap,
  CheckCircle2,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfWeek, isSameDay, isToday, isTomorrow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";

interface LearningUnit {
  id: string;
  unit_title: string;
  description: string | null;
  estimated_minutes: number;
  course_title?: string;
  is_system_content?: boolean;
}

interface ScheduledSession {
  id: string;
  unit: LearningUnit;
  scheduledDate: Date;
  scheduledTime: string;
  tier: number;
  completed: boolean;
}

const Plan = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [learningStyle, setLearningStyle] = useState<string>("visual");

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);

      // Fetch learning style
      const { data: prefData } = await supabase
        .from("user_learning_preferences")
        .select("learning_style")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (prefData) setLearningStyle(prefData.learning_style);

      // Fetch learning units (both user's and system content)
      const { data: units } = await supabase
        .from("learning_units")
        .select(`
          id,
          unit_title,
          description,
          estimated_minutes,
          is_system_content,
          system_learning_courses (title)
        `)
        .or(`user_id.eq.${user.id},is_system_content.eq.true`)
        .order("unit_order", { ascending: true })
        .limit(10);

      // Fetch user progress
      const { data: progress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id);

      const progressMap = new Map(progress?.map(p => [p.learning_unit_id, p]) || []);

      // Create scheduled sessions for the week
      if (units) {
        const scheduledSessions: ScheduledSession[] = [];
        const times = ["9:00 AM", "12:00 PM", "3:00 PM", "6:00 PM"];
        let sessionIndex = 0;

        units.forEach((unit, unitIndex) => {
          const unitProgress = progressMap.get(unit.id);
          const completedTiers = unitProgress 
            ? [unitProgress.tier1_completed_at, unitProgress.tier2_completed_at, unitProgress.tier3_completed_at].filter(Boolean).length 
            : 0;

          // Schedule remaining tiers
          for (let tier = completedTiers + 1; tier <= 3 && sessionIndex < 14; tier++) {
            const dayIndex = Math.floor(sessionIndex / 2);
            const timeIndex = sessionIndex % times.length;
            
            if (dayIndex < 7) {
              scheduledSessions.push({
                id: `${unit.id}-tier${tier}`,
                unit: {
                  id: unit.id,
                  unit_title: unit.unit_title,
                  description: unit.description,
                  estimated_minutes: tier === 1 ? 5 : tier === 2 ? 10 : 20,
                  course_title: (unit as any).system_learning_courses?.title,
                  is_system_content: unit.is_system_content || false,
                },
                scheduledDate: weekDays[dayIndex],
                scheduledTime: times[timeIndex],
                tier,
                completed: false,
              });
              sessionIndex++;
            }
          }
        });

        setSessions(scheduledSessions);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE");
  };

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1: return "Introduction";
      case 2: return "Deep Dive";
      case 3: return "Mastery";
      default: return "Session";
    }
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return "bg-green-100 text-green-600";
      case 2: return "bg-blue-100 text-blue-600";
      case 3: return "bg-purple-100 text-purple-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  // Group sessions by date
  const sessionsByDate = weekDays.map(day => ({
    date: day,
    sessions: sessions.filter(s => isSameDay(s.scheduledDate, day)),
  }));

  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((acc, s) => acc + s.unit.estimated_minutes, 0);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-1">Weekly Plan</h1>
          <p className="text-muted-foreground">
            Your upcoming micro-learning sessions
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalSessions}</p>
            <p className="text-sm text-muted-foreground">Sessions</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalMinutes}m</p>
            <p className="text-sm text-muted-foreground">Total Time</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground capitalize">{learningStyle.replace("_", " ")}</p>
            <p className="text-sm text-muted-foreground">Learning Style</p>
          </div>
        </motion.div>

        {/* Sessions by Day */}
        <div className="space-y-6">
          {sessionsByDate.map((dayData, dayIndex) => {
            if (dayData.sessions.length === 0) return null;

            const isCurrentDay = isToday(dayData.date);

            return (
              <motion.div
                key={dayIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + dayIndex * 0.05 }}
              >
                {/* Day Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isCurrentDay ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}>
                    <span className="font-bold">{format(dayData.date, "d")}</span>
                  </div>
                  <div>
                    <p className={`font-semibold ${isCurrentDay ? "text-primary" : "text-foreground"}`}>
                      {getDateLabel(dayData.date)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(dayData.date, "MMMM d")} • {dayData.sessions.length} session{dayData.sessions.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Sessions */}
                <div className="space-y-3 ml-[52px]">
                  {dayData.sessions.map((session, sessionIndex) => (
                    <div
                      key={session.id}
                      className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTierColor(session.tier)}`}>
                              <Zap className="w-3 h-3 inline mr-1" />
                              Tier {session.tier} • {getTierLabel(session.tier)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {session.scheduledTime}
                            </span>
                          </div>
                          
                          <h3 className="font-semibold text-foreground mb-1">
                            {session.unit.unit_title}
                          </h3>
                          
                          {session.unit.course_title && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {session.unit.course_title}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {session.unit.estimated_minutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {learningStyle.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="gap-1 bg-primary hover:bg-primary/90"
                          onClick={() => navigate(`/learn/${session.unit.id}`)}
                        >
                          <Play className="w-3 h-3" />
                          Start
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {sessions.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No sessions scheduled
              </h3>
              <p className="text-muted-foreground mb-4">
                Upload study materials or explore preloaded courses to get started
              </p>
              <Button onClick={() => navigate("/materials")}>
                Browse Materials
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Plan;