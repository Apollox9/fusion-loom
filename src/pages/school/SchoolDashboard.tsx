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
  AlertCircle,
  DollarSign,
  FileText,
  Settings,
  School,
  Upload,
  LogOut
} from 'lucide-react';
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Animated Counter Component
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

  return (
    <span className="font-bold text-2xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

export default function SchoolDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [schoolData, setSchoolData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useRoleBasedAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      fetchSchoolData();
    }
  }, [profile]);

  const fetchSchoolData = async () => {
    try {
      // Fetch school data and statistics
      const { data: school } = await supabase
        .from('schools')
        .select('*')
        .limit(1)
        .single();

      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('created_by_user', profile?.id);

      setSchoolData({
        school: school || { name: "Your School", studentCount: 0 },
        stats: {
          submittedStudents: orders?.length || 0,
          verifiedGarments: 0,
          inPrinting: 0,
          completed: 0,
          projectedProfit: 0
        },
        recentSubmissions: []
      });
    } catch (error) {
      console.error('Error fetching school data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      verified: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      printing: { color: "bg-purple-100 text-purple-800", icon: Printer },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Welcome back, {schoolData?.school?.name || profile?.full_name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your uniform printing workflow and track your progress
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Student Count</p>
                <p className="font-semibold text-primary">
                  {schoolData?.school?.studentCount || 0}
                </p>
              </div>
              <Button 
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                onClick={() => {/* Open upload modal */}}
              >
                <Upload className="w-4 h-4 mr-2" />
                New Submission
              </Button>
              <Button 
                variant="outline"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow animate-fade-in-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Submitted</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <AnimatedCounter end={schoolData?.stats?.submittedStudents || 0} />
                <span className="text-sm text-muted-foreground">/ {schoolData?.school?.studentCount || 0}</span>
              </div>
              <Progress 
                value={schoolData?.school?.studentCount ? (schoolData.stats.submittedStudents / schoolData.school.studentCount) * 100 : 0} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Garments</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <AnimatedCounter end={schoolData?.stats?.verifiedGarments || 0} />
              <p className="text-xs text-muted-foreground mt-1">
                Ready for printing
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Printer className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <AnimatedCounter end={schoolData?.stats?.inPrinting || 0} />
              <p className="text-xs text-muted-foreground mt-1">
                Currently printing
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <AnimatedCounter end={schoolData?.stats?.projectedProfit || 0} prefix="TZS " />
              <p className="text-xs text-muted-foreground mt-1">
                Based on tier percentage
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <School className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="submissions" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Submissions</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center space-x-2">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="profits" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Profits</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                  <CardDescription>Latest student uniform submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {schoolData?.recentSubmissions?.length > 0 ? (
                      schoolData.recentSubmissions.slice(0, 5).map((submission: any) => (
                        <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                          <div>
                            <p className="font-medium">{submission.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {submission.garments} garment{submission.garments > 1 ? 's' : ''} • {submission.inkType} ink
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(submission.status)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No submissions yet</p>
                        <p className="text-sm">Upload your first session to get started</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Progress Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Printing Pipeline</CardTitle>
                  <CardDescription>Current status of your uniform orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>Awaiting Verification</span>
                      </div>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Verified & Ready</span>
                      </div>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span>In Printing</span>
                      </div>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Completed</span>
                      </div>
                      <span className="font-semibold">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other tabs content would go here */}
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Student Submissions</CardTitle>
                <CardDescription>Manage and track all student uniform submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No submissions available</p>
                  <Button className="mt-4 bg-gradient-to-r from-primary to-blue-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Session Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Print Progress Tracking</CardTitle>
                <CardDescription>Real-time status of your uniform printing orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Printer className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No ongoing sessions</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profits">
            <Card>
              <CardHeader>
                <CardTitle>Profit Overview</CardTitle>
                <CardDescription>Your earnings from uniform printing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No profit data available</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>School Settings</CardTitle>
                <CardDescription>Update your school information and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">School Name</label>
                      <input 
                        type="text" 
                        value={schoolData?.school?.name || ''} 
                        className="w-full p-2 border rounded-lg bg-background"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Student Count</label>
                      <input 
                        type="number" 
                        value={schoolData?.school?.studentCount || 0} 
                        className="w-full p-2 border rounded-lg bg-background"
                        readOnly
                      />
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-primary to-blue-600">Update Information</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
