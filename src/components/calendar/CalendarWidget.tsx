import { useState, useEffect } from "react";
import { Calendar, Clock, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GoogleCalendarConnect } from "./GoogleCalendarConnect";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_synced: boolean;
}

interface StudyGap {
  start: string;
  end: string;
  durationMinutes: number;
}

export const CalendarWidget = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [gaps, setGaps] = useState<StudyGap[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isConnected) {
      fetchEvents();
    }
  }, [isConnected]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar?action=get-events", {
        body: {}
      });

      if (error) throw error;
      setEvents(data?.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar?action=sync", {
        body: {}
      });

      if (error) throw error;
      
      setEvents(data?.events || []);
      toast.success("Calendar synced!");
      
      // Find study gaps after sync
      findGaps();
    } catch (error: any) {
      console.error("Error syncing calendar:", error);
      toast.error(error.message || "Failed to sync calendar");
    } finally {
      setSyncing(false);
    }
  };

  const findGaps = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar?action=find-gaps", {
        body: { minGapMinutes: 15 }
      });

      if (error) throw error;
      setGaps(data?.gaps || []);
    } catch (error) {
      console.error("Error finding gaps:", error);
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
    .filter(g => g.durationMinutes >= 15)
    .sort((a, b) => b.durationMinutes - a.durationMinutes)
    .slice(0, 3);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Schedule
        </h2>
        {isConnected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="gap-2"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sync
          </Button>
        )}
      </div>

      <div className="mb-4">
        <GoogleCalendarConnect onConnectionChange={setIsConnected} />
      </div>

      {!isConnected ? (
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">
            Connect your Google Calendar to find study opportunities
          </p>
          <p className="text-xs text-muted-foreground">
            We'll analyze your schedule and suggest the best times to study
          </p>
        </div>
      ) : loading ? (
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
                        className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50"
                      >
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatEventTime(event.start_time, event.end_time)}
                          </p>
                        </div>
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
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No upcoming events found
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="mt-2 gap-2"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Sync Calendar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
