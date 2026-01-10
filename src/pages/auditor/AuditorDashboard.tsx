import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  ClipboardCheck, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  FileText,
  TrendingUp
} from 'lucide-react';

export default function AuditorDashboard() {
  const navigate = useNavigate();
  const { profile, loading } = useRoleBasedAuth();
  const { signOut } = useAuth();
  
  const [auditorId, setAuditorId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAudits: 0,
    completedAudits: 0,
    inProgressAudits: 0,
    discrepanciesFound: 0
  });

  useEffect(() => {
    if (profile) {
      fetchAuditorData();
    }
  }, [profile]);

  const fetchAuditorData = async () => {
    try {
      // Fetch auditor's recent audit reports
      const { data: auditsData, error } = await supabase
        .from('audit_reports')
        .select('*')
        .eq('auditor_user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentAudits(auditsData || []);

      // Calculate stats
      const total = auditsData?.length || 0;
      const completed = auditsData?.filter(a => a.status === 'COMPLETED').length || 0;
      const inProgress = auditsData?.filter(a => a.status === 'IN_PROGRESS').length || 0;
      const withDiscrepancies = auditsData?.filter(a => a.discrepancies_found).length || 0;

      setStats({
        totalAudits: total,
        completedAudits: completed,
        inProgressAudits: inProgress,
        discrepanciesFound: withDiscrepancies
      });
    } catch (error) {
      console.error('Error fetching auditor data:', error);
    }
  };

  const handleStartAudit = async () => {
    if (!auditorId.trim() || !sessionId.trim()) {
      toast.error('Please enter both Auditor ID and Session ID');
      return;
    }

    // Normalize inputs - trim whitespace and uppercase for matching
    const normalizedAuditorId = auditorId.trim().toUpperCase();
    const normalizedSessionId = sessionId.trim().toUpperCase();

    try {
      // First validate the auditor ID exists in staff table (case-insensitive)
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .ilike('staff_id', normalizedAuditorId)
        .maybeSingle();

      if (staffError) {
        console.error('Error validating staff ID:', staffError);
        toast.error('Error validating Auditor ID');
        return;
      }

      if (!staffData) {
        toast.error('Invalid Auditor ID. Please check and try again.');
        return;
      }

      // Verify the staff is an auditor or has appropriate role
      if (!['AUDITOR', 'OPERATOR', 'SUPERVISOR', 'ADMIN'].includes(staffData.role)) {
        toast.error('This Staff ID does not have auditing permissions');
        return;
      }

      // Check if session exists in orders using external_ref (case-insensitive)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .ilike('external_ref', normalizedSessionId)
        .maybeSingle();

      if (orderError) {
        console.error('Error finding session:', orderError);
        toast.error('Error looking up Session ID');
        return;
      }

      if (!orderData) {
        toast.error('Session ID not found. Please check the Order ID.');
        return;
      }

      // Check for existing audit report for this session (by any auditor)
      const { data: existingAudit } = await supabase
        .from('audit_reports')
        .select('*')
        .ilike('session_id', normalizedSessionId)
        .maybeSingle();

      if (existingAudit) {
        // Navigate to existing audit - allow any auditor to continue
        toast.info('Continuing existing audit session');
        navigate(`/auditor/audit/${existingAudit.id}`);
      } else {
        // Create new audit report - use the actual external_ref from DB for consistency
        const { data: newAudit, error: auditError } = await supabase
          .from('audit_reports')
          .insert({
            session_id: orderData.external_ref,
            auditor_id: staffData.staff_id,
            auditor_user_id: profile?.id,
            school_id: orderData.created_by_school,
            status: 'IN_PROGRESS',
            report_details: { audit_trail: [] }
          })
          .select()
          .single();

        if (auditError) throw auditError;

        toast.success('Audit session started successfully');
        navigate(`/auditor/audit/${newAudit.id}`);
      }
    } catch (error: any) {
      console.error('Error starting audit:', error);
      toast.error(error.message || 'Failed to start audit session');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            In Progress
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'PAUSED':
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Paused
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Auditor Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAudits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedAudits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgressAudits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Discrepancies</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.discrepanciesFound}</div>
            </CardContent>
          </Card>
        </div>

        {/* Start New Audit */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Start New Audit Session
            </CardTitle>
            <CardDescription>Enter your auditor ID and the session ID to begin auditing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="auditor-id">Auditor ID</Label>
                <Input
                  id="auditor-id"
                  placeholder="e.g., AUD1234567"
                  value={auditorId}
                  onChange={(e) => setAuditorId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-id">Session ID</Label>
                <Input
                  id="session-id"
                  placeholder="e.g., SESSION-12345"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleStartAudit} className="w-full md:w-auto">
              Start Audit Session
            </Button>
          </CardContent>
        </Card>

        {/* Recent Audits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Recent Audit Reports
            </CardTitle>
            <CardDescription>View your audit history and status</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAudits.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No audit reports yet</p>
                <p className="text-sm text-muted-foreground">Start your first audit session above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAudits.map((audit) => (
                  <div
                    key={audit.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/auditor/audit/${audit.id}`)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Session: {audit.session_id}</p>
                        {getStatusBadge(audit.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Auditor: {audit.auditor_id} • {new Date(audit.created_at).toLocaleDateString()}
                      </p>
                      {audit.discrepancies_found && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Discrepancies found: {audit.students_with_discrepancies} students
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{audit.total_students_audited} students</p>
                      <p className="text-xs text-muted-foreground">audited</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}