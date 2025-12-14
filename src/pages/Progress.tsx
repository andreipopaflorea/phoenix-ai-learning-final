import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Clock, Target, TrendingUp, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";

interface ProgressStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  mastered: number;
}

interface WeeklyData {
  day: string;
  date: string;
  minutes: number;
}

interface CourseProgress {
  id: string;
  title: string;
  progress: number;
  type: "course" | "material";
}

const Progress = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProgressStats>({
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
    mastered: 0,
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;

      // Fetch all user progress
      const { data: progress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id);

      if (progress) {
        const mastered = progress.filter(p => p.status === "mastered").length;
        const completed = progress.filter(p => 
          p.status === "complete" || p.status === "mastered"
        ).length;

        // Calculate total minutes from tier completions
        let totalMinutes = 0;
        progress.forEach(p => {
          if (p.tier1_completed_at) totalMinutes += 5;
          if (p.tier2_completed_at) totalMinutes += 10;
          if (p.tier3_completed_at) totalMinutes += 20;
        });

        // Calculate streaks from completion dates
        const completionDates = new Set<string>();
        progress.forEach(p => {
          [p.tier1_completed_at, p.tier2_completed_at, p.tier3_completed_at].forEach(date => {
            if (date) {
              completionDates.add(new Date(date).toDateString());
            }
          });
        });

        // Calculate current streak
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          if (completionDates.has(checkDate.toDateString())) {
            currentStreak++;
          } else if (i > 0) {
            break;
          }
        }

        // Calculate longest streak
        const sortedDates = Array.from(completionDates)
          .map(d => new Date(d))
          .sort((a, b) => a.getTime() - b.getTime());
        
        let longestStreak = 0;
        let tempStreak = 1;
        
        for (let i = 1; i < sortedDates.length; i++) {
          const diff = (sortedDates[i].getTime() - sortedDates[i-1].getTime()) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

        // Calculate weekly activity
        const weekData: WeeklyData[] = [];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toDateString();
          
          let dayMinutes = 0;
          progress.forEach(p => {
            if (p.tier1_completed_at && new Date(p.tier1_completed_at).toDateString() === dateStr) {
              dayMinutes += 5;
            }
            if (p.tier2_completed_at && new Date(p.tier2_completed_at).toDateString() === dateStr) {
              dayMinutes += 10;
            }
            if (p.tier3_completed_at && new Date(p.tier3_completed_at).toDateString() === dateStr) {
              dayMinutes += 20;
            }
          });

          weekData.push({
            day: dayNames[date.getDay()],
            date: dateStr,
            minutes: dayMinutes,
          });
        }
        setWeeklyData(weekData);

        setStats({
          totalSessions: completed,
          totalMinutes,
          currentStreak,
          longestStreak,
          mastered,
        });
      }

      // Fetch course progress
      const { data: courses } = await supabase
        .from("system_learning_courses")
        .select("id, title");

      const { data: materials } = await supabase
        .from("study_materials")
        .select("id, file_name")
        .eq("user_id", user.id);

      const { data: allUnits } = await supabase
        .from("learning_units")
        .select("id, course_id, study_material_id");

      const { data: allProgress } = await supabase
        .from("user_progress")
        .select("learning_unit_id, status")
        .eq("user_id", user.id);

      const progressList: CourseProgress[] = [];

      // Calculate course progress
      if (courses && allUnits && allProgress) {
        courses.forEach(course => {
          const courseUnits = allUnits.filter(u => u.course_id === course.id);
          if (courseUnits.length > 0) {
            const completed = courseUnits.filter(u => {
              const prog = allProgress.find(p => p.learning_unit_id === u.id);
              return prog?.status === "complete" || prog?.status === "mastered";
            }).length;
            progressList.push({
              id: course.id,
              title: course.title,
              progress: Math.round((completed / courseUnits.length) * 100),
              type: "course",
            });
          }
        });
      }

      // Calculate material progress
      if (materials && allUnits && allProgress) {
        materials.forEach(material => {
          const matUnits = allUnits.filter(u => u.study_material_id === material.id);
          if (matUnits.length > 0) {
            const completed = matUnits.filter(u => {
              const prog = allProgress.find(p => p.learning_unit_id === u.id);
              return prog?.status === "complete" || prog?.status === "mastered";
            }).length;
            progressList.push({
              id: material.id,
              title: material.file_name.replace('.pdf', ''),
              progress: Math.round((completed / matUnits.length) * 100),
              type: "material",
            });
          }
        });
      }

      setCourseProgress(progressList);
    };

    fetchProgress();
  }, [user]);

  const statCards = [
    { 
      icon: Flame, 
      label: "Current Streak", 
      value: `${stats.currentStreak} days`,
      color: "bg-orange-100 text-orange-500"
    },
    { 
      icon: Trophy, 
      label: "Longest Streak", 
      value: `${stats.longestStreak} days`,
      color: "bg-amber-100 text-amber-500"
    },
    { 
      icon: Target, 
      label: "Sessions Completed", 
      value: String(stats.totalSessions),
      color: "bg-green-100 text-green-500"
    },
    { 
      icon: Clock, 
      label: "Total Study Time", 
      value: `${stats.totalMinutes}m`,
      color: "bg-blue-100 text-blue-500"
    },
  ];

  const maxMinutes = Math.max(...weeklyData.map(d => d.minutes), 1);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-1">Progress</h1>
          <p className="text-muted-foreground">
            Track your learning journey
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {statCards.map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Weekly Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Weekly Activity</h2>
              <p className="text-sm text-muted-foreground">Minutes studied per day</p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 h-40">
            {weeklyData.length > 0 ? weeklyData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-primary/20 rounded-t-lg relative overflow-hidden min-h-[4px]"
                  style={{ height: `${Math.max((day.minutes / maxMinutes) * 100, 3)}%` }}
                >
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg"
                    style={{ height: "100%" }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            )) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                No activity this week
              </div>
            )}
          </div>
        </motion.div>

        {/* Mastery Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Learning Progress</h2>
              <p className="text-sm text-muted-foreground">{stats.mastered} topics mastered</p>
            </div>
          </div>

          <div className="space-y-4">
            {courseProgress.length > 0 ? courseProgress.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    {item.title}
                    <span className="text-xs px-1.5 py-0.5 bg-secondary rounded">
                      {item.type === "course" ? "Course" : "Material"}
                    </span>
                  </span>
                  <span className="font-medium text-foreground">{item.progress}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full">
                  <div 
                    className="h-full bg-primary rounded-full transition-all" 
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                Start learning to see your progress here
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Progress;
