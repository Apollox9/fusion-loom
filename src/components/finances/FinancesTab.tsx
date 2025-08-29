import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionsList } from './TransactionsList';
import { CashflowChart } from './CashflowChart';
import { OrderConfirmation } from './OrderConfirmation';
import { 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  CheckCircle
} from 'lucide-react';

export function FinancesTab() {
  // Mock data - will be replaced with real data
  const financialStats = {
    totalRevenue: 45250,
    monthlyGrowth: 12.5,
    pendingTransactions: 8,
    confirmedOrders: 23
  };

  return (
    <div className="space-y-8">
      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-electric-blue/5 group-hover:from-primary/10 group-hover:to-electric-blue/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-6 w-6 text-primary group-hover:text-electric-blue transition-colors duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-primary mb-1">${financialStats.totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
              +{financialStats.monthlyGrowth}% this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-neon-accent/5 group-hover:from-electric-blue/10 group-hover:to-neon-accent/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pending Transactions</CardTitle>
            <Receipt className="h-6 w-6 text-electric-blue group-hover:text-neon-accent transition-colors duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-electric-blue mb-1">{financialStats.pendingTransactions}</div>
            <p className="text-sm text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-accent/5 to-neon-purple/5 group-hover:from-neon-accent/10 group-hover:to-neon-purple/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Confirmed Orders</CardTitle>
            <CheckCircle className="h-6 w-6 text-neon-accent group-hover:text-neon-purple transition-colors duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-neon-accent mb-1">{financialStats.confirmedOrders}</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 group-hover:from-emerald-500/10 group-hover:to-green-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Cash Flow</CardTitle>
            <TrendingUp className="h-6 w-6 text-emerald-500 group-hover:text-green-500 transition-colors duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-emerald-500 mb-1">Positive</div>
            <p className="text-sm text-muted-foreground">Trending upward</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Finance Tabs */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
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
      </Tabs>
    </div>
  );
}