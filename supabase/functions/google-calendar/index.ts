import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!

// Helper function for consistent logging
function logStep(action: string, step: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${action}] ${step}`, data ? JSON.stringify(data, null, 2) : '')
}

function logError(action: string, step: string, error: unknown) {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] [${action}] ERROR - ${step}:`, error)
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Log environment check at startup
  console.log('=== Google Calendar Function Started ===')
  console.log('Environment check:', JSON.stringify({
    hasClientId: !!GOOGLE_CLIENT_ID,
    clientIdPrefix: GOOGLE_CLIENT_ID?.substring(0, 10) + '...',
    clientIdLength: GOOGLE_CLIENT_ID?.length || 0,
    hasClientSecret: !!GOOGLE_CLIENT_SECRET,
    clientSecretLength: GOOGLE_CLIENT_SECRET?.length || 0,
    supabaseUrl: Deno.env.get('SUPABASE_URL')?.substring(0, 30) + '...',
  }))

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify JWT and get user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      logError('auth', 'No authorization header provided', null)
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    logStep('auth', 'Verifying JWT token', { tokenLength: token.length })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      logError('auth', 'JWT verification failed', { authError, hasUser: !!user })
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    logStep('auth', 'User authenticated successfully', { userId: user.id, email: user.email })

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    logStep(action || 'unknown', `Processing action for user: ${user.id}`, { 
      fullUrl: req.url,
      searchParams: Object.fromEntries(url.searchParams)
    })

    // Generate OAuth URL for user to connect
    if (action === 'get-auth-url') {
      const body = await req.json()
      const { redirectUrl } = body
      
      logStep('get-auth-url', 'Received request', {
        redirectUrl,
        bodyReceived: body
      })

      const scope = 'https://www.googleapis.com/auth/calendar.readonly'
      const encodedScope = encodeURIComponent(scope)
      const encodedRedirectUrl = encodeURIComponent(redirectUrl)
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodedRedirectUrl}` +
        `&response_type=code` +
        `&scope=${encodedScope}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${user.id}`

      logStep('get-auth-url', 'Generated OAuth URL', {
        clientIdUsed: GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
        redirectUrl: redirectUrl,
        encodedRedirectUrl: encodedRedirectUrl,
        scope: scope,
        state: user.id,
        authUrlLength: authUrl.length,
        authUrlPreview: authUrl.substring(0, 100) + '...'
      })

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Exchange code for tokens
    if (action === 'exchange-code') {
      const body = await req.json()
      const { code, redirectUrl } = body

      logStep('exchange-code', 'Received token exchange request', {
        codeLength: code?.length || 0,
        codePrefix: code?.substring(0, 10) + '...',
        redirectUrl: redirectUrl
      })
      
      const tokenRequestBody = new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUrl,
        grant_type: 'authorization_code'
      })

      logStep('exchange-code', 'Making token request to Google', {
        endpoint: 'https://oauth2.googleapis.com/token',
        clientIdUsed: GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
        redirectUrl: redirectUrl,
        grantType: 'authorization_code'
      })

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenRequestBody
      })

      logStep('exchange-code', 'Token response received', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        headers: Object.fromEntries(tokenResponse.headers)
      })

      const tokenData = await tokenResponse.json()
      
      if (tokenData.error) {
        logError('exchange-code', 'Token exchange failed', {
          error: tokenData.error,
          errorDescription: tokenData.error_description,
          errorUri: tokenData.error_uri,
          fullResponse: tokenData
        })
        return new Response(JSON.stringify({ 
          error: tokenData.error_description || tokenData.error || 'Token exchange failed',
          details: {
            googleError: tokenData.error,
            googleErrorDescription: tokenData.error_description
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      logStep('exchange-code', 'Token exchange successful', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type,
        scope: tokenData.scope
      })

      // Store tokens in user metadata (encrypted at rest by Supabase)
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          google_calendar_access_token: tokenData.access_token,
          google_calendar_refresh_token: tokenData.refresh_token,
          google_calendar_expires_at: Date.now() + (tokenData.expires_in * 1000)
        }
      })

      if (updateError) {
        logError('exchange-code', 'Failed to store tokens in user metadata', updateError)
        return new Response(JSON.stringify({ error: 'Failed to store tokens' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      logStep('exchange-code', 'Tokens stored successfully in user metadata')
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check connection status
    if (action === 'check-status') {
      const hasTokens = !!user.user_metadata?.google_calendar_access_token
      const hasRefreshToken = !!user.user_metadata?.google_calendar_refresh_token
      const expiresAt = user.user_metadata?.google_calendar_expires_at
      const isExpired = expiresAt ? Date.now() >= expiresAt : null

      logStep('check-status', 'Connection status check', {
        hasAccessToken: hasTokens,
        hasRefreshToken: hasRefreshToken,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isExpired: isExpired,
        connected: hasTokens
      })

      return new Response(JSON.stringify({ connected: hasTokens }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Disconnect Google Calendar
    if (action === 'disconnect') {
      logStep('disconnect', 'Disconnecting Google Calendar', { userId: user.id })

      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          google_calendar_access_token: null,
          google_calendar_refresh_token: null,
          google_calendar_expires_at: null
        }
      })

      if (updateError) {
        logError('disconnect', 'Failed to disconnect', updateError)
        return new Response(JSON.stringify({ error: 'Failed to disconnect' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      logStep('disconnect', 'Successfully disconnected Google Calendar')
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Sync calendar events
    if (action === 'sync') {
      let accessToken = user.user_metadata?.google_calendar_access_token
      const refreshToken = user.user_metadata?.google_calendar_refresh_token
      const expiresAt = user.user_metadata?.google_calendar_expires_at

      logStep('sync', 'Starting calendar sync', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isExpired: expiresAt ? Date.now() >= expiresAt : null
      })

      if (!accessToken) {
        logError('sync', 'No access token found', null)
        return new Response(JSON.stringify({ error: 'Google Calendar not connected' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Refresh token if expired
      if (expiresAt && Date.now() >= expiresAt) {
        logStep('sync', 'Access token expired, refreshing...', {
          expiredAt: new Date(expiresAt).toISOString(),
          currentTime: new Date().toISOString()
        })

        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
          })
        })

        logStep('sync', 'Refresh token response', {
          status: refreshResponse.status,
          statusText: refreshResponse.statusText
        })

        const refreshData = await refreshResponse.json()
        
        if (refreshData.error) {
          logError('sync', 'Token refresh failed', {
            error: refreshData.error,
            errorDescription: refreshData.error_description
          })
          return new Response(JSON.stringify({ error: 'Please reconnect Google Calendar' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        accessToken = refreshData.access_token
        logStep('sync', 'Token refreshed successfully', {
          newExpiresIn: refreshData.expires_in
        })
        
        // Update stored token
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            google_calendar_access_token: refreshData.access_token,
            google_calendar_expires_at: Date.now() + (refreshData.expires_in * 1000)
          }
        })
      }

      // Fetch calendar events
      const now = new Date()
      const timeMin = now.toISOString()
      const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`

      logStep('sync', 'Fetching calendar events from Google', {
        apiUrl: calendarApiUrl,
        timeMin: timeMin,
        timeMax: timeMax
      })

      const eventsResponse = await fetch(calendarApiUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      logStep('sync', 'Calendar API response', {
        status: eventsResponse.status,
        statusText: eventsResponse.statusText
      })

      const eventsData = await eventsResponse.json()

      if (eventsData.error) {
        logError('sync', 'Calendar API error', {
          error: eventsData.error,
          message: eventsData.error?.message,
          code: eventsData.error?.code
        })
        return new Response(JSON.stringify({ error: 'Failed to fetch calendar events' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Process and store events
      const events = eventsData.items || []
      logStep('sync', `Processing ${events.length} events from Google Calendar`)

      let processedCount = 0
      let skippedCount = 0

      for (const event of events) {
        if (!event.start?.dateTime || !event.end?.dateTime) {
          skippedCount++
          continue
        }

        const { error: upsertError } = await supabase
          .from('calendar_events')
          .upsert({
            user_id: user.id,
            external_id: event.id,
            title: event.summary || 'No Title',
            start_time: event.start.dateTime,
            end_time: event.end.dateTime,
            is_synced: true
          }, { onConflict: 'external_id' })

        if (upsertError) {
          logError('sync', `Error upserting event: ${event.id}`, upsertError)
        } else {
          processedCount++
        }
      }

      logStep('sync', 'Event processing complete', {
        totalEvents: events.length,
        processed: processedCount,
        skipped: skippedCount
      })

      // Fetch user's calendar events to return
      const { data: calendarEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', timeMin)
        .lte('start_time', timeMax)
        .order('start_time', { ascending: true })

      logStep('sync', 'Returning synced events', { eventCount: calendarEvents?.length || 0 })

      return new Response(JSON.stringify({ events: calendarEvents || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get local calendar events (no sync)
    if (action === 'get-events') {
      const now = new Date()
      const timeMin = now.toISOString()
      const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

      logStep('get-events', 'Fetching local events', { timeMin, timeMax })

      const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', timeMin)
        .lte('start_time', timeMax)
        .order('start_time', { ascending: true })

      if (error) {
        logError('get-events', 'Failed to fetch events', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      logStep('get-events', 'Events retrieved', { eventCount: events?.length || 0 })

      return new Response(JSON.stringify({ events: events || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Find study gaps
    if (action === 'find-gaps') {
      const { minGapMinutes = 15 } = await req.json().catch(() => ({}))

      logStep('find-gaps', 'Analyzing schedule for study gaps', { minGapMinutes })

      const now = new Date()
      const timeMin = now.toISOString()
      const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', timeMin)
        .lte('start_time', timeMax)
        .order('start_time', { ascending: true })

      if (error) {
        logError('find-gaps', 'Failed to fetch events for gap analysis', error)
        return new Response(JSON.stringify({ error: 'Failed to analyze schedule' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      logStep('find-gaps', 'Events fetched for analysis', { eventCount: events?.length || 0 })

      const gaps: Array<{ start: string; end: string; durationMinutes: number }> = []
      
      const studyStartHour = 8
      const studyEndHour = 22

      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const day = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000)
        const dayStart = new Date(day)
        dayStart.setHours(studyStartHour, 0, 0, 0)
        const dayEnd = new Date(day)
        dayEnd.setHours(studyEndHour, 0, 0, 0)

        const dayEvents = (events || []).filter(e => {
          const eventStart = new Date(e.start_time)
          return eventStart.toDateString() === day.toDateString()
        }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

        let currentTime = dayOffset === 0 ? Math.max(now.getTime(), dayStart.getTime()) : dayStart.getTime()
        
        for (const event of dayEvents) {
          const eventStart = new Date(event.start_time).getTime()
          const eventEnd = new Date(event.end_time).getTime()

          if (eventStart > currentTime) {
            const gapMinutes = (eventStart - currentTime) / (1000 * 60)
            if (gapMinutes >= minGapMinutes) {
              gaps.push({
                start: new Date(currentTime).toISOString(),
                end: new Date(eventStart).toISOString(),
                durationMinutes: Math.floor(gapMinutes)
              })
            }
          }
          currentTime = Math.max(currentTime, eventEnd)
        }

        if (currentTime < dayEnd.getTime()) {
          const gapMinutes = (dayEnd.getTime() - currentTime) / (1000 * 60)
          if (gapMinutes >= minGapMinutes) {
            gaps.push({
              start: new Date(currentTime).toISOString(),
              end: dayEnd.toISOString(),
              durationMinutes: Math.floor(gapMinutes)
            })
          }
        }
      }

      logStep('find-gaps', 'Gap analysis complete', { gapsFound: gaps.length })

      return new Response(JSON.stringify({ gaps }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    logError('unknown', `Unknown action received: ${action}`, { url: req.url })
    return new Response(JSON.stringify({ error: 'Unknown action', receivedAction: action }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    logError('global', 'Unhandled exception', {
      message: errorMessage,
      stack: errorStack,
      error: error
    })
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
