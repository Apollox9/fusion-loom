import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Printer, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  DollarSign,
  FileText,
  Settings,
  School,
  Upload,
  LogOut,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SessionUpload } from '@/components/client/SessionUpload';
import { SessionPreview } from '@/components/client/SessionPreview';
import { PaymentSubmission } from '@/components/client/PaymentSubmission';
import { SessionFormGenerator } from '@/components/client/SessionFormGenerator';
import { formatTZS, calculateProfitByTier, getProfitTier } from '@/utils/pricing';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { SchoolSettings } from '@/components/client/SchoolSettings';
import { ProfitTab } from '@/components/client/ProfitTab';
import { ProgressTabContent } from '@/components/client/ProgressTabContent';
import { SubmissionsTracking } from '@/components/client/SubmissionsTracking';
import { SchoolChatPanel } from '@/components/chat/SchoolChatPanel';

const AnimatedCounter = ({ end, duration = 2000, prefix = "", suffix = "" }: { 
  end: number; 
  duration?: number; 
  prefix?: string; 
  suffix?: string; 
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <span className="font-bold text-2xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">{prefix}{count.toLocaleString()}{suffix}</span>;
};

export default function SchoolDashboard() {
  const { user, profile, signOut } = useAuthContext();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [currentView, setCurrentView] = useState<'dashboard' | 'upload' | 'preview' | 'payment'>('dashboard');
  const [uploadTab, setUploadTab] = useState<'generate' | 'upload'>('generate');
  const [sessionData, setSessionData] = useState<any>(null);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    submittedStudents: 0,
    totalStudents: 0,
    verifiedGarments: 0,
    inPrinting: 0,
    completed: 0,
    projectedProfit: 0
  });
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSchoolData();
    }
  }, [user]);

  useEffect(() => {
    if (schoolData) {
      fetchSessions();
    }
  }, [schoolData]);

  const fetchSchoolData = async () => {
    try {
      if (!user?.id) return;
      
      // Fetch school linked to this user
      const { data } = await supabase
        .from('schools')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) setSchoolData(data);
    } catch (error) {
      console.error('Error fetching school data:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      if (!schoolData?.id) return;
      
      // Fetch from both pending_orders and orders using school_id
      const { data: pendingData } = await supabase
        .from('pending_orders')
        .select('*')
        .eq('school_id', schoolData.id)
        .order('created_at', { ascending: false });

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('created_by_school', schoolData.id)
        .order('created_at', { ascending: false });

      // Combine and map pending orders to have status 'PENDING'
      const pending = (pendingData || []).map(p => ({
        ...p,
        status: 'PENDING',
        id: p.id,
        external_ref: p.order_id
      }));

      const all = [...pending, ...(ordersData || [])];
      setSessions(all);

      // Find latest pending order OR latest non-COMPLETED order for top cards
      const latestPending = pending[0];
      const latestActive = ordersData?.find((o: any) => o.status !== 'COMPLETED');
      const displaySession = latestPending || latestActive;

      if (displaySession) {
        const sessionStudents = displaySession.total_students || 0;
        const sessionGarments = (displaySession.total_dark_garments || 0) + (displaySession.total_light_garments || 0);
        const sessionAmount = Number(displaySession.total_amount) || 0;
        
        // Calculate profit based on tier percentage
        const profit = calculateProfitByTier(sessionStudents, sessionAmount);
        
        // Count active orders
        const activeCount = ordersData?.filter((o: any) => 
          ['QUEUED', 'PICKUP', 'ONGOING', 'PACKAGING', 'DELIVERY'].includes(o.status)
        ).length || 0;

        setStats({
          submittedStudents: sessionStudents,
          totalStudents: sessionStudents,
          verifiedGarments: sessionGarments,
          inPrinting: activeCount,
          completed: 0,
          projectedProfit: profit
        });
      } else {
        setStats({
          submittedStudents: 0,
          totalStudents: 0,
          verifiedGarments: 0,
          inPrinting: 0,
          completed: 0,
          projectedProfit: 0
        });
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleUploadComplete = (data: any) => {
    setSessionData(data);
    setCurrentView('preview');
  };

  const handlePreviewConfirm = (confirmedData: any) => {
    setSessionData(confirmedData);
    setCurrentView('payment');
  };

  const handlePaymentSubmit = async () => {
    toast({ title: 'Session Submitted', description: 'Your session is pending admin confirmation' });
    setCurrentView('dashboard');
    fetchSessions();
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, any> = {
      'UNSUBMITTED': { color: "bg-gray-500/20 text-gray-800 dark:text-gray-300", icon: Clock },
      'PENDING': { color: "bg-yellow-500/20 text-yellow-800 dark:text-yellow-300", icon: Clock },
      'SUBMITTED': { color: "bg-blue-500/20 text-blue-800 dark:text-blue-300", icon: CheckCircle },
      'CONFIRMED': { color: "bg-blue-500/20 text-blue-800 dark:text-blue-300", icon: CheckCircle },
      'AUTO_CONFIRMED': { color: "bg-blue-500/20 text-blue-800 dark:text-blue-300", icon: CheckCircle },
      'QUEUED': { color: "bg-indigo-500/20 text-indigo-800 dark:text-indigo-300", icon: Clock },
      'PICKUP': { color: "bg-purple-500/20 text-purple-800 dark:text-purple-300", icon: Printer },
      'ONGOING': { color: "bg-purple-500/20 text-purple-800 dark:text-purple-300", icon: Printer },
      'DONE': { color: "bg-teal-500/20 text-teal-800 dark:text-teal-300", icon: CheckCircle },
      'PACKAGING': { color: "bg-cyan-500/20 text-cyan-800 dark:text-cyan-300", icon: CheckCircle },
      'DELIVERY': { color: "bg-blue-500/20 text-blue-800 dark:text-blue-300", icon: Printer },
      'COMPLETED': { color: "bg-green-500/20 text-green-800 dark:text-green-300", icon: CheckCircle },
      'ABORTED': { color: "bg-red-500/20 text-red-800 dark:text-red-300", icon: Clock },
    };
    const config = configs[status] || configs['UNSUBMITTED'];
    const Icon = config.icon;
    return <Badge className={`${config.color} flex items-center space-x-1 border`}><Icon className="w-3 h-3" /><span className="capitalize">{status.toLowerCase().replace('_', ' ')}</span></Badge>;
  };

  if (currentView === 'upload') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">New Submission</h1>
                <p className="text-muted-foreground">Generate forms or upload session files</p>
              </div>
              <Button variant="outline" onClick={() => setCurrentView('dashboard')}>
                Back to Dashboard
              </Button>
            </div>
            
            <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as 'generate' | 'upload')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="generate">Generate Session Forms</TabsTrigger>
                <TabsTrigger value="upload">Upload Session Files</TabsTrigger>
              </TabsList>
              
              <TabsContent value="generate" className="mt-6">
                <SessionFormGenerator schoolName={schoolData?.name || profile?.full_name || ''} />
              </TabsContent>
              
              <TabsContent value="upload" className="mt-6">
                <SessionUpload 
                  onComplete={handleUploadComplete} 
                  onCancel={() => setCurrentView('dashboard')} 
                  schoolName={schoolData?.name || profile?.full_name || ''} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'preview') {
    return <SessionPreview data={sessionData} schoolName={schoolData?.name || profile?.full_name || ''} onConfirm={handlePreviewConfirm} onDiscard={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'payment') {
    return <PaymentSubmission sessionData={sessionData} onSubmit={handlePaymentSubmit} onCancel={() => setCurrentView('dashboard')} />;
  }

  const profitTier = getProfitTier(stats.totalStudents);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Welcome back, {schoolData?.name || profile?.full_name}
              </h1>
              <p className="text-muted-foreground mt-1">Manage your uniform printing workflow</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Profit Tier</p>
                <p className="font-semibold text-primary">{profitTier.range} Students ({profitTier.percentage})</p>
              </div>
              <Button onClick={() => setCurrentView('upload')} className="bg-gradient-to-r from-primary to-blue-600"><Upload className="w-4 h-4 mr-2" />New Submission</Button>
              <Button variant="outline" onClick={signOut}><LogOut className="w-4 h-4 mr-2" />Sign Out</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Submitted</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <AnimatedCounter end={stats.submittedStudents} />
                <span className="text-sm text-muted-foreground">/ {stats.totalStudents}</span>
              </div>
              <Progress value={stats.totalStudents > 0 ? (stats.submittedStudents / stats.totalStudents) * 100 : 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Garments</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <AnimatedCounter end={stats.verifiedGarments} />
              <p className="text-xs text-muted-foreground mt-1">Ready for printing</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Printer className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <AnimatedCounter end={stats.inPrinting} />
              <p className="text-xs text-muted-foreground mt-1">Currently printing</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTZS(stats.projectedProfit)}</div>
              <p className="text-xs text-muted-foreground mt-1">{profitTier.percentage} per uniform</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview"><School className="w-4 h-4 mr-2" />Overview</TabsTrigger>
            <TabsTrigger value="submissions"><FileText className="w-4 h-4 mr-2" />Submissions</TabsTrigger>
            <TabsTrigger value="progress"><Printer className="w-4 h-4 mr-2" />Progress</TabsTrigger>
            <TabsTrigger value="profits"><TrendingUp className="w-4 h-4 mr-2" />Profits</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                  <CardDescription>Latest session submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {sessions.length > 0 ? (
                    <div className="space-y-4">
                      {sessions.slice(0, 5).map((session: any) => (
                        <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                          <div>
                            <p className="font-medium">Session: {session.external_ref || session.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">{session.total_garments || 0} garments</p>
                          </div>
                          {getStatusBadge(session.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No submissions yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Printing Pipeline</CardTitle>
                  <CardDescription>Current order status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { statuses: ['PENDING'], label: 'Pending', color: 'bg-yellow-500' },
                      { statuses: ['SUBMITTED', 'CONFIRMED', 'AUTO_CONFIRMED', 'QUEUED'], label: 'Queued', color: 'bg-blue-500' },
                      { statuses: ['PICKUP', 'ONGOING'], label: 'In Progress', color: 'bg-purple-500' },
                      { statuses: ['DONE', 'PACKAGING', 'DELIVERY'], label: 'Processing', color: 'bg-teal-500' },
                      { statuses: ['COMPLETED'], label: 'Completed', color: 'bg-green-500' }
                    ].map((group) => {
                      const count = sessions.filter(s => group.statuses.includes(s.status)).length;
                      return (
                        <div key={group.label} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${group.color}`}></div>
                            <span>{group.label}</span>
                          </div>
                          <span className="font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="submissions">
            <SubmissionsTracking />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressTabContent sessions={sessions.filter(s => s.status === 'ONGOING')} />
          </TabsContent>

          <TabsContent value="profits">
            <ProfitTab sessions={sessions} stats={stats} />
          </TabsContent>

          <TabsContent value="settings">
            <SchoolSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat panel temporarily hidden - functionality preserved
      {user && profile && (
        <SchoolChatPanel
          userId={user.id}
          schoolName={schoolData?.name || profile?.full_name || 'School'}
          isMinimized={!chatOpen}
          onMinimize={() => setChatOpen(!chatOpen)}
          onClose={() => setChatOpen(false)}
        />
      )}
      */}
    </div>
  );
}
