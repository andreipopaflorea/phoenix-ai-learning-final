import { useState, useEffect } from "react";
import { Calendar, Clock, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isToday, isTomorrow, parseISO, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

interface StudyGap {
  start: string;
  end: string;
  durationMinutes: number;
}

export const CalendarWidget = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [gaps, setGaps] = useState<StudyGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const weekFromNow = addDays(now, 7);

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", now.toISOString())
        .lte("start_time", weekFromNow.toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
      
      // Calculate study gaps
      calculateGaps(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGaps = (eventList: CalendarEvent[]) => {
    const foundGaps: StudyGap[] = [];
    const now = new Date();
    const weekFromNow = addDays(now, 7);
    
    // Sort events by start time
    const sorted = [...eventList].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    // Find gaps between 8 AM and 10 PM
    for (let day = 0; day < 7; day++) {
      const currentDate = addDays(now, day);
      const dayStart = new Date(currentDate);
      dayStart.setHours(8, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(22, 0, 0, 0);

      // Get events for this day
      const dayEvents = sorted.filter((e) => {
        const eventDate = new Date(e.start_time);
        return eventDate.toDateString() === currentDate.toDateString();
      });

      let lastEnd = dayStart;

      for (const event of dayEvents) {
        const eventStart = new Date(event.start_time);
        const eventEnd = new Date(event.end_time);

        if (eventStart > lastEnd) {
          const gapMinutes = Math.floor((eventStart.getTime() - lastEnd.getTime()) / 60000);
          if (gapMinutes >= 15) {
            foundGaps.push({
              start: lastEnd.toISOString(),
              end: eventStart.toISOString(),
              durationMinutes: gapMinutes,
            });
          }
        }
        if (eventEnd > lastEnd) {
          lastEnd = eventEnd;
        }
      }

      // Gap after last event until 10 PM
      if (lastEnd < dayEnd) {
        const gapMinutes = Math.floor((dayEnd.getTime() - lastEnd.getTime()) / 60000);
        if (gapMinutes >= 15) {
          foundGaps.push({
            start: lastEnd.toISOString(),
            end: dayEnd.toISOString(),
            durationMinutes: gapMinutes,
          });
        }
      }
    }

    setGaps(foundGaps);
  };

  const handleAddEvent = async () => {
    if (!title.trim()) {
      toast.error("Please enter an event title");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);

      if (endDateTime <= startDateTime) {
        toast.error("End time must be after start time");
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("calendar_events").insert({
        user_id: user.id,
        title: title.trim(),
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      });

      if (error) throw error;

      toast.success("Event added!");
      setDialogOpen(false);
      setTitle("");
      setStartTime("09:00");
      setEndTime("10:00");
      fetchEvents();
    } catch (error: any) {
      console.error("Error adding event:", error);
      toast.error(error.message || "Failed to add event");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
      
      toast.success("Event deleted");
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const formatEventTime = (startTime: string, endTime: string) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = parseISO(event.start_time).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  // Get best study opportunities (top 3 gaps)
  const bestGaps = gaps
    .filter((g) => g.durationMinutes >= 15)
    .sort((a, b) => b.durationMinutes - a.durationMinutes)
    .slice(0, 3);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Schedule
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Calendar Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Work, Gym, Class"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Start Time</Label>
                  <Input
                    id="start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End Time</Label>
                  <Input
                    id="end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleAddEvent} disabled={saving} className="w-full">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Add Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Study Opportunities */}
          {bestGaps.length > 0 && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2 text-primary">
                <Sparkles className="w-4 h-4" />
                Study Opportunities
              </h3>
              <div className="space-y-2">
                {bestGaps.map((gap, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {getDateLabel(gap.start)} at {format(parseISO(gap.start), "h:mm a")}
                    </span>
                    <span className="font-medium">{gap.durationMinutes} min</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {Object.keys(groupedEvents).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(groupedEvents).slice(0, 3).map(([date, dayEvents]) => (
                <div key={date}>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {getDateLabel(dayEvents[0].start_time)}
                  </p>
                  <div className="space-y-2">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 group"
                      >
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatEventTime(event.start_time, event.end_time)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-2">
                        +{dayEvents.length - 3} more events
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                No upcoming events
              </p>
              <p className="text-xs text-muted-foreground">
                Add your schedule to find study opportunities
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
