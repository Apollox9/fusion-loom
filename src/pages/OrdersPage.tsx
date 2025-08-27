import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Package, Clock, CheckCircle, Truck, User, Building } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Order {
  id: string;
  external_ref: string;
  status: string;
  total_garments: number;
  submission_time: string;
  queued_at: string;
  confirm_received_at: string;
  auto_confirmed_at: string;
  created_at: string;
  created_by_user: string;
  created_by_school: string;
  assigned_operator_id: string;
  assigned_facility_id: string;
  pickup: any;
  printing: any;
  packaging: any;
  delivery: any;
  audit_trail: any;
}

interface OrderItem {
  id: string;
  order_id: string;
  student_id: string;
  student_name_cached: string;
  status: string;
  dark_count: number;
  light_count: number;
  printed_dark: number;
  printed_light: number;
  created_at: string;
}

const statusColors = {
  UNSUBMITTED: "secondary",
  SUBMITTED: "default",
  QUEUED: "outline",
  IN_PROGRESS: "default",
  COMPLETED: "default",
  DELIVERED: "default"
} as const;

const statusIcons = {
  UNSUBMITTED: Clock,
  SUBMITTED: Package,
  QUEUED: Clock,
  IN_PROGRESS: Package,
  COMPLETED: CheckCircle,
  DELIVERED: Truck
};

export default function OrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch order items',
        variant: 'destructive'
      });
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      // This would typically be done through an API/edge function
      // For now, just show a toast
      toast({
        title: 'Status Update',
        description: `Order status would be updated to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderItems(order.id);
    setIsDetailsOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.external_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    return {
      total: orders.length,
      unsubmitted: orders.filter(o => o.status === 'UNSUBMITTED').length,
      submitted: orders.filter(o => o.status === 'SUBMITTED').length,
      queued: orders.filter(o => o.status === 'QUEUED').length,
      in_progress: orders.filter(o => o.status === 'IN_PROGRESS').length,
      completed: orders.filter(o => o.status === 'COMPLETED').length,
      delivered: orders.filter(o => o.status === 'DELIVERED').length
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders Management</h1>
          <p className="text-muted-foreground">Track and manage printing orders</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{statusCounts.total}</div>
            <div className="text-sm text-muted-foreground">Total Orders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.unsubmitted}</div>
            <div className="text-sm text-muted-foreground">Unsubmitted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.submitted}</div>
            <div className="text-sm text-muted-foreground">Submitted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{statusCounts.queued}</div>
            <div className="text-sm text-muted-foreground">Queued</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{statusCounts.in_progress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{statusCounts.delivered}</div>
            <div className="text-sm text-muted-foreground">Delivered</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search by order ID or reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="UNSUBMITTED">Unsubmitted</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="QUEUED">Queued</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredOrders.map((order) => {
          const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || Package;
          return (
            <Card key={order.id} className="transition-shadow hover:shadow-md cursor-pointer" onClick={() => openOrderDetails(order)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <StatusIcon className="h-5 w-5" />
                      Order {order.external_ref || order.id.slice(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      Created: {new Date(order.created_at).toLocaleDateString()} • 
                      {order.submission_time && ` Submitted: ${new Date(order.submission_time).toLocaleDateString()}`}
                    </CardDescription>
                  </div>
                  <Badge variant={statusColors[order.status as keyof typeof statusColors]}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      Garments
                    </div>
                    <div className="text-sm font-medium">
                      {order.total_garments} total
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      Facility
                    </div>
                    <div className="text-sm">
                      {order.assigned_facility_id || 'Not assigned'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Operator
                    </div>
                    <div className="text-sm">
                      {order.assigned_operator_id ? order.assigned_operator_id.slice(0, 8) : 'Not assigned'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder?.external_ref || selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant={statusColors[selectedOrder.status as keyof typeof statusColors]}>
                          {selectedOrder.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Garments:</span>
                        <span className="text-sm font-medium">{selectedOrder.total_garments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Created:</span>
                        <span className="text-sm">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                      </div>
                      {selectedOrder.submission_time && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Submitted:</span>
                          <span className="text-sm">{new Date(selectedOrder.submission_time).toLocaleString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Assignment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Facility:</span>
                        <span className="text-sm">{selectedOrder.assigned_facility_id || 'Not assigned'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Operator:</span>
                        <span className="text-sm">{selectedOrder.assigned_operator_id || 'Not assigned'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="items" className="space-y-4">
                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{item.student_name_cached}</div>
                            <div className="text-sm text-muted-foreground">
                              Dark: {item.printed_dark}/{item.dark_count} • 
                              Light: {item.printed_light}/{item.light_count}
                            </div>
                          </div>
                          <Badge variant={item.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="timeline" className="space-y-4">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">Timeline information would be displayed here based on audit trail</div>
                </div>
              </TabsContent>
              
              <TabsContent value="actions" className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => handleStatusUpdate(selectedOrder.id, 'QUEUED')}>
                    Queue Order
                  </Button>
                  <Button variant="outline" onClick={() => handleStatusUpdate(selectedOrder.id, 'IN_PROGRESS')}>
                    Start Processing
                  </Button>
                  <Button variant="outline" onClick={() => handleStatusUpdate(selectedOrder.id, 'COMPLETED')}>
                    Mark Complete
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' ? 'No orders match your filters.' : 'No orders have been created yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}