import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  LogOut
} from 'lucide-react';
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuditorDashboard() {
  const [auditorId, setAuditorId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [recentAudits, setRecentAudits] = useState([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useRoleBasedAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      fetchRecentAudits();
    }
  }, [profile]);

  const fetchRecentAudits = async () => {
    try {
      // TODO: Will work after database types regenerate
      // const { data } = await supabase
      //   .from('audit_sessions')
      //   .select('*')
      //   .eq('auditor_user_id', profile?.id)
      //   .order('created_at', { ascending: false })
      //   .limit(10);

      setRecentAudits([]);
    } catch (error) {
      console.error('Error fetching recent audits:', error);
    }
  };

  const handleStartAudit = async () => {
    if (!auditorId || !sessionId) {
      alert('Please enter both Auditor ID and Session ID');
      return;
    }

    setLoading(true);

    try {
      // Check if session exists in orders table
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('external_ref', sessionId)
        .single();

      if (!order) {
        alert('Session not found. Please check the Session ID.');
        setLoading(false);
        return;
      }

      // Create or update audit session
      // TODO: Will work after database types regenerate
      alert('Audit session feature will be available after database sync completes.');
      
      // const { data: auditSession } = await supabase
      //   .from('audit_sessions')
      //   .upsert({
      //     session_id: sessionId,
      //     auditor_id: auditorId,
      //     auditor_user_id: profile?.id,
      //     order_id: order.id,
      //     status: 'IN_PROGRESS'
      //   })
      //   .select()
      //   .single();

      // if (auditSession) {
      //   navigate(`/auditor/audit/${auditSession.id}`);
      // }
    } catch (error) {
      console.error('Error starting audit:', error);
      alert('Error starting audit. Please try again.');
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'IN_PROGRESS': { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      'COMPLETED': { color: "bg-green-100 text-green-800", icon: CheckCircle },
      'PAUSED': { color: "bg-blue-100 text-blue-800", icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;
    
    return (
      <Badge className={`${config?.color || 'bg-gray-100 text-gray-800'} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status.toLowerCase().replace('_', ' ')}</span>
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Auditor Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {profile?.full_name}
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Start New Audit Section */}
        <Card className="mb-8 animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Start New Audit Session</span>
            </CardTitle>
            <CardDescription>
              Enter your Auditor ID and Session ID to begin a new audit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="auditor-id">Auditor ID</Label>
                <Input
                  id="auditor-id"
                  placeholder="Enter your Auditor ID"
                  value={auditorId}
                  onChange={(e) => setAuditorId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-id">Session ID</Label>
                <Input
                  id="session-id"
                  placeholder="Enter Session ID"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleStartAudit}
                  disabled={loading || !auditorId || !sessionId}
                  className="w-full bg-gradient-to-r from-primary to-blue-600"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Start Audit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Audit Reports */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>My Recent Audit Reports</span>
            </CardTitle>
            <CardDescription>
              View and continue your previous audit sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAudits.length > 0 ? (
              <div className="space-y-4">
                {recentAudits.map((audit: any) => (
                  <div 
                    key={audit.id} 
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/auditor/audit/${audit.id}`)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Session: {audit.session_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Auditor: {audit.auditor_id}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(audit.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(audit.status)}
                      <Button variant="outline" size="sm">
                        {audit.status === 'COMPLETED' ? 'View' : 'Continue'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No audit reports yet</p>
                <p className="text-sm">Start your first audit session above</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}