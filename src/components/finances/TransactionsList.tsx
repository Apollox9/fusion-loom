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
import { ArrowUpRight, ArrowDownRight, Eye } from 'lucide-react';

export function TransactionsList() {
  // Mock transaction data
  const transactions = [
    {
      id: 'TXN-001',
      type: 'income',
      amount: 1250.00,
      description: 'Order payment - Mwanza Secondary',
      date: '2024-01-15',
      status: 'completed',
      reference: 'ORD-1001'
    },
    {
      id: 'TXN-002',
      type: 'expense',
      amount: 450.00,
      description: 'Material procurement',
      date: '2024-01-14',
      status: 'completed',
      reference: 'EXP-2001'
    },
    {
      id: 'TXN-003',
      type: 'income',
      amount: 890.50,
      description: 'Order payment - Dar es Salaam High',
      date: '2024-01-14',
      status: 'pending',
      reference: 'ORD-1002'
    },
    {
      id: 'TXN-004',
      type: 'expense',
      amount: 120.00,
      description: 'Machine maintenance',
      date: '2024-01-13',
      status: 'completed',
      reference: 'MNT-3001'
    },
    {
      id: 'TXN-005',
      type: 'income',
      amount: 2100.00,
      description: 'Bulk order payment - Arusha Academy',
      date: '2024-01-12',
      status: 'completed',
      reference: 'ORD-1003'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'income' ? (
      <ArrowUpRight className="h-4 w-4 text-emerald-500" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Transactions Table */}
      <div className="lg:col-span-2">
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold gradient-text">Recent Transactions</CardTitle>
            <CardDescription>All financial activities in the system</CardDescription>
          </CardHeader>
          <CardContent>
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
                      {getTypeIcon(transaction.type)}
                      <span className="capitalize font-medium">{transaction.type}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">Ref: {transaction.reference}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${
                        transaction.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
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
          </CardContent>
        </Card>
      </div>

      {/* Transaction Summary */}
      <div className="space-y-6">
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="text-lg font-bold gradient-text">Transaction Summary</CardTitle>
            <CardDescription>Today's financial overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">Total Income</span>
              </div>
              <span className="font-bold text-emerald-500">+$4,240.50</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-red-500" />
                <span className="font-medium">Total Expenses</span>
              </div>
              <span className="font-bold text-red-500">-$570.00</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="font-medium">Net Balance</span>
              <span className="font-bold text-primary">+$3,670.50</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="text-lg font-bold gradient-text">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-gradient-hero text-white shadow-primary hover:shadow-electric transition-all duration-300">
              Export Transactions
            </Button>
            <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
              Generate Report
            </Button>
            <Button variant="outline" className="w-full border-electric-blue/30 text-electric-blue hover:bg-electric-blue hover:text-white">
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}