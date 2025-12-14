import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Dumbbell,
  Briefcase,
  GraduationCap,
  User,
  AlertCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  category: "training" | "work" | "class" | "personal" | "deadline" | "exam";
}

const categoryColors = {
  training: "bg-green-100 text-green-600 border-green-200",
  work: "bg-blue-100 text-blue-600 border-blue-200",
  class: "bg-yellow-100 text-yellow-600 border-yellow-200",
  personal: "bg-purple-100 text-purple-600 border-purple-200",
  deadline: "bg-red-100 text-red-600 border-red-200",
  exam: "bg-orange-100 text-orange-600 border-orange-200",
};

const categoryIcons = {
  training: Dumbbell,
  work: Briefcase,
  class: GraduationCap,
  personal: User,
  deadline: AlertCircle,
  exam: Clock,
};

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Sample events
  const events: Record<string, CalendarEvent[]> = {
    [format(addDays(weekStart, 6), "yyyy-MM-dd")]: [
      { id: "1", title: "Morning Practice", time: "6:00 AM", category: "training" },
      { id: "2", title: "Economics Lecture", time: "10:00 AM", category: "class" },
      { id: "3", title: "Afternoon Conditioning", time: "3:00 PM", category: "training" },
    ],
  };

  const navigateWeek = (direction: number) => {
    setCurrentDate(prev => addDays(prev, direction * 7));
  };

  const categories = [
    { key: "training", label: "Training", icon: Dumbbell },
    { key: "work", label: "Work", icon: Briefcase },
    { key: "class", label: "Class", icon: GraduationCap },
    { key: "personal", label: "Personal", icon: User },
    { key: "deadline", label: "Deadline", icon: AlertCircle },
    { key: "exam", label: "Exam", icon: Clock },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Agenda</h1>
            <p className="text-muted-foreground">
              Add your schedule and deadlines
            </p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Add Event
          </Button>
        </motion.div>

        {/* Week Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <p className="text-sm text-muted-foreground">
              Week of {format(weekStart, "MMM d")}
            </p>
          </div>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-7 gap-3 mb-8"
        >
          {days.map((day, i) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEvents = events[dateKey] || [];
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={i}
                className={`min-h-[200px] rounded-2xl border p-3 transition-colors ${
                  isToday
                    ? "bg-primary/5 border-primary"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <div className="text-center mb-3">
                  <p className="text-xs text-muted-foreground uppercase">
                    {format(day, "EEE")}
                  </p>
                  <p className={`text-xl font-semibold ${
                    isToday ? "text-primary" : "text-foreground"
                  }`}>
                    {format(day, "d")}
                  </p>
                </div>

                <div className="space-y-2">
                  {dayEvents.map(event => {
                    const Icon = categoryIcons[event.category];
                    return (
                      <div
                        key={event.id}
                        className={`p-2 rounded-lg border text-xs ${categoryColors[event.category]}`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <Icon className="w-3 h-3" />
                          <span className="font-medium truncate">{event.title}</span>
                        </div>
                        <p className="opacity-75">{event.time}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Category Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Agenda;
