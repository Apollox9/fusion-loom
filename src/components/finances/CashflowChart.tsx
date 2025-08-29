import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function CashflowChart() {
  // Mock cashflow data
  const dailyData = [
    { date: '01/15', income: 1250, expenses: 450, net: 800 },
    { date: '01/16', income: 890, expenses: 120, net: 770 },
    { date: '01/17', income: 2100, expenses: 340, net: 1760 },
    { date: '01/18', income: 1450, expenses: 580, net: 870 },
    { date: '01/19', income: 1680, expenses: 220, net: 1460 },
    { date: '01/20', income: 980, expenses: 150, net: 830 },
    { date: '01/21', income: 1320, expenses: 390, net: 930 }
  ];

  const monthlyData = [
    { month: 'Sep', income: 28500, expenses: 12400, net: 16100 },
    { month: 'Oct', income: 32100, expenses: 14200, net: 17900 },
    { month: 'Nov', income: 35200, expenses: 15800, net: 19400 },
    { month: 'Dec', income: 41300, expenses: 18100, net: 23200 },
    { month: 'Jan', income: 45250, expenses: 19300, net: 25950 }
  ];

  const expenseBreakdown = [
    { name: 'Materials', value: 45, color: '#3b82f6' },
    { name: 'Maintenance', value: 25, color: '#10b981' },
    { name: 'Operations', value: 20, color: '#f59e0b' },
    { name: 'Other', value: 10, color: '#ef4444' }
  ];

  return (
    <div className="space-y-8">
      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg font-bold gradient-text">Daily Cash Flow Trend</CardTitle>
                <CardDescription>Income vs Expenses (Last 7 days)</CardDescription>
              </CardHeader>
              <CardContent>
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
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="hsl(var(--electric-blue))" 
                      strokeWidth={3}
                      name="Income"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="hsl(var(--neon-accent))" 
                      strokeWidth={3}
                      name="Expenses"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg font-bold gradient-text">Net Cash Flow</CardTitle>
                <CardDescription>Daily profit/loss analysis</CardDescription>
              </CardHeader>
              <CardContent>
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
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="net" 
                      fill="url(#netGradient)" 
                      radius={[4, 4, 0, 0]}
                      name="Net Flow"
                    />
                    <defs>
                      <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
            <CardHeader>
              <CardTitle className="text-xl font-bold gradient-text">Monthly Cash Flow Analysis</CardTitle>
              <CardDescription>5-month financial performance overview</CardDescription>
            </CardHeader>
            <CardContent>
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
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="income" fill="hsl(var(--electric-blue))" name="Income" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--neon-accent))" name="Expenses" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="net" fill="hsl(var(--primary))" name="Net Profit" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg font-bold gradient-text">Expense Breakdown</CardTitle>
                <CardDescription>Current month expense distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg font-bold gradient-text">Expense Categories</CardTitle>
                <CardDescription>Detailed breakdown with amounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expenseBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent/20 border border-border/30">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{item.value}%</p>
                      <p className="text-sm text-muted-foreground">
                        ${(19300 * item.value / 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}