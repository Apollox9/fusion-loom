import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Users, 
  School, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  CheckCircle, 
  XCircle,
  Clock,
  Edit,
  Trash2,
  UserPlus,
  Database,
  Eye
} from 'lucide-react';
import { generateStaffId } from '@/utils/staffIdGenerator';
import { formatCurrency } from '@/utils/pricing';
import { OrderPreviewDialog } from '@/components/admin/OrderPreviewDialog';
import { AdminChatPanel } from '@/components/chat/AdminChatPanel';
import { sendOrderApprovedMessage, sendOrderRejectedMessage } from '@/utils/chatMessages';
import { FinancesTab } from '@/components/finances/FinancesTab';
import { OrdersTabContent } from '@/components/admin/OrdersTabContent';
import { DemoRequestsTab } from '@/components/admin/DemoRequestsTab';
import { GuestMessagesTab } from '@/components/admin/GuestMessagesTab';
import { StaffTabContent } from '@/components/admin/StaffTabContent';

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Notification badge counts
  const [badgeCounts, setBadgeCounts] = useState({
    newSchools: 0,
    newOrders: 0,
    newDemoRequests: 0,
    newGuestMessages: 0,
    newMessages: 0
  });
  
  // State for overview stats
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalStaff: 0,
    activeAudits: 0
  });

  // State for schools
  const [schools, setSchools] = useState<any[]>([]);
  const [searchSchool, setSearchSchool] = useState('');
  const [schoolSort, setSchoolSort] = useState<'name' | 'date' | 'type'>('name');
  const [schoolTypeFilter, setSchoolTypeFilter] = useState<string>('all');

  // State for orders
  const [orders, setOrders] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [previewOrder, setPreviewOrder] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // State for staff
  const [staff, setStaff] = useState<any[]>([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  
  // Loading state for payment verification
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [verifyingAction, setVerifyingAction] = useState<'approve' | 'reject' | null>(null);
  const [newStaff, setNewStaff] = useState<{
    email: string;
    fullName: string;
    phoneNumber: string;
    role: 'OPERATOR' | 'SUPERVISOR' | 'AUDITOR' | 'AGENT';
    businessName?: string;
    country?: string;
    region?: string;
  }>({
    email: '',
    fullName: '',
    phoneNumber: '',
    role: 'OPERATOR'
  });

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch notification badge counts
  const fetchBadgeCounts = async () => {
    try {
      const [demoRes, guestRes, messagesRes] = await Promise.all([
        supabase.from('demo_requests').select('id', { count: 'exact' }).eq('is_read', false),
        supabase.from('guest_messages').select('id', { count: 'exact' }).eq('is_read', false),
        supabase.from('messages').select('id', { count: 'exact' }).neq('sender_role', 'ADMIN')
      ]);
      
      setBadgeCounts(prev => ({
        ...prev,
        newDemoRequests: demoRes.count || 0,
        newGuestMessages: guestRes.count || 0,
        newOrders: pendingOrders.length
      }));
    } catch (error) {
      console.error('Error fetching badge counts:', error);
    }
  };

  useEffect(() => {
    if (profile?.role === 'ADMIN') {
      fetchDashboardData();
      fetchBadgeCounts();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      // Fetch schools
      const { data: schoolsData } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });
      setSchools(schoolsData || []);

      // Fetch orders and generate signed URLs for receipts
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Generate signed URLs for order receipts
      if (ordersData) {
        const ordersWithSignedUrls = await Promise.all(
          ordersData.map(async (order) => {
            if (order.receipt_image_url) {
              try {
                const pathMatch = order.receipt_image_url.match(/receipts\/(.+)$/);
                if (pathMatch) {
                  const { data: signedData } = await supabase.storage
                    .from('receipts')
                    .createSignedUrl(pathMatch[1], 31536000); // 1 year expiry
                  if (signedData?.signedUrl) {
                    return { ...order, receipt_image_url: signedData.signedUrl };
                  }
                }
              } catch (error) {
                console.error('Error generating signed URL for order:', error);
              }
            }
            return order;
          })
        );
        setOrders(ordersWithSignedUrls);
      } else {
        setOrders([]);
      }

      // Fetch pending orders and generate signed URLs for receipts
      const { data: pendingData } = await supabase
        .from('pending_orders')
        .select('*')
        .eq('payment_verified', false)
        .order('created_at', { ascending: false });
      
      // Generate signed URLs for pending order receipts
      if (pendingData) {
        const pendingWithSignedUrls = await Promise.all(
          pendingData.map(async (order) => {
            if (order.receipt_image_url) {
              try {
                const pathMatch = order.receipt_image_url.match(/receipts\/(.+)$/);
                if (pathMatch) {
                  const { data: signedData } = await supabase.storage
                    .from('receipts')
                    .createSignedUrl(pathMatch[1], 31536000); // 1 year expiry
                  if (signedData?.signedUrl) {
                    return { ...order, receipt_image_url: signedData.signedUrl };
                  }
                }
              } catch (error) {
                console.error('Error generating signed URL for pending order:', error);
              }
            }
            return order;
          })
        );
        setPendingOrders(pendingWithSignedUrls);
      } else {
        setPendingOrders([]);
      }

      // Fetch staff
      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });
      setStaff(staffData || []);

      // Calculate stats
      const revenue = ordersData?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
      const pendingCount = pendingData?.length || 0; // Count from pending_orders table

      setStats({
        totalSchools: schoolsData?.length || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue: revenue,
        pendingOrders: pendingCount, // Fixed: now shows pending_orders count
        totalStaff: staffData?.length || 0,
        activeAudits: 0 // TODO: fetch from audit_reports
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const handleCreateStaff = async () => {
    try {
      setIsCreatingStaff(true);
      const staffId = generateStaffId(newStaff.role);
      
      // Call edge function to create staff with admin privileges
      const body: any = {
        email: newStaff.email,
        fullName: newStaff.fullName,
        phoneNumber: newStaff.phoneNumber,
        role: newStaff.role,
        staffId: staffId
      };

      // Add agent-specific fields if role is AGENT
      if (newStaff.role === 'AGENT') {
        body.businessName = newStaff.businessName;
        body.country = newStaff.country;
        body.region = newStaff.region;
      }

      const { data, error } = await supabase.functions.invoke('create-staff', {
        body
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create staff member');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create staff member');
      }

      toast.success(`Staff member created successfully (ID: ${staffId})`);

      setShowAddStaff(false);
      setNewStaff({
        email: '',
        fullName: '',
        phoneNumber: '',
        role: 'OPERATOR',
        businessName: '',
        country: '',
        region: ''
      });
      
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      toast.error(error.message || "Failed to create staff member. Please check your permissions.");
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const handleVerifyPayment = async (orderId: string, approve: boolean) => {
    setVerifyingOrderId(orderId);
    setVerifyingAction(approve ? 'approve' : 'reject');
    
    try {
      const pendingOrder = pendingOrders.find(o => o.id === orderId);
      if (!pendingOrder) {
        toast.error("Order not found");
        setVerifyingOrderId(null);
        setVerifyingAction(null);
        return;
      }
      
      // Get the school user_id for sending chat message
      const { data: schoolData } = await supabase
        .from('schools')
        .select('user_id')
        .eq('id', pendingOrder.school_id)
        .single();
      
      const schoolUserId = schoolData?.user_id;

      if (approve) {
        // Generate signed URL for receipt image if it exists
        let signedReceiptUrl = pendingOrder.receipt_image_url;
        if (pendingOrder.receipt_image_url) {
          try {
            const pathMatch = pendingOrder.receipt_image_url.match(/receipts\/(.+)$/);
            if (pathMatch) {
              const { data: signedData } = await supabase.storage
                .from('receipts')
                .createSignedUrl(pathMatch[1], 31536000); // 1 year expiry
              if (signedData?.signedUrl) {
                signedReceiptUrl = signedData.signedUrl;
              }
            }
          } catch (error) {
            console.error('Error generating signed URL:', error);
          }
        }

        // Create order in orders table with external_ref from pending order
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            created_by_school: pendingOrder.school_id,
            created_by_user: null, // Set to null since we don't have user_id in pending_orders
            external_ref: pendingOrder.order_id, // Use the generated order ID
            status: 'SUBMITTED',
            total_students: pendingOrder.total_students || 0,
            total_dark_garments: pendingOrder.total_dark_garments || 0,
            total_light_garments: pendingOrder.total_light_garments || 0,
            total_garments: (pendingOrder.total_dark_garments || 0) + (pendingOrder.total_light_garments || 0),
            total_amount: pendingOrder.total_amount || 0,
            session_data: pendingOrder.session_data || {},
            country: pendingOrder.country,
            region: pendingOrder.region,
            district: pendingOrder.district,
            payment_method: pendingOrder.payment_method,
            receipt_number: pendingOrder.receipt_number,
            receipt_image_url: signedReceiptUrl, // Use signed URL
            school_name: pendingOrder.school_name,
            headmaster_name: pendingOrder.headmaster_name,
            total_classes_to_serve: pendingOrder.session_data?.classes?.length || 0,
            submission_time: new Date().toISOString()
          })
          .select()
          .single();

        if (orderError) {
          console.error('Order creation error:', orderError);
          throw orderError;
        }

        // Insert classes and students from session_data
        if (pendingOrder.session_data?.classes && Array.isArray(pendingOrder.session_data.classes)) {
          for (const classData of pendingOrder.session_data.classes) {
            const { data: classRecord, error: classError } = await supabase
              .from('classes')
              .insert({
                school_id: pendingOrder.school_id,
                order_id: newOrder.id,
                session_id: newOrder.id,
                name: classData.className,
                total_students_to_serve_in_class: classData.students?.length || 0
              })
              .select()
              .single();

            if (classError) {
              console.error('Class creation error:', classError);
              throw classError;
            }

            // Insert students
            if (classData.students && Array.isArray(classData.students) && classData.students.length > 0) {
              const studentsToInsert = classData.students.map((student: any) => ({
                school_id: pendingOrder.school_id,
                class_id: classRecord.id,
                session_id: newOrder.id,
                full_name: student.fullName || student.studentName || 'Unknown',
                student_id: student.studentId || null,
                total_dark_garment_count: parseInt(student.darkGarments || student.darkCount || 0),
                total_light_garment_count: parseInt(student.lightGarments || student.lightCount || 0),
              }));

              const { error: studentsError } = await supabase
                .from('students')
                .insert(studentsToInsert);

              if (studentsError) {
                console.error('Students creation error:', studentsError);
                throw studentsError;
              }
            }
          }
        }

        // Delete from pending only after successful creation
        const { error: deleteError } = await supabase
          .from('pending_orders')
          .delete()
          .eq('id', orderId);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          throw deleteError;
        }

        // Send success notification to school user
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([{
            title: 'Order Approved',
            body: `Your order #${pendingOrder.order_id} has been approved and is now being processed.`,
            target_type: 'User',
            target_id: pendingOrder.school_id,
            level: 'INFO',
            channel: 'IN_APP',
            meta: {
              order_id: newOrder.id,
              external_ref: pendingOrder.order_id
            }
          }]);

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
        
        // Send chat message to school user
        if (schoolUserId) {
          await sendOrderApprovedMessage(
            schoolUserId,
            pendingOrder.school_name,
            newOrder.id,
            pendingOrder.order_id
          );
        }

        toast.success("Payment verified! Order has been approved and moved to active orders.");
      } else {
        // Get pending order details before deletion
        const { data: pendingOrder } = await supabase
          .from('pending_orders')
          .select('*')
          .eq('id', orderId)
          .single();

        // Just delete if rejected
        const { error: deleteError } = await supabase
          .from('pending_orders')
          .delete()
          .eq('id', orderId);

        if (deleteError) throw deleteError;

        // Send rejection notification to school user
        if (pendingOrder) {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert([{
              title: 'Order Rejected',
              body: `Your order #${pendingOrder.order_id} has been rejected. Please contact support for more details.`,
              target_type: 'User',
              target_id: pendingOrder.school_id,
              level: 'ERROR',
              channel: 'IN_APP',
              meta: {
                order_id: pendingOrder.order_id
              }
            }]);

          if (notificationError) {
            console.error('Error creating rejection notification:', notificationError);
          }
          
          // Send chat message to school user
          if (schoolUserId) {
            await sendOrderRejectedMessage(
              schoolUserId,
              pendingOrder.school_name,
              pendingOrder.order_id
            );
          }
        }

        toast.success("Payment rejected and order removed.");
      }

      fetchDashboardData();
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      toast.error(`Failed to process payment verification: ${error.message || 'Unknown error'}`);
    } finally {
      setVerifyingOrderId(null);
      setVerifyingAction(null);
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name?.toLowerCase().includes(searchSchool.toLowerCase()) ||
    school.district?.toLowerCase().includes(searchSchool.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      UNSUBMITTED: { variant: 'outline', label: 'Draft' },
      SUBMITTED: { variant: 'secondary', label: 'Submitted' },
      QUEUED: { variant: 'default', label: 'In Queue' },
      IN_PRODUCTION: { variant: 'default', label: 'Printing' },
      COMPLETED: { variant: 'default', label: 'Completed' }
    };
    
    const config = statusConfig[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name}</p>
            </div>
            <Button variant="outline" onClick={signOut}>Sign Out</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schools" className="relative">
              Schools
              {badgeCounts.newSchools > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 text-xs p-0 flex items-center justify-center">{badgeCounts.newSchools}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders" className="relative">
              Orders
              {badgeCounts.newOrders > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 text-xs p-0 flex items-center justify-center">{badgeCounts.newOrders}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="finances">Finances</TabsTrigger>
            <TabsTrigger value="demo-requests" className="relative">
              Demo Requests
              {badgeCounts.newDemoRequests > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 text-xs p-0 flex items-center justify-center">{badgeCounts.newDemoRequests}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="guest-messages" className="relative">
              Guest Messages
              {badgeCounts.newGuestMessages > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 text-xs p-0 flex items-center justify-center">{badgeCounts.newGuestMessages}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              Messages
              {badgeCounts.newMessages > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 text-xs p-0 flex items-center justify-center">{badgeCounts.newMessages}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                  <School className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSchools}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStaff}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0 MB</div>
                  <p className="text-xs text-muted-foreground">of 1 GB</p>
                </CardContent>
              </Card>
            </div>

            {/* Pending Payment Verifications */}
            {pendingOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Payment Verifications</CardTitle>
                  <CardDescription>Review and verify school payment submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_id}</TableCell>
                          <TableCell>{order.school_name}</TableCell>
                          <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                          <TableCell><Badge variant="outline">{order.payment_method}</Badge></TableCell>
                          <TableCell>
                            {order.receipt_number || '-'}
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
                                onClick={() => handleVerifyPayment(order.id, true)}
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
                                onClick={() => handleVerifyPayment(order.id, false)}
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
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Schools Tab */}
          <TabsContent value="schools" className="space-y-4">
            {/* School Type Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['primary', 'secondary', 'high', 'combined', 'college'].map(type => {
                const count = schools.filter(s => s.category?.toLowerCase() === type).length;
                return (
                  <Card key={type} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSchoolTypeFilter(schoolTypeFilter === type ? 'all' : type)}>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground capitalize">{type} Schools</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Input
                placeholder="Search schools..."
                value={searchSchool}
                onChange={(e) => setSearchSchool(e.target.value)}
                className="max-w-sm"
              />
              <Select value={schoolSort} onValueChange={(v: any) => setSchoolSort(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Alphabetical</SelectItem>
                  <SelectItem value="date">Date Registered</SelectItem>
                  <SelectItem value="type">School Type</SelectItem>
                </SelectContent>
              </Select>
              <Select value={schoolTypeFilter} onValueChange={setSchoolTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="high">High School</SelectItem>
                  <SelectItem value="combined">Combined</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Schools ({filteredSchools.filter(s => schoolTypeFilter === 'all' || s.category?.toLowerCase() === schoolTypeFilter).length})</CardTitle>
                <CardDescription>Manage registered schools</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>School Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Headmaster</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchools
                      .filter(s => schoolTypeFilter === 'all' || s.category?.toLowerCase() === schoolTypeFilter)
                      .sort((a, b) => {
                        if (schoolSort === 'name') return (a.name || '').localeCompare(b.name || '');
                        if (schoolSort === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                        if (schoolSort === 'type') return (a.category || '').localeCompare(b.category || '');
                        return 0;
                      })
                      .map((school, index) => (
                      <TableRow key={school.id}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{school.category || 'N/A'}</Badge></TableCell>
                        <TableCell>{school.headmaster_name}</TableCell>
                        <TableCell>{school.district}</TableCell>
                        <TableCell>{school.total_student_count}</TableCell>
                        <TableCell>{new Date(school.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={school.is_served ? 'default' : 'secondary'}>
                            {school.is_served ? 'Active' : 'Registered'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <OrdersTabContent 
              orders={orders} 
              getStatusBadge={getStatusBadge}
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-4">
            <StaffTabContent onRefresh={fetchDashboardData} />
          </TabsContent>

          {/* Finances Tab */}
          <TabsContent value="finances" className="space-y-4">
            <FinancesTab />
          </TabsContent>

          {/* Demo Requests Tab */}
          <TabsContent value="demo-requests" className="space-y-4">
            <DemoRequestsTab />
          </TabsContent>

          {/* Guest Messages Tab */}
          <TabsContent value="guest-messages" className="space-y-4">
            <GuestMessagesTab />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages & Conversations</CardTitle>
                <CardDescription>Communicate with school users and staff</CardDescription>
              </CardHeader>
              <CardContent>
                {user && (
                  <AdminChatPanel userId={user.id} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

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
