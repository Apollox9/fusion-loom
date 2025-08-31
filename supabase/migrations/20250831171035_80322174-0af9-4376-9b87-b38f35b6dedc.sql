-- Create audit_reports table for storing audit reports
CREATE TABLE public.audit_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  auditor_id TEXT NOT NULL,
  auditor_user_id UUID NOT NULL,
  school_id UUID NOT NULL,
  report_details JSONB NOT NULL DEFAULT '{}',
  discrepancies_found BOOLEAN NOT NULL DEFAULT false,
  total_students_audited INTEGER NOT NULL DEFAULT 0,
  students_with_discrepancies INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  submitted_to_admin_at TIMESTAMP WITH TIME ZONE,
  sent_to_school_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_audits table for tracking individual student audits
CREATE TABLE public.student_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_report_id UUID NOT NULL REFERENCES public.audit_reports(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  submitted_dark_garments INTEGER NOT NULL DEFAULT 0,
  submitted_light_garments INTEGER NOT NULL DEFAULT 0,
  collected_dark_garments INTEGER NOT NULL DEFAULT 0,
  collected_light_garments INTEGER NOT NULL DEFAULT 0,
  dark_garments_discrepancy INTEGER NOT NULL DEFAULT 0,
  light_garments_discrepancy INTEGER NOT NULL DEFAULT 0,
  has_discrepancy BOOLEAN NOT NULL DEFAULT false,
  auditor_notes TEXT,
  audited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_audits ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_reports
CREATE POLICY "Auditors can create audit reports" 
ON public.audit_reports 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['ADMIN'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role])
  )
);

CREATE POLICY "Staff can view audit reports" 
ON public.audit_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['ADMIN'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role])
  )
);

CREATE POLICY "Admins can update audit reports" 
ON public.audit_reports 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'ADMIN'::user_role
  )
);

-- Create policies for student_audits
CREATE POLICY "Auditors can create student audits" 
ON public.student_audits 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['ADMIN'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role])
  )
);

CREATE POLICY "Staff can view student audits" 
ON public.student_audits 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['ADMIN'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role])
  )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_audit_reports_updated_at
BEFORE UPDATE ON public.audit_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_audit_reports_session_id ON public.audit_reports(session_id);
CREATE INDEX idx_audit_reports_auditor_id ON public.audit_reports(auditor_id);
CREATE INDEX idx_audit_reports_school_id ON public.audit_reports(school_id);
CREATE INDEX idx_student_audits_audit_report_id ON public.student_audits(audit_report_id);
CREATE INDEX idx_student_audits_student_id ON public.student_audits(student_id);