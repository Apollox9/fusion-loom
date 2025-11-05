-- Update order_status enum to match new requirements
-- First, remove default constraint
ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;

-- Rename old enum
ALTER TYPE order_status RENAME TO order_status_old;

-- Create new enum with correct values
CREATE TYPE order_status AS ENUM (
  'UNSUBMITTED',
  'SUBMITTED',
  'QUEUED',
  'PICKUP',
  'ONGOING',
  'ABORTED',
  'DONE',
  'PACKAGING',
  'DELIVERY',
  'COMPLETED',
  'CONFIRMED',
  'AUTO_CONFIRMED'
);

-- Update orders table to use new enum and migrate existing data
ALTER TABLE orders 
  ALTER COLUMN status TYPE order_status 
  USING (
    CASE status::text
      WHEN 'PENDING' THEN 'SUBMITTED'::order_status
      WHEN 'IN_PROGRESS' THEN 'ONGOING'::order_status
      WHEN 'DELIVERED' THEN 'COMPLETED'::order_status
      WHEN 'CONFIRMED' THEN 'CONFIRMED'::order_status
      WHEN 'QUEUED' THEN 'QUEUED'::order_status
      WHEN 'COMPLETED' THEN 'COMPLETED'::order_status
      ELSE 'UNSUBMITTED'::order_status
    END
  );

-- Set new default
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'UNSUBMITTED'::order_status;

-- Drop old enum
DROP TYPE order_status_old;

-- Fix RLS policies for orders table to allow school users to view their own orders
DROP POLICY IF EXISTS "Users can view orders for their school" ON orders;

CREATE POLICY "Users can view orders for their school"
ON orders
FOR SELECT
USING (
  created_by_user = auth.uid() 
  OR created_by_school = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND (
      profiles.role = 'ADMIN'
      OR profiles.role = 'OPERATOR' 
      OR profiles.role = 'SUPERVISOR'
    )
  )
);

-- Update RLS policy for pending_orders to allow school users to see their data
DROP POLICY IF EXISTS "School users can view their pending orders" ON pending_orders;

CREATE POLICY "School users can view their pending orders"
ON pending_orders
FOR SELECT
USING (
  school_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'SCHOOL_USER'
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'ADMIN'
  )
);

-- Add session_id column to classes if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'classes' 
    AND column_name = 'session_id'
  ) THEN
    ALTER TABLE classes ADD COLUMN session_id uuid REFERENCES orders(id);
    CREATE INDEX idx_classes_session_id ON classes(session_id);
  END IF;
END $$;