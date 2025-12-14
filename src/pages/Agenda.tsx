import { useState, useEffect } from "react";
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
  GripVertical,
  Loader2,
  Pencil,
  Trash2
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays, startOfWeek, isSameDay, parseISO, setHours, setMinutes } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";

interface CalendarEvent {
  id: string;
  title: string;
  display_time: string;
  category: "training" | "work" | "class" | "personal" | "deadline" | "exam";
  start_time: string;
  end_time: string;
}

type EventCategory = CalendarEvent["category"];

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

const categories: { key: EventCategory; label: string; icon: typeof Dumbbell }[] = [
  { key: "training", label: "Training", icon: Dumbbell },
  { key: "work", label: "Work", icon: Briefcase },
  { key: "class", label: "Class", icon: GraduationCap },
  { key: "personal", label: "Personal", icon: User },
  { key: "deadline", label: "Deadline", icon: AlertCircle },
  { key: "exam", label: "Exam", icon: Clock },
];

const Agenda = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("09:00");
  const [newEventCategory, setNewEventCategory] = useState<EventCategory>("personal");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch events from database
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
        toast.error("Failed to load events");
      } else {
        setEvents(data.map(e => ({
          id: e.id,
          title: e.title,
          display_time: e.display_time || format(parseISO(e.start_time), "h:mm a"),
          category: (e.category || "personal") as EventCategory,
          start_time: e.start_time,
          end_time: e.end_time,
        })));
      }
      setLoading(false);
    };

    fetchEvents();
  }, [user]);

  const navigateWeek = (direction: number) => {
    setCurrentDate(prev => addDays(prev, direction * 7));
  };

  const getEventsForDate = (dateKey: string) => {
    return events.filter(event => {
      const eventDate = format(parseISO(event.start_time), "yyyy-MM-dd");
      return eventDate === dateKey;
    });
  };

  // Open modal for new event
  const openAddEventModal = (date?: Date) => {
    setIsEditMode(false);
    setEditingEvent(null);
    setSelectedDate(date || new Date());
    setNewEventTitle("");
    setNewEventTime("09:00");
    setNewEventCategory("personal");
    setIsModalOpen(true);
  };

  // Open modal for editing event
  const openEditEventModal = (event: CalendarEvent) => {
    setIsEditMode(true);
    setEditingEvent(event);
    setSelectedDate(parseISO(event.start_time));
    setNewEventTitle(event.title);
    const eventTime = format(parseISO(event.start_time), "HH:mm");
    setNewEventTime(eventTime);
    setNewEventCategory(event.category);
    setOpenPopoverId(null);
    setIsModalOpen(true);
  };

  // Create new event
  const handleCreateEvent = async () => {
    if (!user || !newEventTitle.trim()) {
      toast.error("Please enter an event title");
      return;
    }

    setIsCreating(true);

    const [hours, minutes] = newEventTime.split(":").map(Number);
    const startTime = setMinutes(setHours(selectedDate, hours), minutes);
    const endTime = setMinutes(setHours(selectedDate, hours + 1), minutes);
    const displayTime = format(startTime, "h:mm a");

    const { data, error } = await supabase
      .from("calendar_events")
      .insert([{
        user_id: user.id,
        title: newEventTitle.trim(),
        display_time: displayTime,
        category: newEventCategory,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    } else {
      setEvents(prev => [...prev, {
        id: data.id,
        title: data.title,
        display_time: displayTime,
        category: newEventCategory,
        start_time: data.start_time,
        end_time: data.end_time,
      }]);
      toast.success("Event created successfully!");
      setIsModalOpen(false);
    }

    setIsCreating(false);
  };

  // Update existing event
  const handleUpdateEvent = async () => {
    if (!user || !editingEvent || !newEventTitle.trim()) {
      toast.error("Please enter an event title");
      return;
    }

    setIsCreating(true);

    const [hours, minutes] = newEventTime.split(":").map(Number);
    const startTime = setMinutes(setHours(selectedDate, hours), minutes);
    const endTime = setMinutes(setHours(selectedDate, hours + 1), minutes);
    const displayTime = format(startTime, "h:mm a");

    const { error } = await supabase
      .from("calendar_events")
      .update({
        title: newEventTitle.trim(),
        display_time: displayTime,
        category: newEventCategory,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      })
      .eq("id", editingEvent.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    } else {
      setEvents(prev => prev.map(e => 
        e.id === editingEvent.id 
          ? {
              ...e,
              title: newEventTitle.trim(),
              display_time: displayTime,
              category: newEventCategory,
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
            }
          : e
      ));
      toast.success("Event updated successfully!");
      setIsModalOpen(false);
    }

    setIsCreating(false);
  };

  // Delete event
  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (!user) return;

    setIsDeleting(true);

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", event.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    } else {
      setEvents(prev => prev.filter(e => e.id !== event.id));
      toast.success("Event deleted");
      setOpenPopoverId(null);
    }

    setIsDeleting(false);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", event.id);
    
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

  const handleDrop = async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!draggedEvent || !user) return;

    const currentEventDate = format(parseISO(draggedEvent.start_time), "yyyy-MM-dd");
    if (currentEventDate === targetDate) {
      setDraggedEvent(null);
      return;
    }

    const oldStart = parseISO(draggedEvent.start_time);
    const oldEnd = parseISO(draggedEvent.end_time);
    const targetDateObj = parseISO(targetDate);

    const newStart = new Date(targetDateObj);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);

    const newEnd = new Date(targetDateObj);
    newEnd.setHours(oldEnd.getHours(), oldEnd.getMinutes(), 0, 0);

    const { error } = await supabase
      .from("calendar_events")
      .update({
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      })
      .eq("id", draggedEvent.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to move event");
    } else {
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === draggedEvent.id
            ? { ...event, start_time: newStart.toISOString(), end_time: newEnd.toISOString() }
            : event
        )
      );
      toast.success(`Moved "${draggedEvent.title}" to ${format(targetDateObj, "MMM d")}`);
    }

    setDraggedEvent(null);
  };

  const handleDayClick = (day: Date) => {
    openAddEventModal(day);
  };

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
              Click events to edit or delete
            </p>
          </div>
          <Button 
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={() => openAddEventModal()}
          >
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

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
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
                    onClick={() => handleDayClick(day)}
                    onDragOver={(e) => handleDragOver(e, dateKey)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dateKey)}
                    className={`min-h-[200px] rounded-2xl border p-3 transition-all duration-200 cursor-pointer ${
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

                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      {dayEvents.map(event => {
                        const Icon = categoryIcons[event.category] || User;
                        const isDragging = draggedEvent?.id === event.id;
                        
                        return (
                          <Popover 
                            key={event.id} 
                            open={openPopoverId === event.id}
                            onOpenChange={(open) => setOpenPopoverId(open ? event.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, event)}
                                onDragEnd={handleDragEnd}
                                className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                  categoryColors[event.category] || categoryColors.personal
                                } ${isDragging ? "opacity-50 scale-95" : "hover:scale-[1.02] hover:shadow-md"}`}
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  <GripVertical className="w-3 h-3 opacity-50 cursor-grab" />
                                  <Icon className="w-3 h-3" />
                                  <span className="font-medium truncate flex-1">{event.title}</span>
                                </div>
                                <p className="opacity-75 pl-4">{event.display_time}</p>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2 bg-card border-border" align="start">
                              <div className="space-y-1">
                                <button
                                  onClick={() => openEditEventModal(event)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors text-foreground"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Edit Event
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event)}
                                  disabled={isDeleting}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                  Delete Event
                                </button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                      
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
          </>
        )}

        {/* Add/Edit Event Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {isEditMode ? "Edit Event" : "Add New Event"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              {/* Date Display */}
              <div className="text-center p-3 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">Selected Date</p>
                <p className="text-lg font-semibold text-foreground">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </p>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">Event Title</Label>
                <Input
                  id="title"
                  placeholder="Enter event title..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="bg-background"
                />
              </div>

              {/* Time Input */}
              <div className="space-y-2">
                <Label htmlFor="time" className="text-foreground">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="bg-background"
                />
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <Label className="text-foreground">Category</Label>
                <Select value={newEventCategory} onValueChange={(v) => setNewEventCategory(v as EventCategory)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {categories.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.key} value={cat.key}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{cat.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={isEditMode ? handleUpdateEvent : handleCreateEvent}
                  disabled={isCreating || !newEventTitle.trim()}
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isEditMode ? (
                    "Save Changes"
                  ) : (
                    "Create Event"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Agenda;