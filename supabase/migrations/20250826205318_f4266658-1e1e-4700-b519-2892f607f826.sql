-- Project Fusion Database Schema
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('ADMIN', 'OPERATOR', 'AUDITOR', 'SUPERVISOR', 'AGENT', 'SCHOOL_USER');
CREATE TYPE notification_channel AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');
CREATE TYPE notification_level AS ENUM ('INFO', 'WARNING', 'ERROR');
CREATE TYPE order_status AS ENUM (
  'UNSUBMITTED', 'SUBMITTED', 'QUEUED', 'PICKUP', 'ONGOING', 
  'ABORTED', 'DONE', 'PACKAGING', 'DELIVERY', 'COMPLETED', 
  'CONFIRMED', 'AUTO_CONFIRMED'
);

-- Create Agent table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  region TEXT,
  country TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Users table (extends auth.users with our custom fields)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'SCHOOL_USER',
  agent_id UUID REFERENCES public.agents(id),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_pass_code TEXT UNIQUE NOT NULL,
  school_id TEXT UNIQUE,
  name TEXT NOT NULL,
  postal_address TEXT,
  email TEXT,
  phone_number1 TEXT,
  phone_number2 TEXT,
  category TEXT,
  country TEXT,
  region TEXT,
  district TEXT,
  total_student_count INTEGER NOT NULL DEFAULT 0,
  total_students_served_in_school INTEGER NOT NULL DEFAULT 0,
  is_session_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_served BOOLEAN NOT NULL DEFAULT FALSE,
  registered_on TIMESTAMPTZ,
  notification_preferences JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id TEXT UNIQUE,
  name TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  is_attended BOOLEAN NOT NULL DEFAULT FALSE,
  total_students_served_in_class INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  total_light_garment_count INTEGER NOT NULL DEFAULT 0,
  total_dark_garment_count INTEGER NOT NULL DEFAULT 0,
  printed_light_garment_count INTEGER NOT NULL DEFAULT 0,
  printed_dark_garment_count INTEGER NOT NULL DEFAULT 0,
  light_garments_printed BOOLEAN NOT NULL DEFAULT FALSE,
  dark_garments_printed BOOLEAN NOT NULL DEFAULT FALSE,
  is_served BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Machines table
CREATE TABLE public.machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT UNIQUE NOT NULL,
  secret_key TEXT NOT NULL,
  model TEXT,
  firmware_version TEXT,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  is_printing BOOLEAN NOT NULL DEFAULT FALSE,
  up_time TEXT,
  sessions_held INTEGER NOT NULL DEFAULT 0,
  active_session TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_ref TEXT,
  created_by_school UUID NOT NULL REFERENCES public.schools(id),
  created_by_user UUID REFERENCES auth.users(id),
  submission_time TIMESTAMPTZ,
  total_garments INTEGER NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'UNSUBMITTED',
  assigned_facility_id TEXT,
  assigned_operator_id UUID REFERENCES auth.users(id),
  queued_at TIMESTAMPTZ,
  confirm_received_at TIMESTAMPTZ,
  auto_confirmed_at TIMESTAMPTZ,
  pickup JSONB,
  printing JSONB,
  packaging JSONB,
  delivery JSONB,
  audit_trail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create OrderItems table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id),
  student_name_cached TEXT NOT NULL,
  dark_count INTEGER NOT NULL DEFAULT 0,
  light_count INTEGER NOT NULL DEFAULT 0,
  printed_dark INTEGER NOT NULL DEFAULT 0,
  printed_light INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  level notification_level NOT NULL DEFAULT 'INFO',
  target_type TEXT,
  target_id UUID,
  channel notification_channel NOT NULL DEFAULT 'IN_APP',
  sender_user_id UUID REFERENCES auth.users(id),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  meta JSONB,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT,
  participants UUID[] NOT NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES auth.users(id),
  sender_role user_role,
  text TEXT NOT NULL,
  attachments JSONB,
  is_read_by JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create PrintEvents table
CREATE TABLE public.print_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  print_job_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create StaffTasks table
CREATE TABLE public.staff_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,
  target_id UUID,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING',
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create StaffMetrics table
CREATE TABLE public.staff_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_user_id UUID NOT NULL REFERENCES auth.users(id),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  tasks_assigned INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  avg_completion_time_seconds INTEGER,
  efficiency_score REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create MachineLocations table
CREATE TABLE public.machine_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create AuditEvents table for comprehensive audit trail
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_type TEXT NOT NULL,
  actor_id UUID,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_schools_service_pass_code ON public.schools(service_pass_code);
CREATE INDEX idx_classes_school_id ON public.classes(school_id);
CREATE INDEX idx_students_school_id ON public.students(school_id);
CREATE INDEX idx_students_class_id ON public.students(class_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_by_school ON public.orders(created_by_school);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_notifications_target ON public.notifications(target_type, target_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_print_events_job_id ON public.print_events(print_job_id);
CREATE INDEX idx_print_events_idempotency ON public.print_events(idempotency_key);
CREATE INDEX idx_audit_events_target ON public.audit_events(target_type, target_id);
CREATE INDEX idx_machines_device_id ON public.machines(device_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create RLS policies for schools
CREATE POLICY "School users can view their school" ON public.schools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'SCHOOL_USER')
    )
  );

CREATE POLICY "Admins can manage schools" ON public.schools
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create RLS policies for orders
CREATE POLICY "Users can view orders for their school" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (
        role = 'ADMIN' OR 
        role = 'OPERATOR' OR 
        role = 'SUPERVISOR'
      )
    ) OR 
    created_by_user = auth.uid()
  );

CREATE POLICY "School users can create orders" ON public.orders
  FOR INSERT WITH CHECK (
    created_by_user = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'SCHOOL_USER'
    )
  );

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_machines_updated_at
  BEFORE UPDATE ON public.machines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup (create profile automatically)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();