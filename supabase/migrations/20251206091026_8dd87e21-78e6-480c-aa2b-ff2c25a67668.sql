-- Add logo_url column to payment_methods table
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS logo_url text;

-- Create storage bucket for payment method logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-method-logos', 'payment-method-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for payment method logos
CREATE POLICY "Admins can upload payment method logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-method-logos' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'ADMIN'
  )
);

CREATE POLICY "Admins can update payment method logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'payment-method-logos' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'ADMIN'
  )
);

CREATE POLICY "Admins can delete payment method logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'payment-method-logos' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'ADMIN'
  )
);

CREATE POLICY "Anyone can view payment method logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-method-logos');