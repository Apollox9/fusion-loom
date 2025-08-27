import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id, x-device-signature',
}

interface PrintEventPayload {
  print_job_id: string
  type: 'START' | 'PROGRESS' | 'COMPLETE' | 'ERROR' | 'CANCEL'
  payload: {
    student_id?: string
    student_name?: string
    garment_type?: 'DARK' | 'LIGHT'
    garment_count?: number
    progress_percentage?: number
    error_message?: string
    order_id?: string
    order_item_id?: string
    timestamp?: string
  }
  idempotency_key?: string
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
    let payload: PrintEventPayload

    try {
      payload = JSON.parse(body)
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    if (!payload.print_job_id || !payload.type || !payload.payload) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: print_job_id, type, payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify device exists and get secret key
    const { data: machine, error: machineError } = await supabase
      .from('machines')
      .select('id, secret_key')
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

    console.log('Processing print event for device:', deviceId, payload)

    // Generate idempotency key if not provided
    const idempotencyKey = payload.idempotency_key || 
      `${deviceId}-${payload.print_job_id}-${payload.type}-${Date.now()}`

    // Check for duplicate events using idempotency key
    const { data: existingEvent } = await supabase
      .from('print_events')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single()

    if (existingEvent) {
      console.log('Duplicate event detected, ignoring:', idempotencyKey)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Event already processed',
          event_id: existingEvent.id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store the print event
    const { data: printEvent, error: eventError } = await supabase
      .from('print_events')
      .insert({
        print_job_id: payload.print_job_id,
        type: payload.type,
        payload: payload.payload,
        idempotency_key: idempotencyKey
      })
      .select()
      .single()

    if (eventError) {
      console.error('Failed to store print event:', eventError)
      return new Response(
        JSON.stringify({ error: 'Failed to store print event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update order item progress if order_item_id is provided
    if (payload.payload.order_item_id) {
      const updateData: any = {}
      
      if (payload.type === 'COMPLETE' && payload.payload.garment_type && payload.payload.garment_count) {
        if (payload.payload.garment_type === 'DARK') {
          updateData.printed_dark = payload.payload.garment_count
        } else if (payload.payload.garment_type === 'LIGHT') {
          updateData.printed_light = payload.payload.garment_count
        }
        
        // Check if all garments are printed and update status
        const { data: orderItem } = await supabase
          .from('order_items')
          .select('dark_count, light_count, printed_dark, printed_light')
          .eq('id', payload.payload.order_item_id)
          .single()

        if (orderItem) {
          const totalToPrint = orderItem.dark_count + orderItem.light_count
          const totalPrinted = (updateData.printed_dark || orderItem.printed_dark) + 
                              (updateData.printed_light || orderItem.printed_light)
          
          if (totalPrinted >= totalToPrint) {
            updateData.status = 'COMPLETED'
          } else {
            updateData.status = 'IN_PROGRESS'
          }
        }
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('order_items')
          .update(updateData)
          .eq('id', payload.payload.order_item_id)

        if (updateError) {
          console.error('Failed to update order item:', updateError)
          // Don't fail the entire request for update errors
        }
      }
    }

    // Update machine printing status based on event type
    if (payload.type === 'START') {
      await supabase
        .from('machines')
        .update({ is_printing: true, active_session: payload.print_job_id })
        .eq('id', machine.id)
    } else if (['COMPLETE', 'ERROR', 'CANCEL'].includes(payload.type)) {
      await supabase
        .from('machines')
        .update({ is_printing: false, active_session: null })
        .eq('id', machine.id)
    }

    console.log('Print event processed successfully:', printEvent.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: printEvent.id,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Print event endpoint error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})