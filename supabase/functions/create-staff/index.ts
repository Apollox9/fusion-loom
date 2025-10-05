import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'ADMIN') {
      console.error('Permission check failed:', profileError);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, fullName, phoneNumber, role, staffId } = await req.json();

    console.log('Creating staff member:', { email, fullName, role, staffId });

    // Create auth user with service role
    const { data: authData, error: authError2 } = await supabaseClient.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-12),
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role
      }
    });

    if (authError2) {
      console.error('Failed to create auth user:', authError2);
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError2.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auth user created:', authData.user.id);

    // Insert into staff table
    const { error: staffError } = await supabaseClient
      .from('staff')
      .insert({
        staff_id: staffId,
        user_id: authData.user.id,
        email: email,
        full_name: fullName,
        phone_number: phoneNumber,
        role: role,
        created_by_admin: user.id
      });

    if (staffError) {
      console.error('Failed to insert staff record:', staffError);
      // Try to clean up the auth user
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: `Failed to create staff record: ${staffError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Staff record created');

    // Check if role already exists (from trigger), if not insert
    const { data: existingRole } = await supabaseClient
      .from('user_roles')
      .select('id')
      .eq('user_id', authData.user.id)
      .eq('role', role)
      .single();

    if (!existingRole) {
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: role,
          created_by: user.id
        });

      if (roleError) {
        console.error('Failed to insert user role:', roleError);
        // Clean up staff and auth user
        await supabaseClient.from('staff').delete().eq('user_id', authData.user.id);
        await supabaseClient.auth.admin.deleteUser(authData.user.id);
        return new Response(
          JSON.stringify({ error: `Failed to assign role: ${roleError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('User role verified/assigned successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authData.user.id,
        staffId: staffId 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
