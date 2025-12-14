import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Clock, Target, TrendingUp } from "lucide-react";
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

const Progress = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProgressStats>({
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 6,
    longestStreak: 12,
    mastered: 0,
  });

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;

      const { data: progress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id);

      if (progress) {
        const mastered = progress.filter(p => p.status === "mastered").length;
        const completed = progress.filter(p => p.tier1_completed_at).length;

        setStats(prev => ({
          ...prev,
          totalSessions: completed,
          mastered,
          totalMinutes: completed * 15, // Estimate 15 min per session
        }));
      }
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
      value: String(stats.totalSessions || 19),
      color: "bg-green-100 text-green-500"
    },
    { 
      icon: Clock, 
      label: "Total Study Time", 
      value: `${stats.totalMinutes || 285}m`,
      color: "bg-blue-100 text-blue-500"
    },
  ];

  const weeklyData = [
    { day: "Mon", minutes: 25 },
    { day: "Tue", minutes: 45 },
    { day: "Wed", minutes: 30 },
    { day: "Thu", minutes: 60 },
    { day: "Fri", minutes: 20 },
    { day: "Sat", minutes: 50 },
    { day: "Sun", minutes: 55 },
  ];

  const maxMinutes = Math.max(...weeklyData.map(d => d.minutes));

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
            {weeklyData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-primary/20 rounded-t-lg relative overflow-hidden"
                  style={{ height: `${(day.minutes / maxMinutes) * 100}%` }}
                >
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg"
                    style={{ height: "100%" }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
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
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Mastery Progress</h2>
              <p className="text-sm text-muted-foreground">{stats.mastered || 7} topics mastered</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Financial Education</span>
                <span className="font-medium text-foreground">75%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full">
                <div className="w-3/4 h-full bg-primary rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Sports Psychology</span>
                <span className="font-medium text-foreground">45%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full">
                <div className="w-[45%] h-full bg-primary rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Progress;
