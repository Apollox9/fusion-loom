-- Fix security warnings by adding missing RLS policies and updating functions

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'SCHOOL_USER')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add missing RLS policies for all tables

-- Agents policies
CREATE POLICY "Admins can view all agents" ON public.agents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can manage agents" ON public.agents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Classes policies
CREATE POLICY "Users can view classes" ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'SCHOOL_USER')
    )
  );

CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Students policies
CREATE POLICY "Users can view students" ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'SCHOOL_USER')
    )
  );

CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Machines policies
CREATE POLICY "Staff can view machines" ON public.machines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'OPERATOR', 'SUPERVISOR')
    )
  );

CREATE POLICY "Admins can manage machines" ON public.machines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Order items policies
CREATE POLICY "Users can view order items for their orders" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (
        o.created_by_user = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND role IN ('ADMIN', 'OPERATOR', 'SUPERVISOR')
        )
      )
    )
  );

CREATE POLICY "Staff can manage order items" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'OPERATOR', 'SUPERVISOR')
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (
    target_type = 'User' AND target_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Staff can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'OPERATOR', 'SUPERVISOR')
    )
  );

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = ANY(participants) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = ANY(participants)
  );

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (
        auth.uid() = ANY(c.participants) OR
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND role = 'ADMIN'
        )
      )
    )
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND auth.uid() = ANY(c.participants)
    )
  );

-- Print events policies
CREATE POLICY "Staff can view print events" ON public.print_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'OPERATOR', 'SUPERVISOR')
    )
  );

CREATE POLICY "Devices can create print events" ON public.print_events
  FOR INSERT WITH CHECK (true); -- Devices use HMAC auth, not user auth

-- Staff tasks policies
CREATE POLICY "Staff can view their tasks" ON public.staff_tasks
  FOR SELECT USING (
    staff_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERVISOR')
    )
  );

CREATE POLICY "Supervisors can manage staff tasks" ON public.staff_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERVISOR')
    )
  );

-- Staff metrics policies
CREATE POLICY "Staff can view their metrics" ON public.staff_metrics
  FOR SELECT USING (
    staff_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERVISOR')
    )
  );

CREATE POLICY "Admins can manage staff metrics" ON public.staff_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Machine locations policies
CREATE POLICY "Staff can view machine locations" ON public.machine_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'OPERATOR', 'SUPERVISOR')
    )
  );

CREATE POLICY "Devices can create location updates" ON public.machine_locations
  FOR INSERT WITH CHECK (true); -- Devices use HMAC auth

-- Audit events policies
CREATE POLICY "Admins can view audit events" ON public.audit_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "System can create audit events" ON public.audit_events
  FOR INSERT WITH CHECK (true); -- System events