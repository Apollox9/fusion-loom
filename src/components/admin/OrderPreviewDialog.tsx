import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Shirt, DollarSign, MapPin, User, Phone, Mail, Calendar } from 'lucide-react';
import { formatCurrency } from '@/utils/pricing';

interface OrderPreviewDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderPreviewDialog({ order, open, onOpenChange }: OrderPreviewDialogProps) {
  const sessionData = order.session_data;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Order Details - {order.order_id}</DialogTitle>
          <DialogDescription>Complete information about this order submission</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* School Information */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg mb-3">School Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm"><strong>School:</strong> {order.school_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm"><strong>Headmaster:</strong> {order.headmaster_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm"><strong>Location:</strong> {order.district}, {order.region}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm"><strong>Submitted:</strong> {new Date(order.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Students</span>
                </div>
                <span className="text-2xl font-bold">{order.total_students}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Shirt className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-muted-foreground">Dark Garments</span>
                </div>
                <span className="text-2xl font-bold">{order.total_dark_garments}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Shirt className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-muted-foreground">Light Garments</span>
                </div>
                <span className="text-2xl font-bold">{order.total_light_garments}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                </div>
                <span className="text-2xl font-bold text-primary">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3">Payment Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Payment Method:</span>
                <Badge className="ml-2" variant="outline">{order.payment_method}</Badge>
              </div>
              {order.receipt_number && (
                <div>
                  <span className="text-sm text-muted-foreground">Receipt Number:</span>
                  <span className="ml-2 font-mono">{order.receipt_number}</span>
                </div>
              )}
              {order.receipt_image_url && (
                <div className="md:col-span-2">
                  <a 
                    href={order.receipt_image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    View Receipt Image →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Classes Breakdown */}
          {sessionData?.classes && sessionData.classes.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Classes Breakdown</h3>
              <div className="space-y-4">
                {sessionData.classes.map((classData: any, idx: number) => (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2">
                      <h4 className="font-medium">{classData.className} ({classData.students?.length || 0} students)</h4>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead className="text-right">Dark Garments</TableHead>
                          <TableHead className="text-right">Light Garments</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classData.students?.slice(0, 5).map((student: any, sIdx: number) => (
                          <TableRow key={sIdx}>
                            <TableCell>{student.fullName || student.studentName}</TableCell>
                            <TableCell className="text-right">{student.darkGarments || student.darkCount || 0}</TableCell>
                            <TableCell className="text-right">{student.lightGarments || student.lightCount || 0}</TableCell>
                            <TableCell className="text-right font-medium">
                              {(student.darkGarments || student.darkCount || 0) + (student.lightGarments || student.lightCount || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {classData.students?.length > 5 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">
                              ... and {classData.students.length - 5} more students
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
