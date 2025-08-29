import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  School, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock
} from 'lucide-react';

interface TimelineAnalyticsProps {
  selectedPeriod: 'daily' | 'weekly' | 'monthly' | 'annual';
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly' | 'annual') => void;
}

const chartConfig = {
  users: {
    label: "New Users",
    color: "hsl(var(--primary))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--electric-blue))",
  },
  schools: {
    label: "Schools",
    color: "hsl(var(--neon-accent))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--emerald-500))",
  }
};

// Mock data - replace with real data from your API
const generateMockData = (period: string) => {
  const baseData = {
    daily: Array.from({ length: 7 }, (_, i) => ({
      period: `Day ${i + 1}`,
      users: Math.floor(Math.random() * 100) + 20,
      orders: Math.floor(Math.random() * 50) + 10,
      schools: Math.floor(Math.random() * 5) + 1,
      revenue: Math.floor(Math.random() * 5000) + 1000
    })),
    weekly: Array.from({ length: 4 }, (_, i) => ({
      period: `Week ${i + 1}`,
      users: Math.floor(Math.random() * 500) + 100,
      orders: Math.floor(Math.random() * 200) + 50,
      schools: Math.floor(Math.random() * 15) + 5,
      revenue: Math.floor(Math.random() * 25000) + 5000
    })),
    monthly: Array.from({ length: 12 }, (_, i) => ({
      period: new Date(2024, i).toLocaleDateString('en', { month: 'short' }),
      users: Math.floor(Math.random() * 2000) + 500,
      orders: Math.floor(Math.random() * 800) + 200,
      schools: Math.floor(Math.random() * 50) + 20,
      revenue: Math.floor(Math.random() * 100000) + 20000
    })),
    annual: Array.from({ length: 5 }, (_, i) => ({
      period: `${2020 + i}`,
      users: Math.floor(Math.random() * 10000) + 2000,
      orders: Math.floor(Math.random() * 5000) + 1000,
      schools: Math.floor(Math.random() * 200) + 50,
      revenue: Math.floor(Math.random() * 500000) + 100000
    }))
  };
  return baseData[period];
};

const statusData = [
  { name: 'Active', value: 65, color: 'hsl(var(--emerald-500))' },
  { name: 'Pending', value: 25, color: 'hsl(var(--electric-blue))' },
  { name: 'Inactive', value: 10, color: 'hsl(var(--muted))' }
];

export function TimelineAnalytics({ selectedPeriod, onPeriodChange }: TimelineAnalyticsProps) {
  const [data, setData] = useState(generateMockData(selectedPeriod));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData(generateMockData(selectedPeriod));
      setIsLoading(false);
    }, 500);
  }, [selectedPeriod]);

  const periods = [
    { key: 'daily' as const, label: 'Daily', icon: Clock },
    { key: 'weekly' as const, label: 'Weekly', icon: Calendar },
    { key: 'monthly' as const, label: 'Monthly', icon: Calendar },
    { key: 'annual' as const, label: 'Annual', icon: TrendingUp }
  ];

  const currentTotal = data.reduce((sum, item) => sum + item.users, 0);
  const previousTotal = currentTotal * 0.85; // Mock previous period data
  const growthRate = ((currentTotal - previousTotal) / previousTotal) * 100;

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold gradient-text">Time Period</CardTitle>
          <CardDescription>Select the time frame for analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {periods.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={selectedPeriod === key ? "default" : "outline"}
                onClick={() => onPeriodChange(key)}
                className={`flex items-center gap-2 transition-all duration-300 ${
                  selectedPeriod === key 
                    ? 'bg-gradient-hero text-white shadow-primary hover:shadow-electric' 
                    : 'hover:bg-primary/10 hover:border-primary/30'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currentTotal.toLocaleString()}</div>
            <div className="flex items-center text-sm">
              {growthRate >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={growthRate >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                {Math.abs(growthRate).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs previous {selectedPeriod}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-electric-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-electric-blue">
              {data.reduce((sum, item) => sum + item.orders, 0).toLocaleString()}
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
              <span className="text-emerald-500">12.5%</span>
              <span className="text-muted-foreground ml-1">vs previous {selectedPeriod}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schools</CardTitle>
            <School className="h-4 w-4 text-neon-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-accent">
              {data.reduce((sum, item) => sum + item.schools, 0)}
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
              <span className="text-emerald-500">8.2%</span>
              <span className="text-muted-foreground ml-1">vs previous {selectedPeriod}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              ${data.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
              <span className="text-emerald-500">15.3%</span>
              <span className="text-muted-foreground ml-1">vs previous {selectedPeriod}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - User Growth */}
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="text-lg font-bold gradient-text">User Growth Trend</CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="period" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="var(--color-users)" 
                  strokeWidth={3}
                  dot={{ fill: "var(--color-users)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "var(--color-users)", strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Area Chart - Orders & Revenue */}
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="text-lg font-bold gradient-text">Orders & Revenue</CardTitle>
            <CardDescription>Order volume and revenue correlation</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="period" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area 
                  type="monotone" 
                  dataKey="orders" 
                  stackId="1"
                  stroke="var(--color-orders)" 
                  fill="var(--color-orders)"
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="2"
                  stroke="var(--color-revenue)" 
                  fill="var(--color-revenue)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bar Chart - School Growth */}
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="text-lg font-bold gradient-text">School Onboarding</CardTitle>
            <CardDescription>New schools joined per {selectedPeriod.slice(0, -2)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="period" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="schools" 
                  fill="var(--color-schools)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - User Status Distribution */}
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="text-lg font-bold gradient-text">User Status Distribution</CardTitle>
            <CardDescription>Current user activity breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      return (
                        <div className="bg-background/95 border border-border/50 rounded-lg p-2 shadow-lg">
                          <p className="font-medium">{payload[0].payload.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {payload[0].value}% of users
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-col gap-2 ml-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <Badge variant="outline" className="text-xs">
                    {item.name}: {item.value}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}