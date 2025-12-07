import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatTZS } from '@/utils/pricing';
import { sendOrderApprovedMessage, sendOrderRejectedMessage } from '@/utils/chatMessages';

interface PendingOrder {
  id: string;
  order_id: string;
  school_id: string;
  school_name: string;
  headmaster_name: string;
  total_amount: number;
  total_students: number;
  total_dark_garments: number;
  total_light_garments: number;
  payment_method: string;
  receipt_number: string | null;
  receipt_image_url: string | null;
  country: string;
  region: string;
  district: string;
  session_data: any;
  created_at: string;
}

export function OrderConfirmation() {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pending_orders')
        .select('*')
        .eq('payment_verified', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Generate signed URLs for receipt images
      const ordersWithSignedUrls = await Promise.all(
        (data || []).map(async (order) => {
          if (order.receipt_image_url) {
            try {
              const pathMatch = order.receipt_image_url.match(/receipts\/(.+)$/);
              if (pathMatch) {
                const { data: signedData } = await supabase.storage
                  .from('receipts')
                  .createSignedUrl(pathMatch[1], 31536000);
                if (signedData?.signedUrl) {
                  return { ...order, receipt_image_url: signedData.signedUrl };
                }
              }
            } catch (err) {
              console.error('Error generating signed URL:', err);
            }
          }
          return order;
        })
      );

      setPendingOrders(ordersWithSignedUrls);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      toast.error('Failed to load pending orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPayment = async (orderId: string, approve: boolean) => {
    setProcessingId(orderId);
    setProcessingAction(approve ? 'approve' : 'reject');

    try {
      const pendingOrder = pendingOrders.find(o => o.id === orderId);
      if (!pendingOrder) {
        toast.error('Order not found');
        return;
      }

      // Get school user_id for chat message
      const { data: schoolData } = await supabase
        .from('schools')
        .select('user_id')
        .eq('id', pendingOrder.school_id)
        .single();

      const schoolUserId = schoolData?.user_id;

      if (approve) {
        // Create order in orders table
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            created_by_school: pendingOrder.school_id,
            external_ref: pendingOrder.order_id,
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
            receipt_image_url: pendingOrder.receipt_image_url,
            school_name: pendingOrder.school_name,
            headmaster_name: pendingOrder.headmaster_name,
            total_classes_to_serve: pendingOrder.session_data?.classes?.length || 0,
            submission_time: new Date().toISOString()
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Insert classes and students
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

            if (classError) throw classError;

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

              if (studentsError) throw studentsError;
            }
          }
        }

        // Delete from pending
        await supabase.from('pending_orders').delete().eq('id', orderId);

        // Send chat message
        if (schoolUserId) {
          await sendOrderApprovedMessage(schoolUserId, pendingOrder.school_name, newOrder.id, pendingOrder.order_id);
        }

        toast.success('Order approved and moved to active orders');
      } else {
        // Reject - delete the pending order
        await supabase.from('pending_orders').delete().eq('id', orderId);

        if (schoolUserId) {
          await sendOrderRejectedMessage(schoolUserId, pendingOrder.school_name, pendingOrder.order_id);
        }

        toast.success('Order rejected and removed');
      }

      fetchPendingOrders();
    } catch (error: any) {
      console.error('Error processing order:', error);
      toast.error(`Failed to process order: ${error.message}`);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalValue = pendingOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const totalItems = pendingOrders.reduce((sum, order) => 
    sum + (order.total_dark_garments || 0) + (order.total_light_garments || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 group-hover:from-yellow-500/10 group-hover:to-orange-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pending Confirmation</CardTitle>
            <Clock className="h-6 w-6 text-yellow-500 group-hover:text-orange-500 transition-colors duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-yellow-500 mb-1">{pendingOrders.length}</div>
            <p className="text-sm text-muted-foreground">Orders awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-electric-blue/5 group-hover:from-primary/10 group-hover:to-electric-blue/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Value</CardTitle>
            <Package className="h-6 w-6 text-primary group-hover:text-electric-blue transition-colors duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-primary mb-1">{formatTZS(totalValue)}</div>
            <p className="text-sm text-muted-foreground">Pending order value</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 group-hover:from-emerald-500/10 group-hover:to-green-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Garments</CardTitle>
            <CheckCircle className="h-6 w-6 text-emerald-500 group-hover:text-green-500 transition-colors duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-emerald-500 mb-1">{totalItems}</div>
            <p className="text-sm text-muted-foreground">Items to produce</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Confirmation Table */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold gradient-text">Orders Pending Confirmation</CardTitle>
          <CardDescription>Review and confirm incoming orders before production</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
              <p className="text-lg font-medium">All caught up!</p>
              <p>No pending orders to confirm</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Garments</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-accent/50 transition-colors">
                    <TableCell className="font-medium">{order.order_id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.school_name}</p>
                        <p className="text-sm text-muted-foreground">{order.district}, {order.region}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-primary">{formatTZS(order.total_amount)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{order.total_students} students</p>
                        <p className="text-muted-foreground">
                          {order.total_dark_garments}D / {order.total_light_garments}L
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.payment_method}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Order Details - {order.order_id}</DialogTitle>
                              <DialogDescription>{order.school_name}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="font-medium">Dark Garments</p>
                                  <p className="text-muted-foreground">{order.total_dark_garments}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Light Garments</p>
                                  <p className="text-muted-foreground">{order.total_light_garments}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Total Students</p>
                                  <p className="text-muted-foreground">{order.total_students}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Total Amount</p>
                                  <p className="text-muted-foreground">{formatTZS(order.total_amount)}</p>
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-sm mb-1">Location</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.district}, {order.region}, {order.country}
                                </p>
                              </div>
                              {order.receipt_image_url && (
                                <div>
                                  <p className="font-medium text-sm mb-2">Receipt Image</p>
                                  <img 
                                    src={order.receipt_image_url} 
                                    alt="Receipt" 
                                    className="max-w-full h-auto rounded-lg border"
                                  />
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          size="sm" 
                          onClick={() => handleVerifyPayment(order.id, true)}
                          disabled={processingId !== null}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {processingId === order.id && processingAction === 'approve' ? (
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
                          disabled={processingId !== null}
                        >
                          {processingId === order.id && processingAction === 'reject' ? (
                            <>
                              <div className="h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Rejecting...
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
    </div>
  );
}
