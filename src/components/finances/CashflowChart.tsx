import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { formatTZS } from '@/utils/pricing';
import { toast } from 'sonner';

interface DailyData {
  date: string;
  income: number;
}

interface MonthlyData {
  month: string;
  income: number;
}

interface StatusBreakdown {
  name: string;
  value: number;
  color: string;
}

export function CashflowChart() {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCashflowData();
  }, []);

  const fetchCashflowData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all orders with their amounts and dates
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process daily data (last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const dailyAggregated = last7Days.map(date => {
        const dayOrders = (orders || []).filter(o => 
          o.created_at.split('T')[0] === date
        );
        const income = dayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          income
        };
      });
      setDailyData(dailyAggregated);

      // Process monthly data (last 5 months)
      const months: { [key: string]: number } = {};
      const now = new Date();
      for (let i = 4; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        months[key] = 0;
      }

      (orders || []).forEach(order => {
        const orderDate = new Date(order.created_at);
        const key = orderDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (months[key] !== undefined) {
          months[key] += Number(order.total_amount) || 0;
        }
      });

      setMonthlyData(Object.entries(months).map(([month, income]) => ({ month, income })));

      // Process status breakdown
      const statusCounts: { [key: string]: number } = {};
      (orders || []).forEach(order => {
        const status = order.status || 'UNKNOWN';
        statusCounts[status] = (statusCounts[status] || 0) + (Number(order.total_amount) || 0);
      });

      const statusColors: { [key: string]: string } = {
        'COMPLETED': '#10b981',
        'CONFIRMED': '#3b82f6',
        'AUTO_CONFIRMED': '#06b6d4',
        'ONGOING': '#f59e0b',
        'SUBMITTED': '#8b5cf6',
        'QUEUED': '#ec4899',
        'PACKAGING': '#14b8a6',
        'DELIVERY': '#f97316',
        'PICKUP': '#6366f1',
        'ABORTED': '#ef4444',
        'DONE': '#22c55e'
      };

      const breakdown = Object.entries(statusCounts)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name,
          value,
          color: statusColors[name] || '#6b7280'
        }));
      setStatusBreakdown(breakdown);

    } catch (error) {
      console.error('Error fetching cashflow data:', error);
      toast.error('Failed to load cashflow data');
    } finally {
      setIsLoading(false);
    }
  };

  const totalRevenue = statusBreakdown.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="breakdown">By Status</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg font-bold gradient-text">Daily Revenue Trend</CardTitle>
                <CardDescription>Income over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {dailyData.every(d => d.income === 0) ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No revenue data for the last 7 days
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        className="text-muted-foreground"
                        fontSize={12}
                      />
                      <YAxis 
                        className="text-muted-foreground"
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [formatTZS(value), 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="income" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        name="Revenue"
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg font-bold gradient-text">Daily Revenue</CardTitle>
                <CardDescription>Bar chart of daily income</CardDescription>
              </CardHeader>
              <CardContent>
                {dailyData.every(d => d.income === 0) ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No revenue data for the last 7 days
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        className="text-muted-foreground"
                        fontSize={12}
                      />
                      <YAxis 
                        className="text-muted-foreground"
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [formatTZS(value), 'Revenue']}
                      />
                      <Bar 
                        dataKey="income" 
                        fill="url(#incomeGradient)" 
                        radius={[4, 4, 0, 0]}
                        name="Revenue"
                      />
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
            <CardHeader>
              <CardTitle className="text-xl font-bold gradient-text">Monthly Revenue Analysis</CardTitle>
              <CardDescription>5-month financial performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.every(d => d.income === 0) ? (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  No revenue data for the last 5 months
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="month" 
                      className="text-muted-foreground"
                      fontSize={12}
                    />
                    <YAxis 
                      className="text-muted-foreground"
                      fontSize={12}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [formatTZS(value), 'Revenue']}
                    />
                    <Bar dataKey="income" fill="hsl(var(--primary))" name="Revenue" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg font-bold gradient-text">Revenue by Status</CardTitle>
                <CardDescription>Distribution of revenue by order status</CardDescription>
              </CardHeader>
              <CardContent>
                {statusBreakdown.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [formatTZS(value), 'Revenue']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg font-bold gradient-text">Revenue Categories</CardTitle>
                <CardDescription>Detailed breakdown with amounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statusBreakdown.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  statusBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent/20 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">
                          {totalRevenue > 0 ? ((item.value / totalRevenue) * 100).toFixed(1) : 0}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatTZS(item.value)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
