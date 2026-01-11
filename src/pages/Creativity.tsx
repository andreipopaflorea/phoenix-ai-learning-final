import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Bell, BellOff, Sparkles, Plus, Lightbulb, Target, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CreativityMindMap from "@/components/creativity/CreativityMindMap";
import InspirationUploadDialog from "@/components/creativity/InspirationUploadDialog";
import AddInterestDialog from "@/components/creativity/AddInterestDialog";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
}

interface Interest {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
}

interface Inspiration {
  id: string;
  title: string;
  description: string | null;
  hidden_insight: string | null;
  connected_goal_id: string | null;
  insight_strength: number | null;
}

const Creativity = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isSubscribed, subscribe, isSupported } = usePushNotifications();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [interestDialogOpen, setInterestDialogOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Fetch data
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [goalsRes, interestsRes, inspirationsRes] = await Promise.all([
          supabase.from("goals").select("id, title, description, color").eq("user_id", user.id),
          supabase.from("interests").select("*").eq("user_id", user.id),
          supabase.from("inspirations").select("*").eq("user_id", user.id)
        ]);

        if (goalsRes.data) setGoals(goalsRes.data);
        if (interestsRes.data) setInterests(interestsRes.data);
        if (inspirationsRes.data) setInspirations(inspirationsRes.data);
      } catch (error) {
        console.error("Error fetching creativity data:", error);
        toast.error("Failed to load creativity data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Sync notification state
  useEffect(() => {
    setNotificationsEnabled(isSubscribed);
  }, [isSubscribed]);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await subscribe();
      if (success) {
        setNotificationsEnabled(true);
        toast.success("You'll be notified of hidden insights!");
      }
    } else {
      setNotificationsEnabled(false);
      toast.info("Insight notifications disabled");
    }
  };

  const handleInspirationUploaded = (newInspiration: Inspiration) => {
    setInspirations(prev => [...prev, newInspiration]);
  };

  const handleInterestAdded = (newInterest: Interest) => {
    setInterests(prev => [...prev, newInterest]);
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-border bg-card/50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-primary">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Creativity Hub</h1>
              <p className="text-sm text-muted-foreground">Your AI-powered second brain</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Notification Toggle */}
            {isSupported && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary">
                {notificationsEnabled ? (
                  <Bell className="w-4 h-4 text-primary" />
                ) : (
                  <BellOff className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm text-foreground">Notify me</span>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
            )}

            {/* Add Interest Button */}
            <Button
              variant="outline"
              onClick={() => setInterestDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Interest
            </Button>

            {/* Upload Inspiration Button */}
            <Button
              onClick={() => setUploadDialogOpen(true)}
              className="gap-2 bg-gradient-primary hover:opacity-90"
            >
              <Upload className="w-4 h-4" />
              Upload Inspiration
            </Button>
          </div>
        </motion.header>

        {/* Mind Map Area */}
        <div className="flex-1 relative bg-gradient-to-br from-background via-background to-secondary/20">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Loading your creative universe...</p>
              </div>
            </div>
          ) : (
            <CreativityMindMap
              goals={goals}
              interests={interests}
              inspirations={inspirations}
            />
          )}

          {/* Empty State Hint */}
          {!loading && goals.length === 0 && interests.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="text-center space-y-4 p-8 max-w-md">
                <div className="flex justify-center gap-4">
                  <Target className="w-12 h-12 text-primary/50" />
                  <Lightbulb className="w-12 h-12 text-secondary-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Start Building Your Mind</h3>
                <p className="text-muted-foreground">
                  Add goals and interests to see your creative universe come to life. 
                  Upload inspiration to discover hidden connections!
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Dialogs */}
        <InspirationUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          goals={goals}
          onUploaded={handleInspirationUploaded}
        />

        <AddInterestDialog
          open={interestDialogOpen}
          onOpenChange={setInterestDialogOpen}
          onAdded={handleInterestAdded}
        />
      </div>
    </AppLayout>
  );
};

export default Creativity;
