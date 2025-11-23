import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Edit, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuthContext } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    account_number: '',
    account_name: '',
    is_active: true 
  });
  const { toast } = useToast();
  const { profile, loading } = useAuthContext();

  // Only allow admins to access this page
  if (!loading && profile?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch payment methods',
        variant: 'destructive'
      });
    } else {
      setPaymentMethods(data || []);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Payment method name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update({
            name: formData.name,
            description: formData.description || null,
            account_number: formData.account_number || null,
            account_name: formData.account_name || null,
            is_active: formData.is_active
          })
          .eq('id', editingMethod.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Payment method updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert({
            name: formData.name,
            description: formData.description || null,
            account_number: formData.account_number || null,
            account_name: formData.account_name || null,
            is_active: formData.is_active
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Payment method added successfully'
        });
      }

      setIsDialogOpen(false);
      setEditingMethod(null);
      setFormData({ name: '', description: '', account_number: '', account_name: '', is_active: true });
      fetchPaymentMethods();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save payment method',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (method: any) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      description: method.description || '',
      account_number: method.account_number || '',
      account_name: method.account_name || '',
      is_active: method.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete payment method',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Payment method deleted successfully'
      });
      fetchPaymentMethods();
    }
  };

  const toggleActive = async (method: PaymentMethod) => {
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_active: !method.is_active })
      .eq('id', method.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update payment method status',
        variant: 'destructive'
      });
    } else {
      fetchPaymentMethods();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 pt-24">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Payment Methods</h1>
            <p className="text-muted-foreground mt-1">Manage available payment methods for schools</p>
          </div>
          <Button onClick={() => {
            setEditingMethod(null);
            setFormData({ name: '', description: '', account_number: '', account_name: '', is_active: true });
            setIsDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {method.name}
                  </div>
                  <Switch
                    checked={method.is_active}
                    onCheckedChange={() => toggleActive(method)}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {method.description && (
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  )}
                  {(method as any).account_name && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Account Name: </span>
                      <span className="font-medium">{(method as any).account_name}</span>
                    </div>
                  )}
                  {(method as any).account_number && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Account Number: </span>
                      <span className="font-mono font-medium">{(method as any).account_number}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(method)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(method.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., M-Pesa, Bank Transfer"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="e.g., Company Name"
                />
              </div>
              <div>
                <Label htmlFor="account_number">Account/Phone Number</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="e.g., +255 123 456 789 or Bank Account Number"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingMethod ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
