import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
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
  ChevronRight,
  CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";
import Onboarding from "@/components/Onboarding";

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

interface MaterialLearningUnit {
  id: string;
  study_material_id: string;
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
  const [materialUnits, setMaterialUnits] = useState<Record<string, MaterialLearningUnit[]>>({});
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  
  // Deadline dialog state
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);
  const [deadlineTitle, setDeadlineTitle] = useState("");
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [deadlineTime, setDeadlineTime] = useState("12:00");
  const [savingDeadline, setSavingDeadline] = useState(false);

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

      // Fetch learning style - if none exists, show onboarding
      const { data: prefData } = await supabase
        .from("user_learning_preferences")
        .select("learning_style")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (prefData) {
        setLearningStyle(prefData.learning_style);
      } else {
        // No learning preferences = new user, show onboarding
        setShowOnboarding(true);
      }
      setOnboardingChecked(true);

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
      
      if (materialsData) {
        setMaterials(materialsData);
        
        // Fetch learning units for these materials
        const materialIds = materialsData.map(m => m.id);
        if (materialIds.length > 0) {
          const { data: unitsData } = await supabase
            .from("learning_units")
            .select("id, study_material_id")
            .in("study_material_id", materialIds);
          
          if (unitsData) {
            const unitsMap: Record<string, MaterialLearningUnit[]> = {};
            unitsData.forEach(unit => {
              if (unit.study_material_id) {
                if (!unitsMap[unit.study_material_id]) {
                  unitsMap[unit.study_material_id] = [];
                }
                unitsMap[unit.study_material_id].push(unit);
              }
            });
            setMaterialUnits(unitsMap);
          }
        }
      }

      // Fetch system courses
      const { data: coursesData } = await supabase
        .from("system_learning_courses")
        .select("id, title, description")
        .order("course_order", { ascending: true });
      
      if (coursesData) setCourses(coursesData);
    };

    fetchData();
  }, [user]);

  // Calculate material progress percentage
  const getMaterialProgress = (materialId: string) => {
    const units = materialUnits[materialId] || [];
    if (units.length === 0) return 0;
    
    const completedUnits = units.filter(unit => {
      const progress = userProgress.find(p => p.learning_unit_id === unit.id);
      return progress?.status === "complete" || progress?.status === "mastered";
    }).length;
    
    return Math.round((completedUnits / units.length) * 100);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleAddDeadline = async () => {
    if (!user || !deadlineTitle.trim() || !deadlineDate) {
      toast.error("Please fill in all fields");
      return;
    }

    setSavingDeadline(true);
    try {
      const [hours, minutes] = deadlineTime.split(":").map(Number);
      const startTime = new Date(deadlineDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);

      const { error } = await supabase.from("calendar_events").insert({
        user_id: user.id,
        title: deadlineTitle.trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        category: "school",
      });

      if (error) throw error;

      // Refresh upcoming events
      const now = new Date().toISOString();
      const { data: eventsData } = await supabase
        .from("calendar_events")
        .select("id, title, start_time, end_time, category")
        .eq("user_id", user.id)
        .gte("start_time", now)
        .order("start_time", { ascending: true })
        .limit(5);
      
      if (eventsData) setUpcomingEvents(eventsData);

      toast.success("Deadline added!");
      setDeadlineDialogOpen(false);
      setDeadlineTitle("");
      setDeadlineDate(undefined);
      setDeadlineTime("12:00");
    } catch (error: any) {
      toast.error(error.message || "Failed to add deadline");
    } finally {
      setSavingDeadline(false);
    }
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

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Refresh data after onboarding
    window.location.reload();
  };

  // Don't render until we've checked onboarding status
  if (!onboardingChecked) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Onboarding Modal */}
      {showOnboarding && user && (
        <Onboarding
          userId={user.id}
          displayName={profile?.display_name ?? null}
          onComplete={handleOnboardingComplete}
        />
      )}
      
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

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Main Session Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
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
                      if (action.label === "Add Deadline") setDeadlineDialogOpen(true);
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
            {/* Phoenix Courses Card */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Phoenix Courses</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary gap-1"
                  onClick={() => navigate("/materials")}
                >
                  View all <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {courses.slice(0, 2).map((course) => (
                  <div 
                    key={course.id} 
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{course.title}</p>
                      {course.description && (
                        <p className="text-xs text-muted-foreground truncate">{course.description}</p>
                      )}
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <p className="text-sm text-muted-foreground">No courses available.</p>
                )}
              </div>
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

        {/* Your Materials - Full Width Rectangle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {materials.map((material) => {
              const hasUnits = materialUnits[material.id]?.length > 0;
              const progress = getMaterialProgress(material.id);
              
              return (
                <div 
                  key={material.id} 
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => hasUnits ? navigate(`/material/${material.id}`) : navigate("/materials")}
                >
                  <div className="relative w-12 h-12">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    {hasUnits && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-primary">{progress}%</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground text-center truncate w-full">{material.file_name}</p>
                  {hasUnits && (
                    <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all" 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {materials.length === 0 && (
              <div className="col-span-full text-center py-6">
                <p className="text-sm text-muted-foreground">No materials yet. Upload a PDF to get started.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add Deadline Dialog */}
      <Dialog open={deadlineDialogOpen} onOpenChange={setDeadlineDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Deadline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deadline-title">Title</Label>
              <Input
                id="deadline-title"
                placeholder="e.g., Essay due, Exam, Project deadline"
                value={deadlineTitle}
                onChange={(e) => setDeadlineTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadlineDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadlineDate ? format(deadlineDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={deadlineDate}
                    onSelect={setDeadlineDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline-time">Time</Label>
              <Input
                id="deadline-time"
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeadlineDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDeadline} disabled={savingDeadline}>
              {savingDeadline ? "Adding..." : "Add Deadline"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default DashboardNew;
