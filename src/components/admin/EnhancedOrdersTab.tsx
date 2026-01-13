import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { formatTZS } from '@/utils/pricing';
import { toast } from 'sonner';
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes, isPast } from 'date-fns';
import { 
  Eye, Search, ArrowUpDown, Users, Package, Clock, CheckCircle, 
  AlertCircle, CalendarIcon, Copy, Check, XCircle, Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderPreviewDialog } from '@/components/admin/OrderPreviewDialog';

interface Order {
  id: string;
  external_ref: string | null;
  school_name: string | null;
  total_students: number;
  total_amount: number | null;
  total_garments: number;
  status: string;
  created_at: string;
  created_by_school: string;
  total_students_served_in_school: number;
  total_classes_served: number;
  total_classes_to_serve: number;
  session_data: any;
  scheduled_date: string | null;
  schedule_message_copied_at: string | null;
  estimated_duration_hours: number | null;
  country: string | null;
  region: string | null;
  district: string | null;
  headmaster_name: string | null;
}

interface PendingOrder {
  id: string;
  order_id: string;
  school_name: string;
  total_amount: number;
  total_students: number;
  total_dark_garments: number;
  total_light_garments: number;
  payment_method: string;
  receipt_number: string | null;
  receipt_image_url: string | null;
  created_at: string;
  country: string;
  region: string;
  district: string;
  headmaster_name: string;
  session_data: any;
  school_id: string;
}

interface EnhancedOrdersTabProps {
  orders: Order[];
  pendingOrders: PendingOrder[];
  onVerifyPayment: (orderId: string, approve: boolean) => Promise<void>;
  verifyingOrderId: string | null;
  verifyingAction: 'approve' | 'reject' | null;
  onRefresh: () => void;
}

