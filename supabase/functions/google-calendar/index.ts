import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify JWT and get user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    console.log(`Processing Google Calendar action: ${action} for user: ${user.id}`)

    // Generate OAuth URL for user to connect
    if (action === 'get-auth-url') {
      const { redirectUrl } = await req.json()
      
      const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly')
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
        `&response_type=code` +
        `&scope=${scope}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${user.id}`

      console.log('Generated auth URL')
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Exchange code for tokens
    if (action === 'exchange-code') {
      const { code, redirectUrl } = await req.json()

      console.log('Exchanging code for tokens...')
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUrl,
          grant_type: 'authorization_code'
        })
      })

      const tokenData = await tokenResponse.json()
      
      if (tokenData.error) {
        console.error('Token exchange error:', tokenData)
        return new Response(JSON.stringify({ error: tokenData.error_description || 'Token exchange failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

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
        console.error('Error storing tokens:', updateError)
        return new Response(JSON.stringify({ error: 'Failed to store tokens' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Tokens stored successfully')
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check connection status
    if (action === 'check-status') {
      const hasTokens = !!user.user_metadata?.google_calendar_access_token
      return new Response(JSON.stringify({ connected: hasTokens }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Disconnect Google Calendar
    if (action === 'disconnect') {
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          google_calendar_access_token: null,
          google_calendar_refresh_token: null,
          google_calendar_expires_at: null
        }
      })

      if (updateError) {
        console.error('Error disconnecting:', updateError)
        return new Response(JSON.stringify({ error: 'Failed to disconnect' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Sync calendar events
    if (action === 'sync') {
      let accessToken = user.user_metadata?.google_calendar_access_token
      const refreshToken = user.user_metadata?.google_calendar_refresh_token
      const expiresAt = user.user_metadata?.google_calendar_expires_at

      if (!accessToken) {
        return new Response(JSON.stringify({ error: 'Google Calendar not connected' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Refresh token if expired
      if (expiresAt && Date.now() >= expiresAt) {
        console.log('Refreshing access token...')
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

        const refreshData = await refreshResponse.json()
        
        if (refreshData.error) {
          console.error('Refresh token error:', refreshData)
          return new Response(JSON.stringify({ error: 'Please reconnect Google Calendar' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        accessToken = refreshData.access_token
        
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
      const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next 7 days

      console.log('Fetching calendar events...')
      const eventsResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      const eventsData = await eventsResponse.json()

      if (eventsData.error) {
        console.error('Calendar API error:', eventsData.error)
        return new Response(JSON.stringify({ error: 'Failed to fetch calendar events' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Process and store events
      const events = eventsData.items || []
      console.log(`Found ${events.length} events`)

      for (const event of events) {
        if (!event.start?.dateTime || !event.end?.dateTime) continue // Skip all-day events

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
          console.error('Error upserting event:', upsertError)
        }
      }

      // Fetch user's calendar events to return
      const { data: calendarEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', timeMin)
        .lte('start_time', timeMax)
        .order('start_time', { ascending: true })

      return new Response(JSON.stringify({ events: calendarEvents || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get local calendar events (no sync)
    if (action === 'get-events') {
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
        console.error('Error fetching events:', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ events: events || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Find study gaps
    if (action === 'find-gaps') {
      const { minGapMinutes = 15 } = await req.json().catch(() => ({}))

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
        console.error('Error fetching events for gap analysis:', error)
        return new Response(JSON.stringify({ error: 'Failed to analyze schedule' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const gaps: Array<{ start: string; end: string; durationMinutes: number }> = []
      
      // Define study hours (8 AM to 10 PM)
      const studyStartHour = 8
      const studyEndHour = 22

      // Analyze each day
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const day = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000)
        const dayStart = new Date(day)
        dayStart.setHours(studyStartHour, 0, 0, 0)
        const dayEnd = new Date(day)
        dayEnd.setHours(studyEndHour, 0, 0, 0)

        // Get events for this day
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

        // Check for gap at end of day
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

      console.log(`Found ${gaps.length} study gaps`)
      return new Response(JSON.stringify({ gaps }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    console.error('Google Calendar function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
