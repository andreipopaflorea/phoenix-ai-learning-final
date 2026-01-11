import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  loading: boolean;
}

// Get the VAPID public key from edge function
const getVapidPublicKey = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: { action: 'get-vapid-key' }
    });
    
    if (error) throw error;
    return data?.vapidPublicKey || null;
  } catch (error) {
    console.error('Failed to get VAPID key:', error);
    return null;
  }
};

// Convert base64 string to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    loading: true
  });

  // Check if running in iframe (push won't work in iframes)
  const isInIframe = useCallback(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }, []);

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    // Push notifications don't work in iframes
    if (isInIframe()) {
      console.log('[Push] Running in iframe - push not supported');
      return false;
    }
    const supported = 'serviceWorker' in navigator && 
                      'PushManager' in window && 
                      'Notification' in window;
    return supported;
  }, [isInIframe]);

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!checkSupport() || !user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      // Also check if subscription exists in database
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      setState({
        isSupported: true,
        isSubscribed: !!subscription && (data?.length ?? 0) > 0,
        permission: Notification.permission,
        loading: false
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setState(prev => ({ 
        ...prev, 
        isSupported: checkSupport(),
        loading: false 
      }));
    }
  }, [user, checkSupport]);

  // Request permission and subscribe
  const subscribe = useCallback(async (): Promise<boolean> => {
    console.log('[Push] Starting subscribe...');
    
    if (!user) {
      toast.error('Please sign in to enable notifications');
      return false;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Request permission
      console.log('[Push] Requesting permission...');
      const permission = await Notification.requestPermission();
      console.log('[Push] Permission result:', permission);
      
      if (permission !== 'granted') {
        toast.error('Notification permission denied');
        setState(prev => ({ ...prev, permission, loading: false }));
        return false;
      }

      // Get VAPID public key
      console.log('[Push] Getting VAPID key...');
      const vapidPublicKey = await getVapidPublicKey();
      console.log('[Push] VAPID key received:', vapidPublicKey ? 'yes' : 'no');
      
      if (!vapidPublicKey) {
        toast.error('Failed to get notification configuration');
        setState(prev => ({ ...prev, loading: false }));
        return false;
      }

      // Register service worker if not already registered
      console.log('[Push] Waiting for service worker...');
      const registration = await navigator.serviceWorker.ready;
      console.log('[Push] Service worker ready');

      // Subscribe to push notifications
      console.log('[Push] Subscribing to push manager...');
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });
      console.log('[Push] Subscription created:', subscription.endpoint.substring(0, 50));

      const subscriptionJson = subscription.toJSON();
      console.log('[Push] Subscription JSON:', JSON.stringify(subscriptionJson).substring(0, 100));

      // Save subscription to database
      console.log('[Push] Saving to database...');
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys!.p256dh,
        auth: subscriptionJson.keys!.auth,
        user_agent: navigator.userAgent
      }, {
        onConflict: 'user_id,endpoint'
      });

      if (error) {
        console.error('[Push] Database error:', error);
        throw error;
      }
      console.log('[Push] Saved to database');

      // Update notification preferences
      console.log('[Push] Updating preferences...');
      await supabase.from('notification_preferences').upsert({
        user_id: user.id,
        push_enabled: true
      }, {
        onConflict: 'user_id'
      });

      toast.success('Push notifications enabled!');
      setState({
        isSupported: true,
        isSubscribed: true,
        permission: 'granted',
        loading: false
      });
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Failed to enable notifications');
      setState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, [user]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from database
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      // Update preferences
      await supabase
        .from('notification_preferences')
        .update({ push_enabled: false })
        .eq('user_id', user.id);

      toast.success('Push notifications disabled');
      setState(prev => ({
        ...prev,
        isSubscribed: false,
        loading: false
      }));
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to disable notifications');
      setState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, [user]);

  // Send a test notification
  const sendTestNotification = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          action: 'send',
          userId: user.id,
          title: '🎉 Test Notification',
          body: 'Push notifications are working!',
          url: '/settings'
        }
      });

      if (error) throw error;
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Error sending test:', error);
      toast.error('Failed to send test notification');
    }
  }, [user]);

  // Initialize on mount
  useEffect(() => {
    setState(prev => ({ ...prev, isSupported: checkSupport() }));
    checkSubscription();
  }, [checkSupport, checkSubscription]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification,
    refresh: checkSubscription
  };
}
