import { useState } from 'react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye,
  MessageSquare
} from 'lucide-react';

export function OrderConfirmation() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [confirmationNotes, setConfirmationNotes] = useState('');
  const { toast } = useToast();

  // Mock pending orders data
  const pendingOrders = [
    {
      id: 'ORD-1004',
      schoolName: 'Kilimanjaro Secondary School',
      totalAmount: 1850.00,
      itemCount: 45,
      submittedAt: '2024-01-20T10:30:00Z',
      estimatedDelivery: '2024-01-25',
      status: 'pending_confirmation',
      urgency: 'normal',
      details: {
        darkGarments: 25,
        lightGarments: 20,
        specialInstructions: 'School logo on all items'
      }
    },
    {
      id: 'ORD-1005',
      schoolName: 'Mbeya High School',
      totalAmount: 2300.00,
      itemCount: 60,
      submittedAt: '2024-01-20T14:15:00Z',
      estimatedDelivery: '2024-01-26',
      status: 'pending_confirmation',
      urgency: 'high',
      details: {
        darkGarments: 40,
        lightGarments: 20,
        specialInstructions: 'Rush order for graduation ceremony'
      }
    },
    {
      id: 'ORD-1006',
      schoolName: 'Dodoma Primary School',
      totalAmount: 950.00,
      itemCount: 28,
      submittedAt: '2024-01-21T09:00:00Z',
      estimatedDelivery: '2024-01-24',
      status: 'pending_confirmation',
      urgency: 'normal',
      details: {
        darkGarments: 15,
        lightGarments: 13,
        specialInstructions: 'Size chart provided separately'
      }
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'normal':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <AlertCircle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const handleConfirmOrder = (orderId: string) => {
    toast({
      title: "Order Confirmed",
      description: `Order ${orderId} has been confirmed and moved to production queue.`,
    });
    
    // In a real app, this would update the backend
    console.log(`Confirming order ${orderId} with notes:`, confirmationNotes);
    setConfirmationNotes('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
            <div className="text-3xl font-bold text-primary mb-1">
              ${pendingOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Pending order value</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 group-hover:from-emerald-500/10 group-hover:to-green-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Items Count</CardTitle>
            <CheckCircle className="h-6 w-6 text-emerald-500 group-hover:text-green-500 transition-colors duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-emerald-500 mb-1">
              {pendingOrders.reduce((sum, order) => sum + order.itemCount, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total items to produce</p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.schoolName}</p>
                      <p className="text-sm text-muted-foreground">
                        Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-primary">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{order.itemCount} total</p>
                      <p className="text-muted-foreground">
                        {order.details.darkGarments}D / {order.details.lightGarments}L
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getUrgencyColor(order.urgency)}>
                      <span className="flex items-center gap-1">
                        {getUrgencyIcon(order.urgency)}
                        {order.urgency}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(order.submittedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Order Details - {order.id}</DialogTitle>
                            <DialogDescription>
                              {order.schoolName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium">Dark Garments</p>
                                <p className="text-muted-foreground">{order.details.darkGarments}</p>
                              </div>
                              <div>
                                <p className="font-medium">Light Garments</p>
                                <p className="text-muted-foreground">{order.details.lightGarments}</p>
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-sm mb-1">Special Instructions</p>
                              <p className="text-sm text-muted-foreground bg-accent/20 p-2 rounded">
                                {order.details.specialInstructions}
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="bg-gradient-hero text-white shadow-primary hover:shadow-electric transition-all duration-300"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Order Receipt</DialogTitle>
                            <DialogDescription>
                              Confirm that you have received and reviewed order {order.id} from {order.schoolName}.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-accent/20 rounded-lg">
                              <h4 className="font-medium mb-2">Order Summary</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <span>Total Amount:</span>
                                <span className="font-bold">${order.totalAmount.toFixed(2)}</span>
                                <span>Total Items:</span>
                                <span className="font-bold">{order.itemCount}</span>
                                <span>Estimated Delivery:</span>
                                <span className="font-bold">{new Date(order.estimatedDelivery).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Confirmation Notes (Optional)
                              </label>
                              <Textarea
                                placeholder="Add any notes about this order confirmation..."
                                value={confirmationNotes}
                                onChange={(e) => setConfirmationNotes(e.target.value)}
                                className="min-h-[80px]"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={() => handleConfirmOrder(order.id)}
                              className="bg-gradient-hero text-white shadow-primary hover:shadow-electric transition-all duration-300"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirm Order Received
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}