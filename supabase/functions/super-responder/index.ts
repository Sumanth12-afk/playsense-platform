import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SessionPayload {
  action?: 'start_session' | 'end_session'  // For real-time active session tracking
  child_id: string
  game_name: string
  category: string
  started_at: string
  ended_at?: string
  duration_minutes?: number
  device_id?: string
}


Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method === 'POST') {
      const payload: SessionPayload = await req.json()

      console.log('Received session payload:', payload)

      // Validate required fields
      if (!payload.child_id || !payload.game_name || !payload.started_at) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: child_id, game_name, started_at' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify child exists
      const { data: child, error: childError } = await supabase
        .from('children')
        .select('id')
        .eq('id', payload.child_id)
        .maybeSingle()

      if (childError) {
        console.error('Error checking child:', childError)
        return new Response(
          JSON.stringify({ error: 'Failed to verify child', details: childError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!child) {
        return new Response(
          JSON.stringify({ error: 'Child not found. Please check the Child ID and ensure the child exists in your account.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Find or create device
      const deviceName = payload.device_id || 'Desktop App'
      let deviceId: string

      // Try to find device by device_id only (since device_id has a unique constraint)
      const { data: existingDevice } = await supabase
        .from('devices')
        .select('id, child_id')
        .eq('device_id', deviceName)
        .maybeSingle()

      if (existingDevice) {
        deviceId = existingDevice.id
        console.log('Found existing device:', deviceId)

        // Update the device's child_id if it changed (device can be reassigned to a different child)
        if (existingDevice.child_id !== payload.child_id) {
          await supabase
            .from('devices')
            .update({
              child_id: payload.child_id,
              last_sync_at: new Date().toISOString()
            })
            .eq('id', deviceId)
          console.log('Updated device child_id to:', payload.child_id)
        }
      } else {
        // Create new device
        const { data: newDevice, error: deviceError } = await supabase
          .from('devices')
          .insert({
            child_id: payload.child_id,
            device_id: deviceName,
            name: deviceName,
            os: 'Windows',
            status: 'active',
            last_sync_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (deviceError) {
          console.error('Error creating device:', deviceError)
          return new Response(
            JSON.stringify({ error: 'Failed to create device', details: deviceError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        deviceId = newDevice.id
        console.log('Created new device:', deviceId)
      }


      // Find or create the game
      let gameId: string
      const { data: existingGame } = await supabase
        .from('games')
        .select('id')
        .eq('name', payload.game_name)
        .maybeSingle()

      if (existingGame) {
        gameId = existingGame.id
        console.log('Found existing game:', gameId)
      } else {
        // Create new game
        const { data: newGame, error: gameError } = await supabase
          .from('games')
          .insert({
            name: payload.game_name,
            category: payload.category || 'other'
          })
          .select('id')
          .single()

        if (gameError) {
          console.error('Error creating game:', gameError)
          return new Response(
            JSON.stringify({ error: 'Failed to create game', details: gameError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        gameId = newGame.id
        console.log('Created new game:', gameId)
      }

      // Handle action-based real-time session tracking
      if (payload.action === 'start_session') {
        // REAL-TIME: Create an active session (no ended_at)
        console.log('Creating active session for real-time tracking')

        // Check if there's already an active session for this game
        const { data: existingActive } = await supabase
          .from('gaming_sessions')
          .select('id')
          .eq('child_id', payload.child_id)
          .eq('game_id', gameId)
          .is('ended_at', null)
          .maybeSingle()

        if (existingActive) {
          console.log('Active session already exists:', existingActive.id)
          return new Response(
            JSON.stringify({
              success: true,
              session_id: existingActive.id,
              game_id: gameId,
              already_active: true
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: session, error: sessionError } = await supabase
          .from('gaming_sessions')
          .insert({
            device_id: deviceId,
            child_id: payload.child_id,
            game_id: gameId,
            started_at: payload.started_at,
            ended_at: null,  // Active session - no end time
            is_active: true
          })
          .select()
          .single()

        if (sessionError) {
          console.error('Error creating active session:', sessionError)
          return new Response(
            JSON.stringify({ error: 'Failed to create active session', details: sessionError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Created active session:', session.id)

        // Update child's last_sync_at
        await supabase
          .from('children')
          .update({
            last_sync_at: new Date().toISOString(),
            device_name: payload.device_id || 'Desktop App'
          })
          .eq('id', payload.child_id)

        return new Response(
          JSON.stringify({
            success: true,
            session_id: session.id,
            game_id: gameId,
            is_active: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (payload.action === 'end_session') {
        // REAL-TIME: Complete an active session
        console.log('Completing active session')

        // Find the active session for this game
        const { data: activeSession } = await supabase
          .from('gaming_sessions')
          .select('id')
          .eq('child_id', payload.child_id)
          .eq('game_id', gameId)
          .is('ended_at', null)
          .maybeSingle()

        if (activeSession) {
          // Update the existing active session
          const { data: session, error: updateError } = await supabase
            .from('gaming_sessions')
            .update({
              ended_at: payload.ended_at,
              is_active: false
            })
            .eq('id', activeSession.id)
            .select()
            .single()

          if (updateError) {
            console.error('Error completing session:', updateError)
            return new Response(
              JSON.stringify({ error: 'Failed to complete session', details: updateError }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          console.log('Completed session:', session.id)

          // Update child's last_sync_at
          await supabase
            .from('children')
            .update({
              last_sync_at: new Date().toISOString(),
              device_name: payload.device_id || 'Desktop App'
            })
            .eq('id', payload.child_id)

          return new Response(
            JSON.stringify({
              success: true,
              session_id: session.id,
              game_id: gameId,
              completed: true
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // No active session found - create a complete session instead
        console.log('No active session found, creating complete session')
      }

      // Check for overlapping session (same child, game, and overlapping time range)
      const endTime = payload.ended_at || new Date().toISOString()

      const { data: overlappingSessions } = await supabase
        .from('gaming_sessions')
        .select('id, started_at')
        .eq('child_id', payload.child_id)
        .eq('game_id', gameId)
        .lte('started_at', endTime)
        .gte('ended_at', payload.started_at)
        .order('started_at', { ascending: true })
        .limit(1)

      if (overlappingSessions && overlappingSessions.length > 0) {
        // Update existing overlapping session
        const existingSession = overlappingSessions[0]
        const earliestStart = existingSession.started_at < payload.started_at
          ? existingSession.started_at
          : payload.started_at

        const { data: session, error: updateError } = await supabase
          .from('gaming_sessions')
          .update({
            started_at: earliestStart,
            ended_at: endTime,
            is_active: false
          })
          .eq('id', existingSession.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating session:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to update session', details: updateError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Updated overlapping session:', session.id)

        // Update sync time
        await supabase
          .from('children')
          .update({
            last_sync_at: new Date().toISOString(),
            device_name: payload.device_id || 'Desktop App'
          })
          .eq('id', payload.child_id)

        return new Response(
          JSON.stringify({
            success: true,
            session_id: session.id,
            game_id: gameId,
            updated: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Insert new gaming session
      const sessionData: any = {
        device_id: deviceId,
        child_id: payload.child_id,
        game_id: gameId,
        started_at: payload.started_at,
        ended_at: payload.ended_at || new Date().toISOString(),
        is_active: false
      }

      const { data: session, error: sessionError } = await supabase
        .from('gaming_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (sessionError) {
        console.error('Error creating session:', sessionError)
        return new Response(
          JSON.stringify({ error: 'Failed to create session', details: sessionError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Created session:', session.id)

      // Update the child's last_sync_at timestamp
      const { error: updateError } = await supabase
        .from('children')
        .update({
          last_sync_at: new Date().toISOString(),
          device_name: payload.device_id || 'Desktop App'
        })
        .eq('id', payload.child_id)

      if (updateError) {
        console.error('Error updating child sync time:', updateError)
      } else {
        console.log('Updated last_sync_at for child:', payload.child_id)
      }

      return new Response(
        JSON.stringify({
          success: true,
          session_id: session.id,
          game_id: gameId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


    // Handle heartbeat/sync check (GET request)
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const childId = url.searchParams.get('child_id')

      if (childId) {
        // Update last_sync_at for heartbeat
        await supabase
          .from('children')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', childId)

        return new Response(
          JSON.stringify({ success: true, synced_at: new Date().toISOString() }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

