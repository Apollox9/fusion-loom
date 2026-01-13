import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Machine {
  device_id: string;
}

interface Task {
  status: string;
  completed_at: string | null;
  assigned_at: string;
}

interface Notification {
  target_id: string;
  level: string;
  title: string;
  body: string;
}

interface Order {
  id: string;
  total_garments: number;
}

interface Staff {
  id: string;
  role: string;
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

    console.log('Running background jobs...')

    // Job 1: Auto-confirm old orders (24 hours)
    await autoConfirmOrders(supabase)
    
    // Job 2: Update machine online status (if not seen for 5 minutes)
    await updateMachineStatus(supabase)
    
    // Job 3: Generate daily metrics
    await generateDailyMetrics(supabase)
    
    // Job 4: Clean up old audit events (keep 90 days)
    await cleanupAuditEvents(supabase)
    
    // Job 5: Send notification summaries
    await sendNotificationSummaries(supabase)

    console.log('Background jobs completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        timestamp: new Date().toISOString(),
        jobs_run: [
          'auto_confirm_orders',
          'update_machine_status', 
          'generate_daily_metrics',
          'cleanup_audit_events',
          'send_notification_summaries'
        ]
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: unknown) {
    console.error('Background jobs error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Background jobs failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function autoConfirmOrders(supabase: SupabaseClient) {
  try {
    console.log('Running auto-confirm orders job...')
    
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - 24)
    
    const { data: ordersToConfirm, error: fetchError } = await supabase
      .from('orders')
      .select('id, created_by_school, total_garments')
      .eq('status', 'SUBMITTED')
      .lt('submission_time', cutoffTime.toISOString())
      .is('auto_confirmed_at', null)

    if (fetchError) {
      console.error('Error fetching orders to auto-confirm:', fetchError)
      return
    }

    if (!ordersToConfirm || ordersToConfirm.length === 0) {
      console.log('No orders to auto-confirm')
      return
    }

    for (const order of ordersToConfirm as Order[]) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'QUEUED',
          queued_at: new Date().toISOString(),
          auto_confirmed_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('Error auto-confirming order:', order.id, updateError)
        continue
      }

      // Create audit event
      await supabase
        .from('audit_events')
        .insert({
          actor_type: 'SYSTEM',
          action: 'ORDER_AUTO_CONFIRMED',
          target_type: 'ORDER',
          target_id: order.id,
          details: {
            order_id: order.id,
            total_garments: order.total_garments,
            auto_confirmed_at: new Date().toISOString()
          }
        })

      console.log('Auto-confirmed order:', order.id)
    }

    console.log(`Auto-confirmed ${ordersToConfirm.length} orders`)
  } catch (error) {
    console.error('Auto-confirm orders job failed:', error)
  }
}

async function updateMachineStatus(supabase: SupabaseClient) {
  try {
    console.log('Running update machine status job...')
    
    const cutoffTime = new Date()
    cutoffTime.setMinutes(cutoffTime.getMinutes() - 5)
    
    const { data: machinesOffline, error: updateError } = await supabase
      .from('machines')
      .update({ is_online: false, is_printing: false, active_session: null })
      .eq('is_online', true)
      .lt('last_seen_at', cutoffTime.toISOString())
      .select('device_id')

    if (updateError) {
      console.error('Error updating machine status:', updateError)
      return
    }

    if (machinesOffline && machinesOffline.length > 0) {
      console.log(`Marked ${machinesOffline.length} machines as offline:`, 
        (machinesOffline as Machine[]).map((m: Machine) => m.device_id))
    }
  } catch (error) {
    console.error('Update machine status job failed:', error)
  }
}

