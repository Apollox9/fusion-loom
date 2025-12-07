import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionsList } from './TransactionsList';
import { CashflowChart } from './CashflowChart';
import { OrderConfirmation } from './OrderConfirmation';
import { PaymentMethodsManagement } from './PaymentMethodsManagement';
import { supabase } from '@/integrations/supabase/client';
import { formatTZS } from '@/utils/pricing';
import { 
  TrendingUp, 
  Receipt, 
  CheckCircle,
  CreditCard,
  Clock,
  Banknote
} from 'lucide-react';

export function FinancesTab() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingTransactions: 0,
    confirmedOrders: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFinancialStats();
  }, []);

  const fetchFinancialStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all orders for total revenue
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at, status');
      
      const totalRevenue = (orders || []).reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      
      // Calculate this month's revenue
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyOrders = (orders || []).filter(o => new Date(o.created_at) >= startOfMonth);
      const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      
      // Confirmed orders this month
      const confirmedOrders = monthlyOrders.filter(o => 
        ['CONFIRMED', 'AUTO_CONFIRMED', 'COMPLETED', 'DONE'].includes(o.status)
      ).length;
      
      // Fetch pending orders count
      const { count: pendingCount } = await supabase
        .from('pending_orders')
        .select('*', { count: 'exact', head: true })
        .eq('payment_verified', false);

      setStats({
        totalRevenue,
        monthlyRevenue,
        pendingTransactions: pendingCount || 0,
        confirmedOrders
      });
    } catch (error) {
      console.error('Error fetching financial stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate growth (comparing to a baseline or previous period)
  const growthPercentage = stats.totalRevenue > 0 && stats.monthlyRevenue > 0 
    ? ((stats.monthlyRevenue / stats.totalRevenue) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-8">
      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-electric-blue/5 group-hover:from-primary/10 group-hover:to-electric-blue/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Revenue</CardTitle>
            <Banknote className="h-6 w-6 text-primary group-hover:text-electric-blue transition-colors duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-primary mb-1">
              {isLoading ? '...' : formatTZS(stats.totalRevenue)}
            </div>
            <p className="text-sm text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 group-hover:from-emerald-500/10 group-hover:to-green-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">This Month</CardTitle>
            <TrendingUp className="h-6 w-6 text-emerald-500 group-hover:text-green-500 transition-colors duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-emerald-500 mb-1">
              {isLoading ? '...' : formatTZS(stats.monthlyRevenue)}
            </div>
            <p className="text-sm text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
              {growthPercentage}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 group-hover:from-yellow-500/10 group-hover:to-orange-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pending Orders</CardTitle>
            <Clock className="h-6 w-6 text-yellow-500 group-hover:text-orange-500 transition-colors duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-yellow-500 mb-1">
              {isLoading ? '...' : stats.pendingTransactions}
            </div>
            <p className="text-sm text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-accent/5 to-neon-purple/5 group-hover:from-neon-accent/10 group-hover:to-neon-purple/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Confirmed Orders</CardTitle>
            <CheckCircle className="h-6 w-6 text-neon-accent group-hover:text-neon-purple transition-colors duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-neon-accent mb-1">
              {isLoading ? '...' : stats.confirmedOrders}
            </div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Finance Tabs */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Cash Flow
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Order Confirmation
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <TransactionsList />
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <CashflowChart />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <OrderConfirmation />
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-6">
          <PaymentMethodsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
