import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
  account_name: string | null;
  account_number: string | null;
  logo_url: string | null;
  is_active: boolean;
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (!error) {
      setPaymentMethods(data || []);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/contact" className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Contact</span>
            </Link>
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-primary" />
              <h1 className="text-lg font-bold font-display">Payment Methods</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-6 leading-tight">
              <span className="text-gradient">Payment Methods</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              View all available payment options for Project Fusion services. 
              Choose the method that works best for your school.
            </p>
          </div>
        </div>
      </section>

      {/* Payment Methods List */}
      <section className="pb-16 px-6">
        <div className="container mx-auto max-w-4xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Payment Methods Available</h3>
              <p className="text-muted-foreground">
                Please contact us for payment information.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-4">
                      {method.logo_url ? (
                        <img 
                          src={method.logo_url} 
                          alt={method.name}
                          className="w-16 h-16 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-8 h-8 text-primary" />
                        </div>
                      )}
                      <span className="text-2xl">{method.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {method.description && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                            {method.description}
                          </p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {method.account_name && (
                          <div className="bg-background border border-border rounded-lg p-4">
                            <p className="text-sm text-muted-foreground mb-1">Account Name</p>
                            <p className="font-semibold text-lg">{method.account_name}</p>
                          </div>
                        )}
                        {method.account_number && (
                          <div className="bg-background border border-border rounded-lg p-4">
                            <p className="text-sm text-muted-foreground mb-1">Account/Phone Number</p>
                            <p className="font-mono font-semibold text-lg">{method.account_number}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-8 px-6 border-t border-border">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-muted-foreground">
            Need help with payment? <Link to="/contact" className="text-primary hover:underline">Contact us</Link> for assistance.
          </p>
        </div>
      </section>
    </div>
  );
}