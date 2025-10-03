import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Receipt, 
  Upload, 
  Users, 
  Shirt, 
  CreditCard,
  FileImage,
  Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { calculateStudentPrice, calculateSessionTotal } from '@/utils/pricing';

interface PaymentSubmissionProps {
  sessionData: {
    schoolName: string;
    schoolId?: string;
    classes: Array<{
      className: string;
      students: Array<{
        studentName: string;
        darkCount: number;
        lightCount: number;
        isPaid: boolean;
      }>;
    }>;
    totals: {
      totalStudents: number;
      totalDarkGarments: number;
      totalLightGarments: number;
    };
  };
  onSubmit: () => void;
  onCancel: () => void;
}

export function PaymentSubmission({ sessionData, onSubmit, onCancel }: PaymentSubmissionProps) {
  const [paymentMethod, setPaymentMethod] = useState<'receipt_number' | 'receipt_upload'>('receipt_number');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuthContext();

  // Calculate total cost using the pricing utility
  const studentsWithPricing = sessionData.classes.flatMap(cls => 
    cls.students.map(student => ({
      ...student,
      totalGarments: student.darkCount + student.lightCount,
      price: calculateStudentPrice(student.darkCount + student.lightCount)
    }))
  );
  
  const totalAmount = studentsWithPricing.reduce((sum, student) => sum + student.price, 0);
  const totalGarments = sessionData.totals.totalDarkGarments + sessionData.totals.totalLightGarments;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setReceiptFile(file);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file (JPEG, PNG, etc.)',
          variant: 'destructive'
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentMethod === 'receipt_number' && !receiptNumber.trim()) {
      toast({
        title: 'Receipt number required',
        description: 'Please enter a receipt number',
        variant: 'destructive'
      });
      return;
    }
    
    if (paymentMethod === 'receipt_upload' && !receiptFile) {
      toast({
        title: 'Receipt file required',
        description: 'Please upload a receipt image',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get school data
      const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!schoolData && !profile) {
        throw new Error('School or profile data not found');
      }

      // Generate unique order ID
      const orderId = `ORD-${Date.now()}`;

      // Insert into pending_orders
      const { data: pendingOrder, error: pendingError } = await supabase
        .from('pending_orders')
        .insert({
          order_id: orderId,
          school_id: schoolData?.id || user?.id,
          school_name: sessionData.schoolName || schoolData?.name || profile?.full_name,
          headmaster_name: schoolData?.headmaster_name || profile?.full_name,
          country: schoolData?.country || profile?.country || 'Tanzania',
          region: schoolData?.region || profile?.region || '',
          district: schoolData?.district || profile?.district || '',
          total_students: sessionData.totals.totalStudents,
          total_dark_garments: sessionData.totals.totalDarkGarments,
          total_light_garments: sessionData.totals.totalLightGarments,
          total_amount: totalAmount,
          payment_method: paymentMethod === 'receipt_number' ? 'Receipt Number' : 'Receipt Upload',
          receipt_number: paymentMethod === 'receipt_number' ? receiptNumber : null,
          receipt_image_url: null, // TODO: Upload file to storage if needed
          session_data: sessionData,
          payment_verified: false
        })
        .select()
        .single();

      if (pendingError) throw pendingError;

      // Insert classes and students
      for (const classData of sessionData.classes) {
        const { data: classRecord, error: classError } = await supabase
          .from('classes')
          .insert({
            school_id: schoolData?.id || user?.id,
            name: classData.className,
            total_students_served_in_class: classData.students.length
          })
          .select()
          .single();

        if (classError) throw classError;

        // Insert students for this class
        const studentsToInsert = classData.students.map(student => ({
          school_id: schoolData?.id || user?.id,
          class_id: classRecord.id,
          full_name: student.studentName,
          total_dark_garment_count: student.darkCount,
          total_light_garment_count: student.lightCount,
          is_served: false
        }));

        const { error: studentsError } = await supabase
          .from('students')
          .insert(studentsToInsert);

        if (studentsError) throw studentsError;
      }

      toast({
        title: 'Order Submitted Successfully',
        description: `Order ${orderId} is pending admin verification`
      });

      setIsSubmitting(false);
      onSubmit();
    } catch (error: any) {
      console.error('Error submitting order:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit order',
        variant: 'destructive'
      });
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <Card className="w-96 bg-card/80 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <CreditCard className="w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-xl font-semibold mt-6 mb-2">Submitting Session</h3>
            <p className="text-muted-foreground text-center">
              Processing your payment proof and submitting session...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="mb-4"
          >
            ← Back to Preview
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Submit Session
          </h1>
          <p className="text-muted-foreground mt-2">
            Provide payment proof to submit your printing session
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Session Summary */}
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Session Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-lg mb-4">{sessionData.schoolName}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Total Students</span>
                    </div>
                    <span className="font-medium">{sessionData.totals.totalStudents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shirt className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">Dark Garments</span>
                    </div>
                    <span className="font-medium">{sessionData.totals.totalDarkGarments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shirt className="w-4 h-4 text-gray-300" />
                      <span className="text-sm">Light Garments</span>
                    </div>
                    <span className="font-medium">{sessionData.totals.totalLightGarments}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total Garments</span>
                      <span>{totalGarments}</span>
                    </div>
                    <div className="flex items-center justify-between text-xl font-bold text-primary mt-2">
                      <span>Total Amount</span>
                      <span>TZS {totalAmount.toLocaleString('en-US')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Proof Form */}
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Proof
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Proof of Payment Method</Label>
                  <RadioGroup 
                    value={paymentMethod} 
                    onValueChange={(value: 'receipt_number' | 'receipt_upload') => setPaymentMethod(value)}
                    className="mt-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="receipt_number" id="receipt_number" />
                      <Label htmlFor="receipt_number" className="flex items-center gap-2 cursor-pointer">
                        <Hash className="w-4 h-4" />
                        Receipt Number
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="receipt_upload" id="receipt_upload" />
                      <Label htmlFor="receipt_upload" className="flex items-center gap-2 cursor-pointer">
                        <FileImage className="w-4 h-4" />
                        Upload Receipt Image
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {paymentMethod === 'receipt_number' ? (
                  <div>
                    <Label htmlFor="receipt_number_input">Receipt Number</Label>
                    <Input
                      id="receipt_number_input"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      placeholder="Enter your receipt number"
                      className="mt-2"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="receipt_file">Receipt Image</Label>
                    <div className="mt-2">
                      <Input
                        id="receipt_file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div 
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => document.getElementById('receipt_file')?.click()}
                      >
                        {receiptFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <FileImage className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm font-medium">{receiptFile.name}</span>
                          </div>
                        ) : (
                          <div>
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload receipt image
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information about the payment..."
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90"
                  >
                    Confirm & Submit
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}