export function EnhancedOrdersTab({ 
  orders, 
  pendingOrders, 
  onVerifyPayment, 
  verifyingOrderId, 
  verifyingAction,
  onRefresh 
}: EnhancedOrdersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'school'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Progress dialog state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [classProgress, setClassProgress] = useState<any[]>([]);
  const [studentProgress, setStudentProgress] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  
  // Schedule dialog state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [schedulingOrder, setSchedulingOrder] = useState<Order | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [isScheduling, setIsScheduling] = useState(false);
  
  // Preview dialog state
  const [previewOrder, setPreviewOrder] = useState<PendingOrder | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Blinking state for queued orders
  const [blinkQueued, setBlinkQueued] = useState(false);
  
  // Copied message tracking
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Blink animation for queued orders
  useEffect(() => {
    const queuedCount = orders.filter(o => o.status === 'QUEUED').length;
    if (queuedCount > 0) {
      const interval = setInterval(() => {
        setBlinkQueued(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [orders]);

  const statusOptions = [
    'all', 'PENDING', 'SUBMITTED', 'QUEUED', 'ONGOING', 'COMPLETED'
  ];

  const statusColors: { [key: string]: string } = {
    'PENDING': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
    'UNSUBMITTED': 'bg-gray-500/20 text-gray-700 border-gray-500/30',
    'SUBMITTED': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
    'CONFIRMED': 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
    'AUTO_CONFIRMED': 'bg-teal-500/20 text-teal-700 border-teal-500/30',
    'QUEUED': 'bg-purple-500/20 text-purple-700 border-purple-500/30',
    'PICKUP': 'bg-indigo-500/20 text-indigo-700 border-indigo-500/30',
    'ONGOING': 'bg-orange-500/20 text-orange-700 border-orange-500/30',
    'DONE': 'bg-green-500/20 text-green-700 border-green-500/30',
    'PACKAGING': 'bg-cyan-500/20 text-cyan-700 border-cyan-500/30',
    'DELIVERY': 'bg-pink-500/20 text-pink-700 border-pink-500/30',
    'COMPLETED': 'bg-emerald-600/20 text-emerald-800 border-emerald-600/30',
    'ABORTED': 'bg-red-500/20 text-red-700 border-red-500/30'
  };

  // Calculate estimated duration based on garments
  const calculateEstimatedDuration = (totalGarments: number): { hours: number, display: string } => {
    // Each garment takes 1-2 minutes, team works 20 hours a day
    const minMinutes = totalGarments * 1;
    const maxMinutes = totalGarments * 2;
    const minHours = minMinutes / 60;
    const maxHours = maxMinutes / 60;
    
    // Convert to working days (20 hours per day)
    const workingHoursPerDay = 20;
    
    if (maxHours <= workingHoursPerDay) {
      // Less than a day
      const minH = Math.ceil(minHours);
      const maxH = Math.ceil(maxHours);
      return { 
        hours: (minHours + maxHours) / 2,
        display: minH === maxH ? `${minH} hours` : `${minH}-${maxH} hours` 
      };
    } else {
      // Multiple days
      const minDays = Math.ceil(minHours / workingHoursPerDay);
      const maxDays = Math.ceil(maxHours / workingHoursPerDay);
      return { 
        hours: (minHours + maxHours) / 2,
        display: minDays === maxDays ? `${minDays} day(s)` : `${minDays}-${maxDays} days` 
      };
    }
  };

  // Generate schedule message
  const generateScheduleMessage = (order: Order): string => {
    const scheduledDateStr = order.scheduled_date 
      ? format(new Date(order.scheduled_date), 'EEEE, MMMM do, yyyy')
      : 'TBD';
    const duration = calculateEstimatedDuration(order.total_garments || 0);
    
    return `Dear ${order.headmaster_name || 'Headmaster'},

Greetings from Project Fusion!

We are pleased to inform you that your school uniform printing session has been scheduled.

📍 School: ${order.school_name}
📍 Location: ${order.district || ''}, ${order.region || ''}, ${order.country || ''}
📋 Order ID: ${order.external_ref || order.id.slice(0, 8)}
📊 Total Students: ${order.total_students || 0}
👕 Total Garments: ${order.total_garments || 0}

📅 Scheduled Date: ${scheduledDateStr}
⏱️ Estimated Duration: ${duration.display}

Please ensure all garments are prepared and students are available on the scheduled date. Our team will arrive in the morning to begin the printing session.

If you have any questions or need to reschedule, please contact us immediately.

Best regards,
Project Fusion Team`;
  };

  // Handle schedule button click
  const handleScheduleClick = (order: Order) => {
    setSchedulingOrder(order);
    setScheduledDate(order.scheduled_date ? new Date(order.scheduled_date) : undefined);
    setShowScheduleDialog(true);
  };

  // Handle schedule save
  const handleScheduleSave = async () => {
    if (!schedulingOrder || !scheduledDate) return;
    
    setIsScheduling(true);
    try {
      const duration = calculateEstimatedDuration(schedulingOrder.total_garments || 0);
      
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'QUEUED',
          scheduled_date: scheduledDate.toISOString(),
          estimated_duration_hours: duration.hours,
          queued_at: new Date().toISOString()
        })
        .eq('id', schedulingOrder.id);

      if (error) throw error;
      
      toast.success('Order scheduled successfully!');
      setShowScheduleDialog(false);
      setSchedulingOrder(null);
      onRefresh();
    } catch (error: any) {
      console.error('Error scheduling order:', error);
      toast.error(error.message || 'Failed to schedule order');
    } finally {
      setIsScheduling(false);
    }
  };

  // Handle copy message
  const handleCopyMessage = async (order: Order) => {
    const message = generateScheduleMessage(order);
    try {
      await navigator.clipboard.writeText(message);
      setCopiedOrderId(order.id);
      
      // Update the copied timestamp
      await supabase
        .from('orders')
        .update({ schedule_message_copied_at: new Date().toISOString() })
        .eq('id', order.id);
      
      toast.success('Schedule message copied to clipboard!');
      
      setTimeout(() => setCopiedOrderId(null), 3000);
      onRefresh();
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  // Countdown display for queued orders
  const getCountdownDisplay = (scheduledDate: string | null) => {
    if (!scheduledDate) return null;
    
    const scheduled = new Date(scheduledDate);
    const now = new Date();
    
    if (isPast(scheduled)) {
      return { isOverdue: true, display: 'OVERDUE' };
    }
    
    const hoursRemaining = differenceInHours(scheduled, now);
    const minutesRemaining = differenceInMinutes(scheduled, now) % 60;
    
    if (hoursRemaining >= 24) {
      const days = Math.floor(hoursRemaining / 24);
      return { isOverdue: false, display: `${days}d ${hoursRemaining % 24}h` };
    }
    
    return { isOverdue: false, display: `${hoursRemaining}h ${minutesRemaining}m` };
  };

  // Fetch order progress
  const fetchOrderProgress = async (orderId: string) => {
    setIsLoadingProgress(true);
    try {
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('session_id', orderId)
        .order('name');

      if (classError) throw classError;
      
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('session_id', orderId);
      
      if (studentsError) throw studentsError;
      
      const classesWithStudents = (classes || []).map(cls => ({
        ...cls,
        students: (allStudents || []).filter(s => s.class_id === cls.id)
      }));
      
      setClassProgress(classesWithStudents);

      if (classesWithStudents.length > 0) {
        setSelectedClass(classesWithStudents[0].id);
        setStudentProgress(classesWithStudents[0].students || []);
      }
    } catch (error) {
      console.error('Error fetching order progress:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const handleViewProgress = async (order: Order) => {
    setSelectedOrder(order);
    setShowProgressDialog(true);
    await fetchOrderProgress(order.id);
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    const cls = classProgress.find(c => c.id === classId);
    if (cls?.students) {
      setStudentProgress(cls.students);
    }
  };

  // Status counts
  const statusCounts = {
    all: orders.length,
    pending: pendingOrders.length,
    submitted: orders.filter(o => o.status === 'SUBMITTED' || o.status === 'CONFIRMED').length,
    queued: orders.filter(o => o.status === 'QUEUED').length,
    ongoing: orders.filter(o => o.status === 'ONGOING').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length
  };

  // Filter orders based on status
  const getFilteredOrders = () => {
    if (statusFilter === 'PENDING') return [];
    
    let filtered = orders;
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'SUBMITTED') {
        filtered = orders.filter(o => o.status === 'SUBMITTED' || o.status === 'CONFIRMED');
      } else {
        filtered = orders.filter(o => o.status === statusFilter);
      }
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.external_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'school':
          comparison = (a.school_name || '').localeCompare(b.school_name || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const filteredOrders = getFilteredOrders();
  const queuedOrders = orders.filter(o => o.status === 'QUEUED');
  const hasOverdueQueued = queuedOrders.some(o => {
    if (!o.scheduled_date) return false;
    return isPast(new Date(o.scheduled_date));
  });

  return (
    <div className="space-y-6">
      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card 
          className={cn(
            "bg-gradient-card border-border/50 hover-lift cursor-pointer transition-all",
            statusFilter === 'all' && "ring-2 ring-primary"
          )}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">All Orders</p>
                <p className="text-2xl font-bold text-primary">{statusCounts.all}</p>
              </div>
              <Package className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "bg-gradient-card border-border/50 hover-lift cursor-pointer transition-all",
            statusFilter === 'PENDING' && "ring-2 ring-yellow-500",
            pendingOrders.length > 0 && "border-yellow-500/50"
          )}
          onClick={() => setStatusFilter('PENDING')}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">{statusCounts.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "bg-gradient-card border-border/50 hover-lift cursor-pointer transition-all",
            statusFilter === 'SUBMITTED' && "ring-2 ring-blue-500"
          )}
          onClick={() => setStatusFilter('SUBMITTED')}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="text-2xl font-bold text-blue-500">{statusCounts.submitted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "bg-gradient-card border-border/50 hover-lift cursor-pointer transition-all",
            statusFilter === 'QUEUED' && "ring-2 ring-purple-500",
            blinkQueued && statusCounts.queued > 0 && "bg-purple-500/10",
            hasOverdueQueued && "border-red-500 bg-red-500/10"
          )}
          onClick={() => setStatusFilter('QUEUED')}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Queued</p>
                <p className={cn(
                  "text-2xl font-bold",
                  hasOverdueQueued ? "text-red-500" : "text-purple-500"
                )}>{statusCounts.queued}</p>
              </div>
              <Timer className={cn(
                "h-8 w-8",
                hasOverdueQueued ? "text-red-500/30" : "text-purple-500/30"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "bg-gradient-card border-border/50 hover-lift cursor-pointer transition-all",
            statusFilter === 'ONGOING' && "ring-2 ring-orange-500"
          )}
          onClick={() => setStatusFilter('ONGOING')}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ongoing</p>
                <p className="text-2xl font-bold text-orange-500">{statusCounts.ongoing}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "bg-gradient-card border-border/50 hover-lift cursor-pointer transition-all",
            statusFilter === 'COMPLETED' && "ring-2 ring-emerald-500"
          )}
          onClick={() => setStatusFilter('COMPLETED')}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-emerald-500">{statusCounts.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by school, order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="school">School</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Orders Section */}
      {statusFilter === 'PENDING' && (
        <Card className="bg-gradient-card border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-yellow-600">Pending Payment Verifications</CardTitle>
            <CardDescription>Review and verify school payment submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-500 opacity-50" />
                <p>No pending orders to verify</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrders.map((order, index) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-bold text-muted-foreground">{index + 1}.</TableCell>
                      <TableCell className="font-mono font-medium">{order.order_id}</TableCell>
                      <TableCell>{order.school_name}</TableCell>
                      <TableCell className="font-semibold">{formatTZS(order.total_amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.payment_method}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setPreviewOrder(order);
                              setShowPreview(true);
                            }}
                            disabled={verifyingOrderId === order.id}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => onVerifyPayment(order.id, true)}
                            disabled={verifyingOrderId !== null}
                          >
                            {verifyingOrderId === order.id && verifyingAction === 'approve' ? (
                              <>
                                <div className="h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => onVerifyPayment(order.id, false)}
                            disabled={verifyingOrderId !== null}
                          >
                            {verifyingOrderId === order.id && verifyingAction === 'reject' ? (
                              <>
                                <div className="h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Regular Orders Table */}
      {statusFilter !== 'PENDING' && (
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold gradient-text">
              {statusFilter === 'all' ? 'All Orders' : `${statusFilter} Orders`}
            </CardTitle>
            <CardDescription>
              Showing {filteredOrders.length} orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No orders found matching your criteria</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Garments</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    {statusFilter === 'QUEUED' && <TableHead>Countdown</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order, index) => {
                    const countdown = getCountdownDisplay(order.scheduled_date);
                    return (
                      <TableRow 
                        key={order.id} 
                        className={cn(
                          "transition-colors",
                          countdown?.isOverdue && "bg-red-500/10 hover:bg-red-500/20"
                        )}
                      >
                        <TableCell className="font-bold text-muted-foreground">
                          {index + 1}.
                        </TableCell>
                        <TableCell className="font-medium font-mono">
                          {order.external_ref || order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{order.school_name || 'Unknown School'}</p>
                          {order.status === 'QUEUED' && order.schedule_message_copied_at && (
                            <p className="text-xs text-muted-foreground">
                              Message copied {formatDistanceToNow(new Date(order.schedule_message_copied_at), { addSuffix: true })}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{order.total_students || 0}</TableCell>
                        <TableCell>{order.total_garments || 0}</TableCell>
                        <TableCell className="font-semibold text-primary">
                          {formatTZS(order.total_amount || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status] || 'bg-muted'}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        {statusFilter === 'QUEUED' && (
                          <TableCell>
                            {countdown && (
                              <Badge 
                                className={cn(
                                  countdown.isOverdue 
                                    ? "bg-red-500 text-white animate-pulse" 
                                    : "bg-purple-500/20 text-purple-700"
                                )}
                              >
                                {countdown.display}
                              </Badge>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {/* Schedule button for SUBMITTED orders */}
                            {(order.status === 'SUBMITTED' || order.status === 'CONFIRMED') && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleScheduleClick(order)}
                              >
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                Schedule
                              </Button>
                            )}
                            
                            {/* Copy message button for QUEUED orders */}
                            {order.status === 'QUEUED' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleCopyMessage(order)}
                              >
                                {copiedOrderId === order.id ? (
                                  <Check className="h-4 w-4 mr-1 text-emerald-500" />
                                ) : (
                                  <Copy className="h-4 w-4 mr-1" />
                                )}
                                {copiedOrderId === order.id ? 'Copied!' : 'Copy Message'}
                              </Button>
                            )}
                            
                            {/* View/Progress button */}
                            <Button 
                              variant={order.status === 'ONGOING' ? 'default' : 'ghost'} 
                              size="sm"
                              onClick={() => handleViewProgress(order)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              {order.status === 'ONGOING' ? 'Progress' : 'View'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Printing Session</DialogTitle>
            <DialogDescription>
              Set the date for the printing session at {schedulingOrder?.school_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Calendar
                mode="single"
                selected={scheduledDate}
                onSelect={setScheduledDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
            
            {schedulingOrder && (
              <div className="bg-accent/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Order Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="text-muted-foreground">Order ID:</span> {schedulingOrder.external_ref || schedulingOrder.id.slice(0, 8)}</p>
                  <p><span className="text-muted-foreground">Students:</span> {schedulingOrder.total_students}</p>
                  <p><span className="text-muted-foreground">Garments:</span> {schedulingOrder.total_garments}</p>
                  <p><span className="text-muted-foreground">Est. Duration:</span> {calculateEstimatedDuration(schedulingOrder.total_garments || 0).display}</p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleScheduleSave} 
              disabled={!scheduledDate || isScheduling}
            >
              {isScheduling ? 'Scheduling...' : 'Schedule & Queue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedOrder?.status === 'ONGOING' ? 'Order Progress' : 'Order Details'} - {selectedOrder?.external_ref || selectedOrder?.id?.slice(0, 8)}
            </DialogTitle>
            <DialogDescription>{selectedOrder?.school_name}</DialogDescription>
          </DialogHeader>
          
          {isLoadingProgress ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-accent/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedOrder?.status || ''] || 'bg-muted'}>
                    {selectedOrder?.status}
                  </Badge>
                </div>
                <div className="p-3 bg-accent/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Students</p>
                  <p className="font-bold">{selectedOrder?.total_students}</p>
                </div>
                <div className="p-3 bg-accent/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Garments</p>
                  <p className="font-bold">{selectedOrder?.total_garments}</p>
                </div>
                <div className="p-3 bg-accent/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-bold">{formatTZS(selectedOrder?.total_amount || 0)}</p>
                </div>
              </div>

              {/* Progress for ongoing orders */}
              {selectedOrder?.status === 'ONGOING' && classProgress.length > 0 && (
                <>
                  <div className="p-4 bg-accent/20 rounded-lg">
                    <h4 className="font-medium mb-3">Overall Progress</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Students Served</span>
                        <span>
                          {classProgress.reduce((total, cls) => 
                            total + (cls.students?.filter((s: any) => s.is_served).length || 0), 0
                          )} / {selectedOrder.total_students}
                        </span>
                      </div>
                      <Progress 
                        value={
                          selectedOrder.total_students > 0
                            ? (classProgress.reduce((total, cls) => 
                                total + (cls.students?.filter((s: any) => s.is_served).length || 0), 0
                              ) / selectedOrder.total_students) * 100
                            : 0
                        } 
                        className="h-2"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Classes ({classProgress.filter(c => c.is_attended).length}/{classProgress.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                      {classProgress.map(cls => {
                        const studentsServed = cls.students?.filter((s: any) => s.is_served).length || 0;
                        const totalStudents = cls.students?.length || 0;
                        return (
                          <Button
                            key={cls.id}
                            variant={selectedClass === cls.id ? 'default' : 'outline'}
                            size="sm"
                            className="justify-start"
                            onClick={() => handleClassSelect(cls.id)}
                          >
                            <span className={cn(
                              "w-2 h-2 rounded-full mr-2",
                              cls.is_attended ? 'bg-emerald-500' : 'bg-yellow-500'
                            )} />
                            {cls.name}
                            <span className="ml-auto text-xs opacity-70">
                              {studentsServed}/{totalStudents}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedClass && studentProgress.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">
                        Students ({studentProgress.filter(s => s.is_served).length}/{studentProgress.length} served)
                      </h4>
                      <div className="max-h-[200px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Dark</TableHead>
                              <TableHead>Light</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentProgress.map((student: any) => (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.full_name}</TableCell>
                                <TableCell>{student.total_dark_garment_count}</TableCell>
                                <TableCell>{student.total_light_garment_count}</TableCell>
                                <TableCell>
                                  <Badge className={student.is_served ? 'bg-emerald-500/20 text-emerald-700' : 'bg-yellow-500/20 text-yellow-700'}>
                                    {student.is_served ? 'Served' : 'Pending'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Preview Dialog */}
      {previewOrder && (
        <OrderPreviewDialog
          order={previewOrder}
          open={showPreview}
          onOpenChange={setShowPreview}
        />
      )}
    </div>
  );
}
