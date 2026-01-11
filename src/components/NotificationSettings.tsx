import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Clock, Target, BookOpen, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NotificationPreferences {
  study_reminder_enabled: boolean;
  study_reminder_time: string;
  goal_deadline_enabled: boolean;
  flashcard_reminder_enabled: boolean;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = usePushNotifications();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    study_reminder_enabled: true,
    study_reminder_time: '09:00',
    goal_deadline_enabled: true,
    flashcard_reminder_enabled: true
  });
  const [saving, setSaving] = useState(false);

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setPreferences({
          study_reminder_enabled: data.study_reminder_enabled,
          study_reminder_time: data.study_reminder_time?.substring(0, 5) || '09:00',
          goal_deadline_enabled: data.goal_deadline_enabled,
          flashcard_reminder_enabled: data.flashcard_reminder_enabled
        });
      }
    };

    fetchPreferences();
  }, [user]);

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean | string) => {
    if (!user) return;
    setSaving(true);

    try {
      const updateData = { [key]: value };
      
      // Handle time format for database
      if (key === 'study_reminder_time' && typeof value === 'string') {
        updateData[key] = value + ':00';
      }

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...updateData
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setPreferences(prev => ({
        ...prev,
        [key]: value
      }));
    } catch (error) {
      console.error('Failed to update preference:', error);
      toast.error('Failed to save preference');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  // Check if running in iframe
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  })();

  // Not supported message (including iframe case)
  if (!isSupported) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <BellOff className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              {isInIframe ? 'Open in new tab to enable' : 'Not supported in this browser'}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            {isInIframe 
              ? 'Push notifications cannot work inside the preview iframe. Click the "Open in new tab" button above to test notifications.'
              : 'Push notifications require a modern browser with service worker support. Try using Chrome, Firefox, or Edge.'}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
          <Bell className="w-6 h-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">Push Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Get reminded to study and track your goals
          </p>
        </div>
      </div>

      {/* Main toggle */}
      <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl mb-4">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium text-foreground">
              {isSubscribed ? 'Notifications enabled' : 'Enable notifications'}
            </p>
            <p className="text-xs text-muted-foreground">
              {permission === 'denied' 
                ? 'Permission blocked - check browser settings' 
                : isSubscribed 
                  ? 'You will receive study reminders' 
                  : 'Allow notifications to get reminders'}
            </p>
          </div>
        </div>
        <Button
          variant={isSubscribed ? 'outline' : 'default'}
          size="sm"
          onClick={handleToggleNotifications}
          disabled={loading || permission === 'denied'}
        >
          {loading ? 'Loading...' : isSubscribed ? 'Disable' : 'Enable'}
        </Button>
      </div>

      {/* Notification preferences - only show when subscribed */}
      {isSubscribed && (
        <div className="space-y-4 mt-6">
          <h3 className="text-sm font-medium text-foreground">Notification Types</h3>
          
          {/* Study reminder */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="study-reminder" className="font-medium">Daily study reminder</Label>
                <p className="text-xs text-muted-foreground">Get reminded to study every day</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {preferences.study_reminder_enabled && (
                <Input
                  type="time"
                  value={preferences.study_reminder_time}
                  onChange={(e) => updatePreference('study_reminder_time', e.target.value)}
                  className="w-24 h-8 text-sm"
                  disabled={saving}
                />
              )}
              <Switch
                id="study-reminder"
                checked={preferences.study_reminder_enabled}
                onCheckedChange={(checked) => updatePreference('study_reminder_enabled', checked)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Goal deadlines */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="goal-deadline" className="font-medium">Goal deadline alerts</Label>
                <p className="text-xs text-muted-foreground">Notify 24h and 1h before deadlines</p>
              </div>
            </div>
            <Switch
              id="goal-deadline"
              checked={preferences.goal_deadline_enabled}
              onCheckedChange={(checked) => updatePreference('goal_deadline_enabled', checked)}
              disabled={saving}
            />
          </div>

          {/* Flashcard reminders */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="flashcard-reminder" className="font-medium">Flashcard reviews due</Label>
                <p className="text-xs text-muted-foreground">Remind when cards are ready for review</p>
              </div>
            </div>
            <Switch
              id="flashcard-reminder"
              checked={preferences.flashcard_reminder_enabled}
              onCheckedChange={(checked) => updatePreference('flashcard_reminder_enabled', checked)}
              disabled={saving}
            />
          </div>

          {/* Test notification button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 gap-2"
            onClick={sendTestNotification}
          >
            <Send className="w-4 h-4" />
            Send test notification
          </Button>
        </div>
      )}
    </motion.div>
  );
}
