-- Fix students table column names (rename to match code expectations)
ALTER TABLE students 
  RENAME COLUMN dark_garment_count TO total_dark_garment_count;

ALTER TABLE students 
  RENAME COLUMN light_garment_count TO total_light_garment_count;

-- Add order_id to classes table to link classes to specific orders
ALTER TABLE classes
  ADD COLUMN order_id uuid REFERENCES orders(id) ON DELETE SET NULL;

-- Create index for order_id lookups
CREATE INDEX idx_classes_order_id ON classes(order_id);

-- Create storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for receipt uploads
CREATE POLICY "Users can upload receipts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ANY(ARRAY['SCHOOL_USER'::user_role, 'ADMIN'::user_role])))
);

-- Create storage policy for viewing receipts
CREATE POLICY "Authenticated users can view receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'receipts' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'::user_role))
);

-- Create payment_methods table
CREATE TABLE payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Payment methods policies
CREATE POLICY "Everyone can view active payment methods"
ON payment_methods
FOR SELECT
USING (is_active = true OR EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'::user_role
));

CREATE POLICY "Admins can manage payment methods"
ON payment_methods
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'::user_role
));

-- Insert default payment methods
INSERT INTO payment_methods (name, description) VALUES
  ('M-Pesa', 'Mobile money payment via M-Pesa'),
  ('Bank Transfer', 'Direct bank transfer'),
  ('Cash', 'Cash payment'),
  ('Tigopesa', 'Mobile money payment via Tigopesa'),
  ('Airtel Money', 'Mobile money payment via Airtel Money')
ON CONFLICT (name) DO NOTHING;

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE classes;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE pending_orders;

-- Enable full replication for realtime
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE classes REPLICA IDENTITY FULL;
ALTER TABLE students REPLICA IDENTITY FULL;
ALTER TABLE pending_orders REPLICA IDENTITY FULL;