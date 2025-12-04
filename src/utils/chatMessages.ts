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
        sender_role: 'SCHOOL_USER' as const
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
        sender_role: 'ADMIN' as const
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
        sender_role: 'ADMIN' as const
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
