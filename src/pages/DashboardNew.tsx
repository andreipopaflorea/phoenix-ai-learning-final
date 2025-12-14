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
  Upload,
  FileText,
  BookOpen,
  ChevronRight
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

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  category: string;
}

interface StudyMaterial {
  id: string;
  file_name: string;
  created_at: string;
}

interface SystemCourse {
  id: string;
  title: string;
  description: string | null;
}

const DashboardNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [learningStyle, setLearningStyle] = useState<string>("kinesthetic");
  const [nextUnit, setNextUnit] = useState<LearningUnit | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [dayStreak, setDayStreak] = useState(0);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [courses, setCourses] = useState<SystemCourse[]>([]);

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
        setUserProgress(progressData);
        
        // Calculate day streak from tier completion dates
        const completionDates = new Set<string>();
        progressData.forEach(p => {
          [p.tier1_completed_at, p.tier2_completed_at, p.tier3_completed_at].forEach(date => {
            if (date) {
              completionDates.add(new Date(date).toDateString());
            }
          });
        });
        
        // Calculate consecutive days streak ending today or yesterday
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          if (completionDates.has(checkDate.toDateString())) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
        setDayStreak(streak);

        // Calculate weekly minutes from learning units completed this week
        const startOfWeek = new Date(today);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        
        let minutes = 0;
        progressData.forEach(p => {
          const tierDates = [p.tier1_completed_at, p.tier2_completed_at, p.tier3_completed_at];
          tierDates.forEach((date, tierIndex) => {
            if (date && new Date(date) >= startOfWeek) {
              // Tier 1 = 5 min, Tier 2 = 10 min, Tier 3 = 20 min
              minutes += [5, 10, 20][tierIndex];
            }
          });
        });
        setWeeklyMinutes(minutes);
      }

      // Find next incomplete unit (skip completed and mastered)
      if (units && progressData) {
        const progressMap: Record<string, UserProgress> = {};
        progressData.forEach(p => {
          if (p.learning_unit_id) progressMap[p.learning_unit_id] = p;
        });
        
        const incompleteUnit = units.find(u => {
          const progress = progressMap[u.id];
          // Show units that haven't been started or are still in progress (not complete/mastered)
          return !progress || (progress.status !== "complete" && progress.status !== "mastered");
        });
        if (incompleteUnit) setNextUnit(incompleteUnit);
      }

      // Fetch upcoming calendar events
      const now = new Date().toISOString();
      const { data: eventsData } = await supabase
        .from("calendar_events")
        .select("id, title, start_time, end_time, category")
        .eq("user_id", user.id)
        .gte("start_time", now)
        .order("start_time", { ascending: true })
        .limit(5);
      
      if (eventsData) setUpcomingEvents(eventsData);

      // Fetch user's study materials
      const { data: materialsData } = await supabase
        .from("study_materials")
        .select("id, file_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (materialsData) setMaterials(materialsData);

      // Fetch system courses
      const { data: coursesData } = await supabase
        .from("system_learning_courses")
        .select("id, title, description")
        .order("course_order", { ascending: true });
      
      if (coursesData) setCourses(coursesData);
    };

    fetchData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Calculate stats from real data
  const completedCount = userProgress.filter(p => p.status === "complete" || p.status === "mastered").length;
  const masteredCount = userProgress.filter(p => p.status === "mastered").length;

  const stats = [
    { icon: Flame, label: "Day Streak", value: String(dayStreak), color: "bg-orange-100 text-orange-500" },
    { icon: Clock, label: "This Week", value: `${weeklyMinutes}m`, color: "bg-blue-100 text-blue-500" },
    { icon: Target, label: "Sessions Done", value: String(completedCount), color: "bg-green-100 text-green-500" },
    { icon: Trophy, label: "Mastered", value: String(masteredCount), color: "bg-amber-100 text-amber-500" },
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Main Session Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {nextUnit ? (
              <div className="session-card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    ⚡ Next Session
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {nextUnit.unit_title}
                </h2>
                {nextUnit.description && (
                  <p className="text-muted-foreground mb-4">{nextUnit.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {nextUnit.estimated_minutes} min
                  </span>
                  <span className="flex items-center gap-1 capitalize">
                    📚 {learningStyle.replace("_", " ")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">
                    ✨ Small step today → big progress later
                  </p>
                  <Button 
                    onClick={() => navigate(`/learn/${nextUnit.id}`)}
                    className="gap-2 bg-primary hover:bg-primary/90"
                  >
                    <Play className="w-4 h-4" />
                    Start Session
                  </Button>
                </div>
              </div>
            ) : (
              <div className="session-card text-center py-12">
                <p className="text-muted-foreground mb-4">No learning sessions available yet.</p>
                <Button onClick={() => navigate("/materials")} variant="outline">
                  Upload Study Materials
                </Button>
              </div>
            )}

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
            {/* Materials Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Your Materials</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary gap-1"
                  onClick={() => navigate("/materials")}
                >
                  View all <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              {/* First course as main card (same style as Next Session) */}
              {courses.length > 0 && (
                <div className="session-card">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      📚 Phoenix Course
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {courses[0].title}
                  </h2>
                  {courses[0].description && (
                    <p className="text-muted-foreground mb-4">{courses[0].description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> 5 min
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                      🎨 {learningStyle.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">
                      ✨ Small step today → big progress later
                    </p>
                    <Button 
                      onClick={() => navigate(`/course/${courses[0].id}`)}
                      className="gap-2 bg-primary hover:bg-primary/90"
                    >
                      <Play className="w-4 h-4" />
                      Start Session
                    </Button>
                  </div>
                </div>
              )}

              {materials.length === 0 && courses.length === 0 && (
                <div className="session-card text-center py-8">
                  <p className="text-muted-foreground mb-4">No materials yet. Upload a PDF to get started.</p>
                  <Button onClick={() => navigate("/materials")} variant="outline">
                    Upload Study Materials
                  </Button>
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-semibold text-foreground mb-4">Upcoming</h3>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                    const eventDate = new Date(event.start_time);
                    const isToday = eventDate.toDateString() === new Date().toDateString();
                    const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                    const dateLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                    
                    return (
                      <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {dateLabel} • {eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming events. Add deadlines in your Agenda.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardNew;
