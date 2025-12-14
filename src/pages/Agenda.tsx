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
  Clock,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  category: "training" | "work" | "class" | "personal" | "deadline" | "exam";
  date: string;
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
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Sample events with state
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: "1", title: "Morning Practice", time: "6:00 AM", category: "training", date: format(addDays(weekStart, 6), "yyyy-MM-dd") },
    { id: "2", title: "Economics Lecture", time: "10:00 AM", category: "class", date: format(addDays(weekStart, 6), "yyyy-MM-dd") },
    { id: "3", title: "Afternoon Conditioning", time: "3:00 PM", category: "training", date: format(addDays(weekStart, 6), "yyyy-MM-dd") },
    { id: "4", title: "Team Meeting", time: "2:00 PM", category: "work", date: format(addDays(weekStart, 4), "yyyy-MM-dd") },
    { id: "5", title: "Midterm Exam", time: "9:00 AM", category: "exam", date: format(addDays(weekStart, 3), "yyyy-MM-dd") },
  ]);

  const navigateWeek = (direction: number) => {
    setCurrentDate(prev => addDays(prev, direction * 7));
  };

  const getEventsForDate = (dateKey: string) => {
    return events.filter(event => event.date === dateKey);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", event.id);
    
    // Add a slight delay for visual feedback
    const target = e.target as HTMLElement;
    setTimeout(() => {
      target.style.opacity = "0.5";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
    setDraggedEvent(null);
    setDragOverDate(null);
  };

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(dateKey);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!draggedEvent) return;

    // Don't do anything if dropped on the same date
    if (draggedEvent.date === targetDate) {
      setDraggedEvent(null);
      return;
    }

    // Update the event's date
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === draggedEvent.id
          ? { ...event, date: targetDate }
          : event
      )
    );

    toast.success(`Moved "${draggedEvent.title}" to ${format(new Date(targetDate), "MMM d")}`);
    setDraggedEvent(null);
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
              Drag and drop events to reschedule
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
            const dayEvents = getEventsForDate(dateKey);
            const isToday = isSameDay(day, new Date());
            const isDragOver = dragOverDate === dateKey;

            return (
              <div
                key={i}
                onDragOver={(e) => handleDragOver(e, dateKey)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dateKey)}
                className={`min-h-[200px] rounded-2xl border p-3 transition-all duration-200 ${
                  isDragOver
                    ? "bg-primary/10 border-primary border-2 scale-[1.02]"
                    : isToday
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
                    const isDragging = draggedEvent?.id === event.id;
                    
                    return (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, event)}
                        onDragEnd={handleDragEnd}
                        className={`p-2 rounded-lg border text-xs cursor-grab active:cursor-grabbing transition-all ${
                          categoryColors[event.category]
                        } ${isDragging ? "opacity-50 scale-95" : "hover:scale-[1.02] hover:shadow-md"}`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <GripVertical className="w-3 h-3 opacity-50" />
                          <Icon className="w-3 h-3" />
                          <span className="font-medium truncate flex-1">{event.title}</span>
                        </div>
                        <p className="opacity-75 pl-4">{event.time}</p>
                      </div>
                    );
                  })}
                  
                  {/* Drop zone indicator when dragging */}
                  {isDragOver && dayEvents.length === 0 && (
                    <div className="p-3 rounded-lg border-2 border-dashed border-primary/50 text-center text-xs text-primary">
                      Drop here
                    </div>
                  )}
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