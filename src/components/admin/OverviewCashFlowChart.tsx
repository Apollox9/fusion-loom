import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { formatTZS } from '@/utils/pricing';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface DailyData {
  date: string;
  income: number;
}

interface StatusBreakdown {
  name: string;
  value: number;
  color: string;
}

export function OverviewCashFlowChart() {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [yesterdayRevenue, setYesterdayRevenue] = useState(0);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);

  useEffect(() => {
    fetchCashflowData();
  }, []);

  const fetchCashflowData = async () => {
    try {
      setIsLoading(true);
      
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
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          income
        };
      });
      setDailyData(dailyAggregated);

      // Calculate today's revenue
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = (orders || []).filter(o => o.created_at.split('T')[0] === today);
      setTodayRevenue(todayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0));

      // Calculate yesterday's revenue
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayOrders = (orders || []).filter(o => o.created_at.split('T')[0] === yesterdayStr);
      setYesterdayRevenue(yesterdayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0));

      // Calculate weekly revenue
      setWeeklyRevenue(dailyAggregated.reduce((sum, d) => sum + d.income, 0));

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
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      setStatusBreakdown(breakdown);

    } catch (error) {
      console.error('Error fetching cashflow data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const growthPercentage = yesterdayRevenue > 0 
    ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
    : todayRevenue > 0 ? 100 : 0;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTZS(todayRevenue)}</div>
            <div className="flex items-center text-sm mt-1">
              {growthPercentage >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={growthPercentage >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                {growthPercentage >= 0 ? '+' : ''}{growthPercentage}%
              </span>
              <span className="text-muted-foreground ml-1">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTZS(weeklyRevenue)}</div>
            <p className="text-sm text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue by Status (Top 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {statusBreakdown.map((item, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{formatTZS(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Daily Revenue Trend</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {dailyData.every(d => d.income === 0) ? (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No revenue data for the last 7 days
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis 
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
                <Bar dataKey="income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
