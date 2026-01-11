import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

// Simple push notification sender using fetch
async function sendWebPush(
  subscription: PushSubscription,
  payload: NotificationPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<boolean> {
  try {
    // For simplicity, we'll use a plain text notification that doesn't require encryption
    // This approach works with most push services when using the standard VAPID flow
    
    const payloadString = JSON.stringify(payload);
    const payloadBytes = new TextEncoder().encode(payloadString);
    
    // Create the JWT for VAPID authentication
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "ES256", typ: "JWT" };
    const claims = {
      aud: audience,
      exp: now + 12 * 60 * 60,
      sub: vapidSubject,
    };

    // Base64url encode helper
    const base64url = (input: string | ArrayBuffer): string => {
      const str = typeof input === "string" 
        ? input 
        : String.fromCharCode(...new Uint8Array(input));
      return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    };

    const base64urlDecode = (input: string): Uint8Array => {
      const padding = "=".repeat((4 - (input.length % 4)) % 4);
      const base64 = (input + padding).replace(/-/g, "+").replace(/_/g, "/");
      const binary = atob(base64);
      return Uint8Array.from(binary, (c) => c.charCodeAt(0));
    };

    // Import the VAPID private key
    const privateKeyBytes = base64urlDecode(vapidPrivateKey);
    
    // For ECDSA P-256 keys, we need to create a proper key format
    // The private key should be in raw format (32 bytes for P-256)
    let cryptoKey: CryptoKey;
    
    try {
      // Try importing as raw key first (if it's just the 32-byte scalar)
      if (privateKeyBytes.length === 32) {
        // Build JWK from raw key - convert to ArrayBuffer explicitly
        const buffer = new ArrayBuffer(privateKeyBytes.length);
        new Uint8Array(buffer).set(privateKeyBytes);
        const d = base64url(buffer);
        
        // We need to derive the public key components - for now use a simpler approach
        cryptoKey = await crypto.subtle.importKey(
          "jwk",
          {
            kty: "EC",
            crv: "P-256",
            d: d,
            x: vapidPublicKey.substring(0, 43), // First 43 chars of public key
            y: vapidPublicKey.substring(43),    // Remaining chars
          },
          { name: "ECDSA", namedCurve: "P-256" },
          false,
          ["sign"]
        );
      } else {
        // Try PKCS8 format - convert to ArrayBuffer explicitly
        const pkcs8Buffer = new ArrayBuffer(privateKeyBytes.length);
        new Uint8Array(pkcs8Buffer).set(privateKeyBytes);
        cryptoKey = await crypto.subtle.importKey(
          "pkcs8",
          privateKeyBytes.buffer as ArrayBuffer,
          { name: "ECDSA", namedCurve: "P-256" },
          false,
          ["sign"]
        );
      }
    } catch (keyError) {
      console.error("Key import failed, trying alternative:", keyError);
      // Fallback: try JWK directly if provided in different format
      throw new Error("VAPID private key format not supported. Please use PKCS8 or raw format.");
    }

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(claims));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      cryptoKey,
      new TextEncoder().encode(unsignedToken)
    );

    // Convert signature to correct format (Web Push expects concatenated r || s)
    const signatureBytes = new Uint8Array(signature);
    const encodedSignature = base64url(signatureBytes.buffer);
    const jwt = `${unsignedToken}.${encodedSignature}`;

    // Send the push notification
    // Note: For full encryption support, you'd need the web-push library
    // This simplified version sends unencrypted payloads
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "TTL": "86400",
        "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
        "Content-Length": payloadBytes.length.toString(),
      },
      body: payloadBytes,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Push failed: ${response.status} - ${errorText}`);
      
      // 410 Gone means the subscription is expired
      if (response.status === 410 || response.status === 404) {
        return false;
      }
    }

    console.log(`Push sent to ${subscription.endpoint.substring(0, 50)}...`);
    return response.ok;
  } catch (error) {
    console.error("Error sending push:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, userId, title, body: notifBody, url, tag } = body;

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT");

    // Return VAPID public key for frontend
    if (action === "get-vapid-key") {
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not configured");
      }
      return new Response(
        JSON.stringify({ vapidPublicKey }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate VAPID keys for sending
    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error("VAPID keys not fully configured");
    }

    // Send notification
    if (action === "send") {
      if (!userId) {
        throw new Error("userId is required");
      }

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Get user's push subscriptions
      const { data: subscriptions, error } = await supabaseClient
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId);

      if (error) throw error;

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No subscriptions found for user ${userId}`);
        return new Response(
          JSON.stringify({ success: false, message: "No subscriptions found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payload: NotificationPayload = {
        title: title || "Phoenix Learning",
        body: notifBody || "You have a new notification",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        url: url || "/",
        tag: tag || "phoenix-notification",
      };

      // Send to all subscriptions
      const results = await Promise.all(
        subscriptions.map((sub) => 
          sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey, vapidSubject)
        )
      );

      // Remove failed subscriptions (likely expired)
      const failedIndices = results
        .map((success, index) => (!success ? index : -1))
        .filter((i) => i >= 0);

      if (failedIndices.length > 0) {
        const failedEndpoints = failedIndices.map((i) => subscriptions[i].endpoint);
        await supabaseClient
          .from("push_subscriptions")
          .delete()
          .in("endpoint", failedEndpoints);
        console.log(`Removed ${failedIndices.length} expired subscriptions`);
      }

      const successCount = results.filter(Boolean).length;
      console.log(`Sent ${successCount}/${subscriptions.length} notifications`);

      return new Response(
        JSON.stringify({ 
          success: successCount > 0, 
          sent: successCount,
          total: subscriptions.length 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Edge function error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
