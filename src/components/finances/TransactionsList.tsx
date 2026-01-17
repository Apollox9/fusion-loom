import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpRight, Eye, FileDown, BarChart3, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatTZS } from '@/utils/pricing';
import { toast } from 'sonner';
import { generateTransactionsExportPdf, generateFinancialReportPdf } from '@/utils/financialReportPdfGenerator';

export interface Order {
  id: string;
  external_ref: string | null;
  school_name: string | null;
  total_amount: number | null;
  status: string;
  created_at: string;
  payment_method: string | null;
}

export function TransactionsList() {
  const [transactions, setTransactions] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingTransactions: 0,
    confirmedOrders: 0,
    totalTransactions: 0
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('id, external_ref, school_name, total_amount, status, created_at, payment_method')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
      
      // Calculate total income from all orders
      const total = (data || []).reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
      setTotalIncome(total);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch all orders for stats
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
        confirmedOrders,
        totalTransactions: (orders || []).length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'CONFIRMED':
      case 'AUTO_CONFIRMED':
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      case 'ONGOING':
      case 'PICKUP':
      case 'PACKAGING':
      case 'DELIVERY':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'SUBMITTED':
      case 'QUEUED':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'ABORTED':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleExportTransactions = async () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    try {
      setIsExporting(true);
      await generateTransactionsExportPdf(transactions, stats);
      toast.success('Transactions exported successfully as PDF');
    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast.error('Failed to export transactions');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    if (transactions.length === 0) {
      toast.error('No data available for report');
      return;
    }

    try {
      setIsGeneratingReport(true);
      await generateFinancialReportPdf(transactions, stats);
      toast.success('Financial report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Transactions Table */}
      <div className="lg:col-span-2">
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold gradient-text">Recent Transactions</CardTitle>
            <CardDescription>All financial activities from orders</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-accent/50 transition-colors">
                      <TableCell className="flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                        <span className="capitalize font-medium">Income</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.school_name || 'Unknown School'}</p>
                          <p className="text-sm text-muted-foreground">
                            Ref: {transaction.external_ref || transaction.id.slice(0, 8)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-emerald-500">
                          +{formatTZS(transaction.total_amount || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Summary */}
      <div className="space-y-6">
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="text-lg font-bold gradient-text">Transaction Summary</CardTitle>
            <CardDescription>Financial overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">Total Income</span>
              </div>
              <span className="font-bold text-emerald-500">{formatTZS(totalIncome)}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="font-medium">Total Transactions</span>
              <span className="font-bold text-primary">{transactions.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="text-lg font-bold gradient-text">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full bg-gradient-hero text-white shadow-primary hover:shadow-electric transition-all duration-300"
              onClick={handleExportTransactions}
              disabled={isExporting || transactions.length === 0}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              {isExporting ? 'Exporting...' : 'Export Transactions'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handleGenerateReport}
              disabled={isGeneratingReport || transactions.length === 0}
            >
              {isGeneratingReport ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              {isGeneratingReport ? 'Generating...' : 'Generate Report'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
