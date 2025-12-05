import { supabase } from '@/integrations/supabase/client';

// Send automatic message when order is submitted
export async function sendOrderSubmittedMessage(
  schoolUserId: string,
  schoolName: string,
  orderId: string
) {
  try {
    // Find admin user
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'ADMIN')
      .limit(1)
      .single();

    if (!adminProfile) {
      console.error('No admin found to send message to');
      return;
    }

    // Find or create conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .contains('participants', [schoolUserId, adminProfile.id])
      .eq('subject', `Support: ${schoolName}`)
      .maybeSingle();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          subject: `Support: ${schoolName}`,
          participants: [schoolUserId, adminProfile.id],
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error || !newConv) {
        console.error('Failed to create conversation:', error);
        return;
      }
      conversationId = newConv.id;
    }

    // Send automatic message
    const message = `📋 New Order Submitted!\n\nOrder ID: ${orderId}\nSchool: ${schoolName}\n\nThis order is pending verification. Please review the payment details.`;

    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_user_id: schoolUserId,
        text: message,
        sender_role: 'SCHOOL_USER' as const,
        is_read_by: { [schoolUserId]: true }
      });

    if (msgError) {
      console.error('Failed to send message:', msgError);
      return;
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    console.log('Order submitted message sent successfully');
  } catch (error) {
    console.error('Error sending order submitted message:', error);
  }
}

// Send automatic message when order is approved
export async function sendOrderApprovedMessage(
  schoolUserId: string,
  schoolName: string,
  orderId: string,
  externalRef: string
) {
  try {
    // Find admin user
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'ADMIN')
      .limit(1)
      .single();

    if (!adminProfile) {
      console.error('No admin found');
      return;
    }

    // Find or create conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .contains('participants', [schoolUserId, adminProfile.id])
      .maybeSingle();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          subject: `Support: ${schoolName}`,
          participants: [schoolUserId, adminProfile.id],
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error || !newConv) {
        console.error('Failed to create conversation:', error);
        return;
      }
      conversationId = newConv.id;
    }

    // Send automatic message from admin
    const message = `✅ Order Confirmed!\n\nDear ${schoolName},\n\nYour order has been confirmed and queued to the printing pipeline.\n\n📋 Order ID: ${externalRef}\n\nYou will receive an SMS notification when our team is scheduled to arrive at your school for the printing job.\n\nThank you for choosing Project Fusion!`;

    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_user_id: adminProfile.id,
        text: message,
        sender_role: 'ADMIN' as const,
        is_read_by: { [adminProfile.id]: true }
      });

    if (msgError) {
      console.error('Failed to send message:', msgError);
      return;
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    console.log('Order approved message sent successfully');
  } catch (error) {
    console.error('Error sending order approved message:', error);
  }
}

// Send automatic message when order is rejected
export async function sendOrderRejectedMessage(
  schoolUserId: string,
  schoolName: string,
  orderId: string
) {
  try {
    // Find admin user
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'ADMIN')
      .limit(1)
      .single();

    if (!adminProfile) {
      console.error('No admin found');
      return;
    }

    // Find or create conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .contains('participants', [schoolUserId, adminProfile.id])
      .maybeSingle();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          subject: `Support: ${schoolName}`,
          participants: [schoolUserId, adminProfile.id],
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error || !newConv) {
        console.error('Failed to create conversation:', error);
        return;
      }
      conversationId = newConv.id;
    }

    // Send automatic message from admin
    const message = `❌ Order Rejected\n\nDear ${schoolName},\n\nWe regret to inform you that your order (${orderId}) could not be verified and has been rejected.\n\nPlease contact support for more information or to resubmit your order with valid payment proof.\n\nThank you for your understanding.`;

    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_user_id: adminProfile.id,
        text: message,
        sender_role: 'ADMIN' as const,
        is_read_by: { [adminProfile.id]: true }
      });

    if (msgError) {
      console.error('Failed to send message:', msgError);
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

  } catch (error) {
    console.error('Error sending order rejected message:', error);
  }
}

// Send automatic message when order status changes
export async function sendOrderStatusUpdateMessage(
  schoolUserId: string,
  schoolName: string,
  orderId: string,
  newStatus: string
) {
  try {
    // Find admin user
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'ADMIN')
      .limit(1)
      .single();

    if (!adminProfile) {
      console.error('No admin found');
      return;
    }

    // Find or create conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .contains('participants', [schoolUserId, adminProfile.id])
      .maybeSingle();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          subject: `Support: ${schoolName}`,
          participants: [schoolUserId, adminProfile.id],
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error || !newConv) {
        console.error('Failed to create conversation:', error);
        return;
      }
      conversationId = newConv.id;
    }

    // Generate message based on status
    const statusMessages: Record<string, string> = {
      'QUEUED': `📋 Order Update\n\nDear ${schoolName},\n\nYour order (${orderId}) has been queued for processing.\n\nYou will be notified when our team is ready to pick up your garments.`,
      'PICKUP': `🚗 Pickup Scheduled\n\nDear ${schoolName},\n\nOur team is on the way to pick up garments for order ${orderId}.\n\nPlease ensure all garments are ready for collection.`,
      'ONGOING': `🖨️ Printing In Progress\n\nDear ${schoolName},\n\nGreat news! Printing has started for your order (${orderId}).\n\nYou can track the progress in your dashboard.`,
      'DONE': `✅ Printing Complete\n\nDear ${schoolName},\n\nPrinting has been completed for your order (${orderId}).\n\nYour garments are now being prepared for packaging.`,
      'PACKAGING': `📦 Packaging\n\nDear ${schoolName},\n\nYour order (${orderId}) is currently being packaged.\n\nSoon it will be ready for delivery.`,
      'DELIVERY': `🚚 Out for Delivery\n\nDear ${schoolName},\n\nYour order (${orderId}) is on its way!\n\nOur team will deliver it to your school shortly.`,
      'COMPLETED': `🎉 Order Completed!\n\nDear ${schoolName},\n\nYour order (${orderId}) has been completed and delivered.\n\nThank you for choosing Project Fusion!`,
      'ABORTED': `⚠️ Order Aborted\n\nDear ${schoolName},\n\nUnfortunately, your order (${orderId}) has been aborted.\n\nPlease contact support for more information.`
    };

    const message = statusMessages[newStatus];
    if (!message) return;

    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_user_id: adminProfile.id,
        text: message,
        sender_role: 'ADMIN' as const,
        is_read_by: { [adminProfile.id]: true }
      });

    if (msgError) {
      console.error('Failed to send status update message:', msgError);
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

  } catch (error) {
    console.error('Error sending order status update message:', error);
  }
}
