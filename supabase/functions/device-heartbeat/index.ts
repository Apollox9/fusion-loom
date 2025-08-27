import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id, x-device-signature',
}

interface HeartbeatPayload {
  device_id: string
  is_online: boolean
  is_printing?: boolean
  firmware_version?: string
  model?: string
  up_time?: string
  sessions_held?: number
  active_session?: string
  location?: {
    lat: number
    lng: number
    provider?: string
  }
}

// HMAC verification function
async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const expectedSignature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    )
    
    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    return signature.toLowerCase() === expectedHex.toLowerCase()
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const deviceId = req.headers.get('x-device-id')
    const signature = req.headers.get('x-device-signature')
    
    if (!deviceId) {
      return new Response(
        JSON.stringify({ error: 'Device ID header required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.text()
    let payload: HeartbeatPayload

    try {
      payload = JSON.parse(body)
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify device exists and get secret key
    const { data: machine, error: machineError } = await supabase
      .from('machines')
      .select('secret_key')
      .eq('device_id', deviceId)
      .single()

    if (machineError || !machine) {
      console.error('Machine not found:', deviceId, machineError)
      return new Response(
        JSON.stringify({ error: 'Device not registered' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify HMAC signature if provided
    if (signature) {
      const isValidSignature = await verifySignature(body, signature, machine.secret_key)
      if (!isValidSignature) {
        console.error('Invalid signature for device:', deviceId)
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log('Processing heartbeat for device:', deviceId, payload)

    // Update machine status
    const updateData: any = {
      is_online: payload.is_online,
      last_seen_at: new Date().toISOString()
    }

    if (payload.is_printing !== undefined) updateData.is_printing = payload.is_printing
    if (payload.firmware_version) updateData.firmware_version = payload.firmware_version
    if (payload.model) updateData.model = payload.model
    if (payload.up_time) updateData.up_time = payload.up_time
    if (payload.sessions_held !== undefined) updateData.sessions_held = payload.sessions_held
    if (payload.active_session !== undefined) updateData.active_session = payload.active_session

    const { error: updateError } = await supabase
      .from('machines')
      .update(updateData)
      .eq('device_id', deviceId)

    if (updateError) {
      console.error('Failed to update machine:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update machine status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store location data if provided
    if (payload.location) {
      const { data: machineData } = await supabase
        .from('machines')
        .select('id')
        .eq('device_id', deviceId)
        .single()

      if (machineData) {
        const { error: locationError } = await supabase
          .from('machine_locations')
          .insert({
            machine_id: machineData.id,
            lat: payload.location.lat,
            lng: payload.location.lng,
            provider: payload.location.provider || 'device'
          })

        if (locationError) {
          console.error('Failed to store location:', locationError)
          // Don't fail the entire request for location errors
        }
      }
    }

    console.log('Heartbeat processed successfully for device:', deviceId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        timestamp: new Date().toISOString(),
        device_id: deviceId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Heartbeat endpoint error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})