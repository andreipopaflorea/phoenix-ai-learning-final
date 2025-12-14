import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";

type LearningStyle = "visual" | "auditory" | "reading_writing" | "kinesthetic";

const learningStyles = [
  { value: "visual", label: "Visual - Images, diagrams, charts" },
  { value: "auditory", label: "Auditory - Listening, discussion" },
  { value: "reading_writing", label: "Reading/Writing - Text, notes" },
  { value: "kinesthetic", label: "Kinesthetic - Hands-on, practice" },
];

const goalTypes = [
  { value: "exam", label: "Pass an exam" },
  { value: "course", label: "Finish a course" },
  { value: "consistency", label: "Build study consistency" },
];

const dailyTargets = ["10m", "20m", "30m", "45m", "60m"];

const pocketLengths = [
  { value: "5-10", label: "5-10 minutes (Quick)" },
  { value: "10-20", label: "10-20 minutes (Balanced)" },
  { value: "20-30", label: "20-30 minutes (Deep)" },
];

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [learningStyle, setLearningStyle] = useState<LearningStyle>("visual");
  const [goalType, setGoalType] = useState("exam");
  const [dailyTarget, setDailyTarget] = useState("20m");
  const [pocketLength, setPocketLength] = useState("10-20");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      // Fetch learning style
      const { data: prefData } = await supabase
        .from("user_learning_preferences")
        .select("learning_style")
        .eq("user_id", user.id)
        .maybeSingle();

      if (prefData) {
        setLearningStyle(prefData.learning_style as LearningStyle);
      }

      // Fetch user settings
      const { data: settingsData } = await supabase
        .from("user_settings")
        .select("goal_type, daily_target, pocket_length")
        .eq("user_id", user.id)
        .maybeSingle();

      if (settingsData) {
        setGoalType(settingsData.goal_type);
        setDailyTarget(settingsData.daily_target);
        setPocketLength(settingsData.pocket_length);
      }
    };

    fetchPreferences();
  }, [user]);

  const saveSettings = async (updates: { goal_type?: string; daily_target?: string; pocket_length?: string }) => {
    if (!user) return;
    setSaving(true);

    try {
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_settings")
          .update(updates)
          .eq("user_id", user.id);
      } else {
        await supabase.from("user_settings").insert([{
          user_id: user.id,
          goal_type: updates.goal_type ?? goalType,
          daily_target: updates.daily_target ?? dailyTarget,
          pocket_length: updates.pocket_length ?? pocketLength,
        }]);
      }

      toast.success("Settings saved!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLearningStyleChange = async (value: string) => {
    if (!user) return;
    setSaving(true);

    try {
      const { data: existing } = await supabase
        .from("user_learning_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_learning_preferences")
          .update({ learning_style: value as LearningStyle })
          .eq("user_id", user.id);
      } else {
        await supabase.from("user_learning_preferences").insert([{
          user_id: user.id,
          learning_style: value as LearningStyle,
        }]);
      }

      setLearningStyle(value as LearningStyle);
      toast.success("Learning style saved!");
    } catch (error) {
      toast.error("Failed to save preference");
    } finally {
      setSaving(false);
    }
  };

  const handleGoalTypeChange = (value: string) => {
    setGoalType(value);
    saveSettings({ goal_type: value });
  };

  const handleDailyTargetChange = (value: string) => {
    setDailyTarget(value);
    saveSettings({ daily_target: value });
  };

  const handlePocketLengthChange = (value: string) => {
    setPocketLength(value);
    saveSettings({ pocket_length: value });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-1">Settings</h1>
          <p className="text-muted-foreground">
            Customize your learning experience
          </p>
        </motion.div>

        {/* Learning Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Learning Preferences</h2>
              <p className="text-sm text-muted-foreground">How you like to learn</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Learning Style
              </label>
              <Select value={learningStyle} onValueChange={handleLearningStyleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {learningStyles.map(style => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Goal Type
              </label>
              <Select value={goalType} onValueChange={handleGoalTypeChange} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {goalTypes.map(goal => (
                    <SelectItem key={goal.value} value={goal.value}>
                      {goal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Time Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Time Preferences</h2>
              <p className="text-sm text-muted-foreground">Session length and daily targets</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Daily Target (minutes)
              </label>
              <div className="flex gap-2">
                {dailyTargets.map(target => (
                  <button
                    key={target}
                    onClick={() => handleDailyTargetChange(target)}
                    disabled={saving}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      dailyTarget === target
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-foreground hover:border-primary/50"
                    } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {target}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Preferred Pocket Length
              </label>
              <Select value={pocketLength} onValueChange={handlePocketLengthChange} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pocketLengths.map(length => (
                    <SelectItem key={length.value} value={length.value}>
                      {length.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            variant="outline" 
            className="w-full gap-2 text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
