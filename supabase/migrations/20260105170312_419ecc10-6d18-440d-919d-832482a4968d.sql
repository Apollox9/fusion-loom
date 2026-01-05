-- Create demo_requests table for storing demo requests from the Demo page
CREATE TABLE public.demo_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_name TEXT NOT NULL,
  location TEXT NOT NULL,
  headmaster_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create guest_messages table for storing contact form messages
CREATE TABLE public.guest_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on demo_requests
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Enable RLS on guest_messages
ALTER TABLE public.guest_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert demo requests (public form)
CREATE POLICY "Anyone can create demo requests"
ON public.demo_requests
FOR INSERT
WITH CHECK (true);

-- Only admins can view demo requests
CREATE POLICY "Admins can view demo requests"
ON public.demo_requests
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'::user_role
));

-- Only admins can update demo requests
CREATE POLICY "Admins can update demo requests"
ON public.demo_requests
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'::user_role
));

-- Allow anyone to insert guest messages (public contact form)
CREATE POLICY "Anyone can create guest messages"
ON public.guest_messages
FOR INSERT
WITH CHECK (true);

-- Only admins can view guest messages
CREATE POLICY "Admins can view guest messages"
ON public.guest_messages
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'::user_role
));

-- Only admins can update guest messages (mark as read)
CREATE POLICY "Admins can update guest messages"
ON public.guest_messages
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'::user_role
));

-- Create triggers for updated_at
CREATE TRIGGER update_demo_requests_updated_at
BEFORE UPDATE ON public.demo_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();