async function generateDailyMetrics(supabase: SupabaseClient) {
  try {
    console.log('Running generate daily metrics job...')
    
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const startOfDay = new Date(yesterday)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(yesterday)
    endOfDay.setHours(23, 59, 59, 999)

    // Check if metrics already exist for this period
    const { data: existingMetrics } = await supabase
      .from('staff_metrics')
      .select('id')
      .eq('period_start', startOfDay.toISOString())
      .eq('period_end', endOfDay.toISOString())

    if (existingMetrics && existingMetrics.length > 0) {
      console.log('Metrics already exist for yesterday')
      return
    }

    // Get all staff users
    const { data: staffUsers, error: staffError } = await supabase
      .from('profiles')
      .select('id, role')
      .in('role', ['ADMIN', 'OPERATOR', 'SUPERVISOR'])

    if (staffError || !staffUsers) {
      console.error('Error fetching staff users:', staffError)
      return
    }

    for (const staff of staffUsers as Staff[]) {
      // Get tasks for this staff member for yesterday
      const { data: tasks, error: tasksError } = await supabase
        .from('staff_tasks')
        .select('*')
        .eq('staff_user_id', staff.id)
        .gte('assigned_at', startOfDay.toISOString())
        .lte('assigned_at', endOfDay.toISOString())

      if (tasksError) {
        console.error('Error fetching tasks for staff:', staff.id, tasksError)
        continue
      }

      const typedTasks = (tasks || []) as Task[]
      const tasksAssigned = typedTasks.length
      const tasksCompleted = typedTasks.filter((t: Task) => t.status === 'COMPLETED').length
      const completedTasks = typedTasks.filter((t: Task) => t.completed_at)
      
      let avgCompletionTime: number | null = null
      if (completedTasks.length > 0) {
        const totalTime = completedTasks.reduce((sum: number, task: Task) => {
          const assigned = new Date(task.assigned_at)
          const completed = new Date(task.completed_at!)
          return sum + (completed.getTime() - assigned.getTime())
        }, 0)
        avgCompletionTime = Math.round(totalTime / completedTasks.length / 1000) // seconds
      }

      const efficiencyScore = tasksAssigned > 0 ? 
        Math.round((tasksCompleted / tasksAssigned) * 100) / 100 : null

      // Insert metrics
      const { error: insertError } = await supabase
        .from('staff_metrics')
        .insert({
          staff_user_id: staff.id,
          period_start: startOfDay.toISOString(),
          period_end: endOfDay.toISOString(),
          tasks_assigned: tasksAssigned,
          tasks_completed: tasksCompleted,
          efficiency_score: efficiencyScore,
          avg_completion_time_seconds: avgCompletionTime
        })

      if (insertError) {
        console.error('Error inserting metrics for staff:', staff.id, insertError)
      } else {
        console.log(`Generated metrics for staff ${staff.id}: ${tasksCompleted}/${tasksAssigned} tasks`)
      }
    }
  } catch (error) {
    console.error('Generate daily metrics job failed:', error)
  }
}

async function cleanupAuditEvents(supabase: SupabaseClient) {
  try {
    console.log('Running cleanup audit events job...')
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90)
    
    const { data: deletedEvents, error: deleteError } = await supabase
      .from('audit_events')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id')

    if (deleteError) {
      console.error('Error cleaning up audit events:', deleteError)
      return
    }

    if (deletedEvents && deletedEvents.length > 0) {
      console.log(`Cleaned up ${deletedEvents.length} old audit events`)
    }
  } catch (error) {
    console.error('Cleanup audit events job failed:', error)
  }
}

async function sendNotificationSummaries(supabase: SupabaseClient) {
  try {
    console.log('Running send notification summaries job...')
    
    // This is a placeholder for notification summary logic
    // In a real implementation, you might:
    // 1. Group unread notifications by user
    // 2. Send email digests
    // 3. Send push notifications
    // 4. Update notification delivery status
    
    const { data: unreadNotifications, error: notificationError } = await supabase
      .from('notifications')
      .select('target_id, level, title, body')
      .eq('is_read', false)
      .is('delivered_at', null)
      .limit(100)

    if (notificationError) {
      console.error('Error fetching notifications:', notificationError)
      return
    }

    if (!unreadNotifications || unreadNotifications.length === 0) {
      console.log('No unread notifications to process')
      return
    }

    // Group by user
    const userNotifications = (unreadNotifications as Notification[]).reduce((acc: Record<string, Notification[]>, notification: Notification) => {
      if (!acc[notification.target_id]) {
        acc[notification.target_id] = []
      }
      acc[notification.target_id].push(notification)
      return acc
    }, {})

    console.log(`Found notifications for ${Object.keys(userNotifications).length} users`)
    
    // Here you would implement actual notification delivery
    // For now, just log the summary
    for (const [userId, notifications] of Object.entries(userNotifications)) {
      console.log(`User ${userId} has ${(notifications as Notification[]).length} unread notifications`)
    }
  } catch (error) {
    console.error('Send notification summaries job failed:', error)
  }
}