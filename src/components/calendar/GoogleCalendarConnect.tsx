import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Link, Unlink } from "lucide-react";
import { toast } from "sonner";

interface GoogleCalendarConnectProps {
  onConnectionChange?: (connected: boolean) => void;
}

export const GoogleCalendarConnect = ({ onConnectionChange }: GoogleCalendarConnectProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
    
    // Handle OAuth callback
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    
    if (code && state) {
      handleOAuthCallback(code);
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await supabase.functions.invoke("google-calendar?action=check-status", {
        body: {}
      });
      
      if (response.data?.connected !== undefined) {
        setIsConnected(response.data.connected);
        onConnectionChange?.(response.data.connected);
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.functions.invoke("google-calendar?action=get-auth-url", {
        body: { redirectUrl }
      });

      if (error) throw error;
      
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      console.error("Error getting auth URL:", error);
      toast.error("Failed to connect to Google Calendar");
      setConnecting(false);
    }
  };

  const handleOAuthCallback = async (code: string) => {
    setConnecting(true);
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.functions.invoke("google-calendar?action=exchange-code", {
        body: { code, redirectUrl }
      });

      if (error) throw error;
      
      if (data?.success) {
        setIsConnected(true);
        onConnectionChange?.(true);
        toast.success("Google Calendar connected!");
        
        // Clean up URL
        window.history.replaceState({}, document.title, "/dashboard");
      }
    } catch (error: any) {
      console.error("Error exchanging code:", error);
      toast.error("Failed to connect Google Calendar");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar?action=disconnect", {
        body: {}
      });

      if (error) throw error;
      
      setIsConnected(false);
      onConnectionChange?.(false);
      toast.success("Google Calendar disconnected");
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      toast.error("Failed to disconnect Google Calendar");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking connection...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isConnected ? (
        <>
          <span className="text-sm text-green-500 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Connected
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDisconnect}
            className="gap-2"
          >
            <Unlink className="w-3 h-3" />
            Disconnect
          </Button>
        </>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleConnect}
          disabled={connecting}
          className="gap-2"
        >
          {connecting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Link className="w-3 h-3" />
          )}
          Connect Google Calendar
        </Button>
      )}
    </div>
  );
};
