import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Edit, CreditCard, Upload, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
  account_name: string | null;
  account_number: string | null;
  logo_url: string | null;
  is_active: boolean;
}

export function PaymentMethodsManagement() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    account_number: '',
    account_name: '',
    logo_url: '',
    is_active: true 
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    setIsLoading(true);
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
    setIsLoading(false);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-method-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('payment-method-logos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      
      toast({
        title: 'Logo uploaded',
        description: 'Logo uploaded successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload logo',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
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

    setIsLoading(true);
    
    try {
      if (editingMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update({
            name: formData.name,
            description: formData.description || null,
            account_number: formData.account_number || null,
            account_name: formData.account_name || null,
            logo_url: formData.logo_url || null,
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
            logo_url: formData.logo_url || null,
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
      setFormData({ name: '', description: '', account_number: '', account_name: '', logo_url: '', is_active: true });
      fetchPaymentMethods();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save payment method',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      description: method.description || '',
      account_number: method.account_number || '',
      account_name: method.account_name || '',
      logo_url: method.logo_url || '',
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

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo_url: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payment Methods</h2>
          <p className="text-muted-foreground">Manage available payment methods for schools</p>
        </div>
        <Button onClick={() => {
          setEditingMethod(null);
          setFormData({ name: '', description: '', account_number: '', account_name: '', logo_url: '', is_active: true });
          setIsDialogOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {isLoading && paymentMethods.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paymentMethods.map((method) => (
            <Card key={method.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {method.logo_url ? (
                      <img 
                        src={method.logo_url} 
                        alt={method.name}
                        className="w-10 h-10 rounded-md object-cover border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-lg">{method.name}</span>
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
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{method.description}</p>
                  )}
                  {method.account_name && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Account Name: </span>
                      <span className="font-medium">{method.account_name}</span>
                    </div>
                  )}
                  {method.account_number && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Account Number: </span>
                      <span className="font-mono font-medium">{method.account_number}</span>
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
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Logo Upload */}
            <div>
              <Label>Logo (Square Image)</Label>
              <div className="mt-2">
                {formData.logo_url ? (
                  <div className="relative inline-block">
                    <img 
                      src={formData.logo_url} 
                      alt="Logo preview"
                      className="w-24 h-24 rounded-lg object-cover border border-border"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  >
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Upload</span>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name">Name *</Label>
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
                placeholder="Description (press Enter for new line)"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">Press Enter to add new lines</p>
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
                placeholder="e.g., +255 123 456 789"
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
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingMethod ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}