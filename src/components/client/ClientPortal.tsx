import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Plus, Eye, FileSpreadsheet } from 'lucide-react';
import { SessionUpload } from './SessionUpload';
import { SessionPreview } from './SessionPreview';
import { PaymentSubmission } from './PaymentSubmission';
import { useToast } from '@/hooks/use-toast';

interface Session {
  id: string;
  school_name: string;
  status: 'unsubmitted' | 'submitted' | 'queued' | 'ongoing' | 'completed';
  total_classes: number;
  total_students: number;
  total_dark_garments: number;
  total_light_garments: number;
  created_at: string;
}

export function ClientPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [schoolName, setSchoolName] = useState('');
  const [currentView, setCurrentView] = useState<'sessions' | 'upload' | 'preview' | 'payment'>('sessions');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchoolProfile();
    fetchSessions();
  }, []);

  const fetchSchoolProfile = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profile) {
        // Get school name - this would be from school table based on user's association
        setSchoolName('Demo High School'); // For now, using demo data
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockSessions: Session[] = [
        {
          id: '1',
          school_name: 'Demo High School',
          status: 'completed',
          total_classes: 12,
          total_students: 450,
          total_dark_garments: 270,
          total_light_garments: 180,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          school_name: 'Demo High School',
          status: 'ongoing',
          total_classes: 8,
          total_students: 320,
          total_dark_garments: 192,
          total_light_garments: 128,
          created_at: '2024-02-01T09:30:00Z'
        }
      ];
      setSessions(mockSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = () => {
    setCurrentView('upload');
    setSelectedSession(null);
  };

  const handleUploadComplete = (data: any) => {
    setSessionData(data);
    setCurrentView('preview');
  };

  const handlePreviewConfirm = (confirmedData: any) => {
    setSessionData(confirmedData);
    setCurrentView('payment');
  };

  const handlePaymentSubmit = () => {
    toast({
      title: 'Session Submitted',
      description: 'Your session has been submitted successfully'
    });
    setCurrentView('sessions');
    fetchSessions();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'ongoing': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'queued': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'submitted': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'unsubmitted': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (currentView === 'upload') {
    return (
      <SessionUpload
        onComplete={handleUploadComplete}
        onCancel={() => setCurrentView('sessions')}
        schoolName={schoolName}
      />
    );
  }

  if (currentView === 'preview') {
    return (
      <SessionPreview
        data={sessionData}
        schoolName={schoolName}
        onConfirm={handlePreviewConfirm}
        onDiscard={() => setCurrentView('sessions')}
      />
    );
  }

  if (currentView === 'payment') {
    return (
      <PaymentSubmission
        sessionData={sessionData}
        onSubmit={handlePaymentSubmit}
        onCancel={() => setCurrentView('sessions')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Welcome, {schoolName}
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your printing sessions and track progress
              </p>
            </div>
            <Button
              onClick={createNewSession}
              className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Session
            </Button>
          </div>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : sessions.length === 0 ? (
          <Card className="border-dashed border-2 border-muted-foreground/25 bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <FileSpreadsheet className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No sessions yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Create your first printing session to get started
              </p>
              <Button
                onClick={createNewSession}
                className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <Card key={session.id} className="group hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Session #{session.id}</CardTitle>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(session.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Classes:</span>
                        <span className="font-medium">{session.total_classes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Students:</span>
                        <span className="font-medium">{session.total_students}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dark:</span>
                        <span className="font-medium">{session.total_dark_garments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Light:</span>
                        <span className="font-medium">{session.total_light_garments}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedSession(session);
                          // Would open session details view
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {session.status === 'unsubmitted' && (
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
                          onClick={() => {
                            setSelectedSession(session);
                            setCurrentView('payment');
                          }}
                        >
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}