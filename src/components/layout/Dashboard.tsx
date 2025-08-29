import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsTab } from '@/components/analytics/AnalyticsTab';
import { 
  Building2, 
  Users, 
  Package, 
  Printer, 
  TrendingUp,
  Plus,
  Activity,
  BarChart3,
  Home
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  // Mock data - will be replaced with real data
  const stats = {
    totalSchools: 127,
    totalStudents: 15420,
    activeOrders: 23,
    onlineMachines: 8,
    todayPrints: 1247
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-electric-blue/5">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Command Center</h1>
            <p className="text-xl text-muted-foreground">Real-time insights and intelligent automation</p>
          </div>
          <div className="flex gap-3">
            <Link to="/orders/new">
              <Button className="bg-gradient-hero text-white shadow-primary hover:shadow-electric transition-all duration-300 hover-lift">
                <Plus className="mr-2 h-5 w-5" />
                New Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-slide-up">
          <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-electric-blue/5 group-hover:from-primary/10 group-hover:to-electric-blue/10 transition-all duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Schools</CardTitle>
              <Building2 className="h-6 w-6 text-primary group-hover:text-electric-blue transition-colors duration-300" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-primary mb-1">{stats.totalSchools}</div>
              <p className="text-sm text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-neon-accent/5 group-hover:from-electric-blue/10 group-hover:to-neon-accent/10 transition-all duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Students</CardTitle>
              <Users className="h-6 w-6 text-electric-blue group-hover:text-neon-accent transition-colors duration-300" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-electric-blue mb-1">{stats.totalStudents.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-accent/5 to-neon-purple/5 group-hover:from-neon-accent/10 group-hover:to-neon-purple/10 transition-all duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Active Orders</CardTitle>
              <Package className="h-6 w-6 text-neon-accent group-hover:text-neon-purple transition-colors duration-300" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-neon-accent mb-1">{stats.activeOrders}</div>
              <p className="text-sm text-muted-foreground">
                5 in progress
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 group-hover:from-emerald-500/10 group-hover:to-green-500/10 transition-all duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Online Machines</CardTitle>
              <Activity className="h-6 w-6 text-emerald-500 group-hover:text-green-500 transition-colors duration-300 animate-pulse" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-emerald-500 mb-1">{stats.onlineMachines}</div>
              <p className="text-sm text-muted-foreground">
                2 printing now
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50 shadow-card hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 group-hover:from-orange-500/10 group-hover:to-amber-500/10 transition-all duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Today's Prints</CardTitle>
              <Printer className="h-6 w-6 text-orange-500 group-hover:text-amber-500 transition-colors duration-300" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-orange-500 mb-1">{stats.todayPrints.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                +15% from yesterday
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-scale-in">
          <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold gradient-text">Recent Orders</CardTitle>
              <CardDescription className="text-base">Latest print orders with live status tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/20 to-accent/10 rounded-xl border border-border/30 hover:border-primary/30 transition-all duration-300 hover-lift">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-electric-blue rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-semibold text-foreground">Order #{1000 + i}</p>
                      <p className="text-sm text-muted-foreground">Mwanza Secondary School</p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-electric text-white shadow-sm">PROCESSING</Badge>
                </div>
              ))}
              <Link to="/orders">
                <Button variant="outline" className="w-full mt-4 h-12 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover-lift">
                  View All Orders
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold gradient-text">System Health</CardTitle>
              <CardDescription className="text-base">Real-time infrastructure monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                <span className="font-medium text-foreground">Database Connection</span>
                <Badge className="bg-emerald-500 text-white shadow-sm animate-pulse">Optimal</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                <span className="font-medium text-foreground">Print Queue</span>
                <Badge className="bg-emerald-500 text-white shadow-sm">Normal</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                <span className="font-medium text-foreground">Machine Network</span>
                <Badge className="bg-yellow-500 text-white shadow-sm">Monitor</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                <span className="font-medium text-foreground">Cloud Storage</span>
                <Badge className="bg-emerald-500 text-white shadow-sm">Healthy</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}