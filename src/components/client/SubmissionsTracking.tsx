import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck,
  AlertCircle,
  FileText,
  Users,
  Shirt
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatTZS } from '@/utils/pricing';

interface Submission {
  id: string;
  order_id?: string; // For pending_orders
  status: string;
  school_name?: string;
  total_students?: number;
  total_dark_garments?: number;
  total_light_garments?: number;
  total_amount?: number;
  created_at: string;
  payment_method?: string;
  receipt_number?: string;
  session_data?: any;
  // For orders table
  external_ref?: string;
  total_students_served_in_school?: number;
  total_classes_to_serve?: number;
  total_classes_served?: number;
}

export function SubmissionsTracking() {
  const { user } = useAuthContext();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
    
    // Set up real-time subscription for orders
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `created_by_school=eq.${user?.id}`
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    // Set up real-time subscription for pending orders
    const pendingChannel = supabase
      .channel('pending-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_orders',
          filter: `school_id=eq.${user?.id}`
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(pendingChannel);
    };
  }, [user?.id]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      // Fetch pending orders
      const { data: pendingData } = await supabase
        .from('pending_orders')
        .select('*')
        .eq('school_id', user?.id)
        .order('created_at', { ascending: false });

      // Fetch confirmed orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('created_by_school', user?.id)
        .order('created_at', { ascending: false });

      // Combine and format
      const pending = (pendingData || []).map((p): Submission => ({
        ...p,
        status: 'PENDING',
        external_ref: p.order_id
      }));

      const all: Submission[] = [...pending, ...(ordersData || [])];
      setSubmissions(all);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      'PENDING': { 
        color: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border-yellow-500/30', 
        icon: Clock,
        label: 'Pending Approval',
        description: 'Waiting for admin verification'
      },
      'SUBMITTED': { 
        color: 'bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-500/30', 
        icon: FileText,
        label: 'Submitted',
        description: 'Order has been approved'
      },
      'QUEUED': { 
        color: 'bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-500/30', 
        icon: Package,
        label: 'In Queue',
        description: 'Waiting to start production'
      },
      'ONGOING': { 
        color: 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-500/30', 
        icon: Package,
        label: 'In Progress',
        description: 'Currently printing'
      },
      'PACKAGING': { 
        color: 'bg-teal-500/20 text-teal-800 dark:text-teal-300 border-teal-500/30', 
        icon: Package,
        label: 'Packaging',
        description: 'Preparing for delivery'
      },
      'DELIVERY': { 
        color: 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-500/30', 
        icon: Truck,
        label: 'Out for Delivery',
        description: 'On the way'
      },
      'COMPLETED': { 
        color: 'bg-green-500/20 text-green-800 dark:text-green-300 border-green-500/30', 
        icon: CheckCircle2,
        label: 'Completed',
        description: 'Order delivered'
      },
      'ABORTED': { 
        color: 'bg-red-500/20 text-red-800 dark:text-red-300 border-red-500/30', 
        icon: AlertCircle,
        label: 'Cancelled',
        description: 'Order was cancelled'
      }
    };
    return configs[status] || configs['PENDING'];
  };

  const calculateProgress = (submission: Submission) => {
    if (submission.status === 'PENDING') return 10;
    if (submission.status === 'SUBMITTED') return 20;
    if (submission.status === 'QUEUED') return 30;
    if (submission.status === 'ONGOING') {
      // Live progress based on served students
      const served = submission.total_students_served_in_school || 0;
      const total = submission.total_students || submission.session_data?.totalStudents || 1;
      return 40 + ((served / total) * 40); // 40-80% range
    }
    if (submission.status === 'PACKAGING') return 85;
    if (submission.status === 'DELIVERY') return 95;
    if (submission.status === 'COMPLETED') return 100;
    if (submission.status === 'ABORTED') return 0;
    return 0;
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'PENDING');
  const activeSubmissions = submissions.filter(s => 
    ['SUBMITTED', 'QUEUED', 'ONGOING', 'PACKAGING', 'DELIVERY'].includes(s.status)
  );
  const completedSubmissions = submissions.filter(s => 
    ['COMPLETED', 'ABORTED'].includes(s.status)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({submissions.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingSubmissions.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeSubmissions.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedSubmissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {submissions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No submissions yet</p>
              </CardContent>
            </Card>
          ) : (
            submissions.map(submission => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onViewDetails={() => {
                  setSelectedSubmission(submission);
                  setShowDetails(true);
                }}
                progress={calculateProgress(submission)}
                statusConfig={getStatusConfig(submission.status)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingSubmissions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No pending submissions</p>
              </CardContent>
            </Card>
          ) : (
            pendingSubmissions.map(submission => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onViewDetails={() => {
                  setSelectedSubmission(submission);
                  setShowDetails(true);
                }}
                progress={calculateProgress(submission)}
                statusConfig={getStatusConfig(submission.status)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4 mt-6">
          {activeSubmissions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No active orders</p>
              </CardContent>
            </Card>
          ) : (
            activeSubmissions.map(submission => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onViewDetails={() => {
                  setSelectedSubmission(submission);
                  setShowDetails(true);
                }}
                progress={calculateProgress(submission)}
                statusConfig={getStatusConfig(submission.status)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedSubmissions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No completed orders</p>
              </CardContent>
            </Card>
          ) : (
            completedSubmissions.map(submission => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onViewDetails={() => {
                  setSelectedSubmission(submission);
                  setShowDetails(true);
                }}
                progress={calculateProgress(submission)}
                statusConfig={getStatusConfig(submission.status)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order ID: {selectedSubmission?.order_id || selectedSubmission?.external_ref}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusConfig(selectedSubmission.status).color}>
                    {getStatusConfig(selectedSubmission.status).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(selectedSubmission.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="font-medium">
                    {selectedSubmission.total_students || selectedSubmission.session_data?.totalStudents || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium">{formatTZS(selectedSubmission.total_amount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dark Garments</p>
                  <p className="font-medium">
                    {selectedSubmission.total_dark_garments || selectedSubmission.session_data?.totalDarkGarments || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Light Garments</p>
                  <p className="font-medium">
                    {selectedSubmission.total_light_garments || selectedSubmission.session_data?.totalLightGarments || 0}
                  </p>
                </div>
                {selectedSubmission.status === 'ONGOING' && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Students Served</p>
                      <p className="font-medium">
                        {selectedSubmission.total_students_served_in_school || 0} / {selectedSubmission.total_students || selectedSubmission.session_data?.totalStudents || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Classes Progress</p>
                      <p className="font-medium">
                        {selectedSubmission.total_classes_served || 0} / {selectedSubmission.total_classes_to_serve || 0}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Progress</p>
                <Progress value={calculateProgress(selectedSubmission)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(calculateProgress(selectedSubmission))}% Complete
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SubmissionCardProps {
  submission: Submission;
  onViewDetails: () => void;
  progress: number;
  statusConfig: any;
}

function SubmissionCard({ submission, onViewDetails, progress, statusConfig }: SubmissionCardProps) {
  const StatusIcon = statusConfig.icon;
  
  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              Order {submission.order_id || submission.external_ref}
            </CardTitle>
            <CardDescription className="mt-1">
              {new Date(submission.created_at).toLocaleDateString()} at {new Date(submission.created_at).toLocaleTimeString()}
            </CardDescription>
          </div>
          <Badge className={statusConfig.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span>Students</span>
              </div>
              <p className="font-medium">
                {submission.total_students || submission.session_data?.totalStudents || 0}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Shirt className="w-4 h-4" />
                <span>Garments</span>
              </div>
              <p className="font-medium">
                {(submission.total_dark_garments || 0) + (submission.total_light_garments || 0)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <span>Amount</span>
              </div>
              <p className="font-medium">{formatTZS(submission.total_amount || 0)}</p>
            </div>
          </div>

          {/* Live Progress for ONGOING orders */}
          {submission.status === 'ONGOING' && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Live Progress</span>
                <span className="text-sm text-muted-foreground">
                  {submission.total_students_served_in_school || 0} / {submission.total_students || submission.session_data?.totalStudents || 0} students
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(progress)}% Complete
              </p>
            </div>
          )}

          {/* Progress Bar for other statuses */}
          {submission.status !== 'ONGOING' && (
            <div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {statusConfig.description}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onViewDetails}
            >
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
