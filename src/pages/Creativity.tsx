import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Bell, BellOff, Sparkles, Plus, Lightbulb, Target, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CreativityMindMap, { NodeConnection } from "@/components/creativity/CreativityMindMap";
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

interface InspirationConnection {
  id: string;
  inspiration_id: string;
  goal_id: string;
  insight_note: string | null;
}

interface DbNodeConnection {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
}

const Creativity = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isSubscribed, subscribe, isSupported } = usePushNotifications();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [connections, setConnections] = useState<InspirationConnection[]>([]);
  const [nodeConnections, setNodeConnections] = useState<NodeConnection[]>([]);
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
        const [goalsRes, interestsRes, inspirationsRes, connectionsRes, nodeConnectionsRes] = await Promise.all([
          supabase.from("goals").select("id, title, description, color").eq("user_id", user.id),
          supabase.from("interests").select("*").eq("user_id", user.id),
          supabase.from("inspirations").select("*").eq("user_id", user.id),
          supabase.from("inspiration_connections").select("*").eq("user_id", user.id),
          supabase.from("node_connections").select("id, source_type, source_id, target_type, target_id").eq("user_id", user.id)
        ]);

        if (goalsRes.data) setGoals(goalsRes.data);
        if (interestsRes.data) setInterests(interestsRes.data);
        if (inspirationsRes.data) setInspirations(inspirationsRes.data);
        if (connectionsRes.data) setConnections(connectionsRes.data);
        if (nodeConnectionsRes.data) {
          // Map DB format to component format
          const mapped: NodeConnection[] = nodeConnectionsRes.data.map((nc: DbNodeConnection) => ({
            id: nc.id,
            sourceType: nc.source_type as 'goal' | 'interest' | 'inspiration',
            sourceId: nc.source_id,
            targetType: nc.target_type as 'goal' | 'interest' | 'inspiration',
            targetId: nc.target_id,
          }));
          setNodeConnections(mapped);
        }
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

  // Handle new connection from mind map
  const handleConnect = useCallback(async (sourceType: string, sourceId: string, targetType: string, targetId: string) => {
    if (!user) return;

    // Special case: goal <-> inspiration uses the old inspiration_connections table
    if ((sourceType === 'goal' && targetType === 'inspiration') || 
        (sourceType === 'inspiration' && targetType === 'goal')) {
      const goalId = sourceType === 'goal' ? sourceId : targetId;
      const inspirationId = sourceType === 'inspiration' ? sourceId : targetId;
      
      try {
        const { data, error } = await supabase
          .from("inspiration_connections")
          .insert({
            user_id: user.id,
            inspiration_id: inspirationId,
            goal_id: goalId,
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            toast.info("This connection already exists");
            return;
          }
          throw error;
        }

        setConnections(prev => [...prev, data]);
        toast.success("Connection created!");
      } catch (error) {
        console.error("Error creating connection:", error);
        toast.error("Failed to create connection");
      }
      return;
    }

    // All other connections use node_connections table
    try {
      const { data, error } = await supabase
        .from("node_connections")
        .insert({
          user_id: user.id,
          source_type: sourceType,
          source_id: sourceId,
          target_type: targetType,
          target_id: targetId,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.info("This connection already exists");
          return;
        }
        throw error;
      }

      const newConn: NodeConnection = {
        id: data.id,
        sourceType: data.source_type as 'goal' | 'interest' | 'inspiration',
        sourceId: data.source_id,
        targetType: data.target_type as 'goal' | 'interest' | 'inspiration',
        targetId: data.target_id,
      };
      setNodeConnections(prev => [...prev, newConn]);
      toast.success("Connection created!");
    } catch (error) {
      console.error("Error creating connection:", error);
      toast.error("Failed to create connection");
    }
  }, [user]);

  // Handle disconnect from mind map
  const handleDisconnect = useCallback(async (connectionId: string, isNodeConnection?: boolean) => {
    try {
      if (isNodeConnection) {
        const { error } = await supabase
          .from("node_connections")
          .delete()
          .eq("id", connectionId);

        if (error) throw error;
        setNodeConnections(prev => prev.filter(c => c.id !== connectionId));
      } else {
        const { error } = await supabase
          .from("inspiration_connections")
          .delete()
          .eq("id", connectionId);

        if (error) throw error;
        setConnections(prev => prev.filter(c => c.id !== connectionId));
      }
      toast.success("Connection removed");
    } catch (error) {
      console.error("Error removing connection:", error);
      toast.error("Failed to remove connection");
    }
  }, []);

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
              connections={connections}
              nodeConnections={nodeConnections}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
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
