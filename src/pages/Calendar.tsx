import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, getWeek } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

const Calendar = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "10:00",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      
      const weekEnd = addDays(currentWeekStart, 7);
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", currentWeekStart.toISOString())
        .lt("start_time", weekEnd.toISOString())
        .order("start_time", { ascending: true });

      if (data && !error) {
        setEvents(data);
      }
    };

    fetchEvents();
  }, [user, currentWeekStart]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const handleAddEvent = async () => {
    if (!user || !newEvent.title) return;

    const startDateTime = new Date(`${newEvent.date}T${newEvent.startTime}`);
    const endDateTime = new Date(`${newEvent.date}T${newEvent.endTime}`);

    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    const { data, error } = await supabase.from("calendar_events").insert({
      user_id: user.id,
      title: newEvent.title,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
    }).select().single();

    if (error) {
      toast.error("Failed to add event");
      return;
    }

    setEvents(prev => [...prev, data]);
    setIsAddingEvent(false);
    setNewEvent({
      title: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "10:00",
    });
    toast.success("Event added!");
  };

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      toast.error("Failed to delete event");
      return;
    }

    setEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success("Event deleted");
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const weekNumber = getWeek(currentWeekStart);
  const monthName = format(currentWeekStart, "MMMM");

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.start_time);
      const eventHour = eventStart.getHours();
      return isSameDay(eventStart, day) && eventHour === hour;
    });
  };

  const getEventHeight = (event: CalendarEvent) => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(durationHours * 48, 24); // 48px per hour, minimum 24px
  };

  const getEventColor = (index: number) => {
    const colors = [
      "bg-blue-100 border-l-4 border-blue-500 text-blue-800",
      "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800",
      "bg-green-100 border-l-4 border-green-500 text-green-800",
      "bg-pink-100 border-l-4 border-pink-500 text-pink-800",
      "bg-purple-100 border-l-4 border-purple-500 text-purple-800",
    ];
    return colors[index % colors.length];
  };

  const handleTimeSlotClick = (day: Date, hour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    const formattedStartTime = `${hour.toString().padStart(2, "0")}:00`;
    const formattedEndTime = `${(hour + 1).toString().padStart(2, "0")}:00`;
    
    setNewEvent({
      title: "",
      date: formattedDate,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
    });
    setIsAddingEvent(true);
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow opacity-30 pointer-events-none" />
      
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-bold text-xl">Calendar</h1>
          </div>
          
          <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handleAddEvent} className="w-full">
                  Add Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Calendar Content */}
      <main className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {monthName} - Week {weekNumber}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Weekly Grid */}
          <div className="glass-card overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b border-border">
              <div className="p-3 text-sm text-muted-foreground"></div>
              {weekDays.map((day, index) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={index}
                    className={`p-3 text-center border-l border-border ${
                      isToday ? "bg-primary/10" : ""
                    }`}
                  >
                    <div className={`text-sm font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {format(day, "EEE")} {format(day, "d")}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="max-h-[600px] overflow-y-auto">
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-border min-h-[48px]">
                  <div className="p-2 text-xs text-muted-foreground flex items-start justify-end pr-3">
                    {hour === 12 ? "Noon" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const dayEvents = getEventsForDayAndHour(day, hour);
                    return (
                      <div
                        key={dayIndex}
                        className="border-l border-border relative min-h-[48px] cursor-pointer hover:bg-primary/5 transition-colors"
                        onClick={() => handleTimeSlotClick(day, hour)}
                      >
                        {dayEvents.map((event, eventIndex) => (
                          <div
                            key={event.id}
                            className={`absolute left-0 right-0 mx-1 p-1 rounded text-xs overflow-hidden group cursor-pointer z-10 ${getEventColor(eventIndex)}`}
                            style={{ height: `${getEventHeight(event)}px` }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-[10px]">
                                  {format(new Date(event.start_time), "h:mm a")}
                                </div>
                                <div className="font-semibold truncate">{event.title}</div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(event.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-black/10 rounded"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Calendar;
