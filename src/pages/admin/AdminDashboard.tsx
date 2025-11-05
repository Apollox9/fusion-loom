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

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  
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

  // State for orders
  const [orders, setOrders] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [previewOrder, setPreviewOrder] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // State for staff
  const [staff, setStaff] = useState<any[]>([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
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

  useEffect(() => {
    if (profile?.role === 'ADMIN') {
      fetchDashboardData();
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

      // Fetch orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      setOrders(ordersData || []);

      // Fetch pending orders
      const { data: pendingData } = await supabase
        .from('pending_orders')
        .select('*')
        .eq('payment_verified', false)
        .order('created_at', { ascending: false });
      setPendingOrders(pendingData || []);

      // Fetch staff
      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });
      setStaff(staffData || []);

      // Calculate stats
      const revenue = ordersData?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
      const pending = ordersData?.filter(o => o.status === 'SUBMITTED' || o.status === 'QUEUED').length || 0;

      setStats({
        totalSchools: schoolsData?.length || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue: revenue,
        pendingOrders: pending,
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
    try {
      if (approve) {
        // Move from pending to actual orders
        const pendingOrder = pendingOrders.find(o => o.id === orderId);
        if (!pendingOrder) return;

        // Create order in orders table
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            created_by_school: pendingOrder.school_id,
            created_by_user: pendingOrder.school_id,
            status: 'SUBMITTED',
            total_students: pendingOrder.total_students,
            total_dark_garments: pendingOrder.total_dark_garments,
            total_light_garments: pendingOrder.total_light_garments,
            total_amount: pendingOrder.total_amount,
            session_data: pendingOrder.session_data,
            country: pendingOrder.country,
            region: pendingOrder.region,
            district: pendingOrder.district,
            payment_method: pendingOrder.payment_method,
            receipt_number: pendingOrder.receipt_number,
            receipt_image_url: pendingOrder.receipt_image_url,
            school_name: pendingOrder.school_name,
            headmaster_name: pendingOrder.headmaster_name,
            total_classes_to_serve: pendingOrder.session_data?.classes?.length || 0,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Insert classes and students from session_data
        if (pendingOrder.session_data?.classes) {
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

            if (classError) throw classError;

            // Insert students
            if (classData.students && classData.students.length > 0) {
              const studentsToInsert = classData.students.map((student: any) => ({
                school_id: pendingOrder.school_id,
                class_id: classRecord.id,
                full_name: student.fullName || student.studentName,
                student_id: student.studentId || null,
                total_dark_garment_count: student.darkGarments || student.darkCount || 0,
                total_light_garment_count: student.lightGarments || student.lightCount || 0,
              }));

              const { error: studentsError } = await supabase
                .from('students')
                .insert(studentsToInsert);

              if (studentsError) throw studentsError;
            }
          }
        }

        // Delete from pending
        await supabase.from('pending_orders').delete().eq('id', orderId);
      } else {
        // Just delete if rejected
        await supabase.from('pending_orders').delete().eq('id', orderId);
      }

      if (approve) {
        toast.success("Payment verified! Order has been approved and moved to active orders.");
      } else {
        toast.success("Payment rejected and order removed.");
      }

      fetchDashboardData();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error("Failed to process payment verification");
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
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schools">Schools</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="finances">Finances</TabsTrigger>
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
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              <Button size="sm" onClick={() => handleVerifyPayment(order.id, true)}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleVerifyPayment(order.id, false)}>
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
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
            <div className="flex items-center justify-between">
              <Input
                placeholder="Search schools..."
                value={searchSchool}
                onChange={(e) => setSearchSchool(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Schools</CardTitle>
                <CardDescription>Manage registered schools</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Name</TableHead>
                      <TableHead>Headmaster</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell>{school.headmaster_name}</TableCell>
                        <TableCell>{school.district}</TableCell>
                        <TableCell>{school.total_student_count}</TableCell>
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
            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>View and manage all school orders</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.external_ref || order.id.slice(0, 8)}</TableCell>
                        <TableCell>{order.school_name}</TableCell>
                        <TableCell>{order.total_garments}</TableCell>
                        <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showAddStaff} onOpenChange={setShowAddStaff}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                    <DialogDescription>Create a new staff account with specified role</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        value={newStaff.fullName}
                        onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newStaff.email}
                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        value={newStaff.phoneNumber}
                        onChange={(e) => setNewStaff({ ...newStaff, phoneNumber: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Select value={newStaff.role} onValueChange={(value: any) => setNewStaff({ ...newStaff, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPERATOR">Operator</SelectItem>
                          <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                          <SelectItem value="AUDITOR">Auditor</SelectItem>
                          <SelectItem value="AGENT">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Agent-specific fields */}
                    {newStaff.role === 'AGENT' && (
                      <>
                        <div>
                          <Label>Business Name</Label>
                          <Input
                            value={newStaff.businessName || ''}
                            onChange={(e) => setNewStaff({ ...newStaff, businessName: e.target.value })}
                            placeholder="Enter business name"
                          />
                        </div>
                        <div>
                          <Label>Country</Label>
                          <Input
                            value={newStaff.country || ''}
                            onChange={(e) => setNewStaff({ ...newStaff, country: e.target.value })}
                            placeholder="Enter country"
                          />
                        </div>
                        <div>
                          <Label>Region</Label>
                          <Input
                            value={newStaff.region || ''}
                            onChange={(e) => setNewStaff({ ...newStaff, region: e.target.value })}
                            placeholder="Enter region"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddStaff(false)}>Cancel</Button>
                    <Button onClick={handleCreateStaff} disabled={isCreatingStaff}>
                      {isCreatingStaff ? 'Creating...' : 'Create Staff'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Staff Members</CardTitle>
                <CardDescription>Manage operators, supervisors, and auditors</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.staff_id}</TableCell>
                        <TableCell>{member.full_name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell><Badge>{member.role}</Badge></TableCell>
                        <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finances Tab */}
          <TabsContent value="finances" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                  <p className="text-sm text-muted-foreground mt-2">All time earnings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(0)}</div>
                  <p className="text-sm text-muted-foreground mt-2">Current month revenue</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pending Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{pendingOrders.length}</div>
                  <p className="text-sm text-muted-foreground mt-2">Awaiting verification</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest payment activities</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.slice(0, 10).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{order.school_name}</TableCell>
                        <TableCell className="font-medium">{order.external_ref || order.id.slice(0, 8)}</TableCell>
                        <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
