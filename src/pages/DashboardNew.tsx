import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Flame, 
  Clock, 
  Target, 
  Trophy, 
  Play, 
  Plus,
  Calendar,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";

interface Profile {
  display_name: string | null;
}

interface LearningUnit {
  id: string;
  unit_title: string;
  description: string | null;
  estimated_minutes: number;
}

interface UserProgress {
  learning_unit_id: string;
  status: string;
  tier1_completed_at: string | null;
  tier2_completed_at: string | null;
  tier3_completed_at: string | null;
}

const DashboardNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [learningStyle, setLearningStyle] = useState<string>("kinesthetic");
  const [nextUnit, setNextUnit] = useState<LearningUnit | null>(null);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileData) setProfile(profileData);

      // Fetch learning style
      const { data: prefData } = await supabase
        .from("user_learning_preferences")
        .select("learning_style")
        .eq("user_id", user.id)
        .maybeSingle();
      if (prefData) setLearningStyle(prefData.learning_style);

      // Fetch all learning units
      const { data: units } = await supabase
        .from("learning_units")
        .select("*")
        .order("unit_order", { ascending: true });

      // Fetch progress
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id);

      if (progressData) {
        const progressMap: Record<string, UserProgress> = {};
        progressData.forEach(p => {
          progressMap[p.learning_unit_id] = p;
        });
        setUserProgress(progressMap);
      }

      // Find next incomplete unit
      if (units) {
        const incompleteUnit = units.find(u => {
          const progress = userProgress[u.id];
          return !progress || progress.status !== "mastered";
        });
        if (incompleteUnit) setNextUnit(incompleteUnit);
      }
    };

    fetchData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Calculate stats
  const allProgress = Object.values(userProgress);
  const completedCount = allProgress.filter(p => p.status === "complete" || p.status === "mastered").length;
  const masteredCount = allProgress.filter(p => p.status === "mastered").length;

  const stats = [
    { icon: Flame, label: "Day Streak", value: "6", color: "bg-orange-100 text-orange-500" },
    { icon: Clock, label: "This Week", value: "85m", color: "bg-blue-100 text-blue-500" },
    { icon: Target, label: "Sessions Done", value: String(completedCount || 19), color: "bg-green-100 text-green-500" },
    { icon: Trophy, label: "Mastered", value: String(masteredCount || 7), color: "bg-amber-100 text-amber-500" },
  ];

  const quickActions = [
    { icon: Plus, label: "Add Deadline" },
    { icon: Calendar, label: "Add Training Block" },
    { icon: Upload, label: "Upload PDF" },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-1">
            {getGreeting()} 👋
          </h1>
          <p className="text-muted-foreground">
            Master your degree in the pockets of your day.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className={`stat-icon ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Session Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="session-card">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  ⚡ Tier 2 • Deep Dive
                </span>
                <span className="text-muted-foreground text-sm">12:00 PM</span>
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">
                Pre-Game Mental Routine
              </h2>
              <p className="text-muted-foreground mb-4">Mental Preparation</p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> 15 min
                </span>
                <span className="flex items-center gap-1 capitalize">
                  📚 {learningStyle.replace("_", " ")}
                </span>
              </div>

              <div className="bg-secondary rounded-xl p-4 mb-6">
                <p className="text-foreground">
                  Goal: Build a personal pre-game mental routine for peak performance
                </p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  ✨ Small step today → big progress later
                </p>
                <Button 
                  onClick={() => nextUnit && navigate(`/learn/${nextUnit.id}`)}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Play className="w-4 h-4" />
                  Start Session
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6">
              <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                {quickActions.map((action, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      if (action.label === "Upload PDF") navigate("/materials");
                      if (action.label === "Add Training Block") navigate("/agenda");
                    }}
                  >
                    <action.icon className="w-4 h-4" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Upcoming Deadline */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Finance Midterm</p>
                    <p className="text-sm text-muted-foreground">10 days left</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-primary">10d</span>
              </div>
            </div>

            {/* Coming Up Today */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-semibold text-foreground mb-4">Coming Up Today</h3>
              <div className="border-l-2 border-primary pl-4">
                <p className="font-medium text-foreground">Pre-Game Mental Routine</p>
                <p className="text-sm text-muted-foreground">
                  <Clock className="w-3 h-3 inline mr-1" />
                  12:00 PM • ⚡ Tier 2 • 15m
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardNew;
