import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Treemap
} from 'recharts';
import { 
  MapPin, 
  Users, 
  TrendingUp, 
  Globe,
  Building2,
  Activity
} from 'lucide-react';

// Mock geographical data - replace with real data from your API
const regionData = [
  { region: 'Dar es Salaam', users: 2845, schools: 45, color: 'hsl(var(--primary))' },
  { region: 'Mwanza', users: 1932, schools: 32, color: 'hsl(var(--electric-blue))' },
  { region: 'Arusha', users: 1654, schools: 28, color: 'hsl(var(--neon-accent))' },
  { region: 'Dodoma', users: 1421, schools: 25, color: 'hsl(var(--emerald-500))' },
  { region: 'Mbeya', users: 1156, schools: 21, color: 'hsl(var(--orange-500))' },
  { region: 'Morogoro', users: 987, schools: 18, color: 'hsl(var(--purple-500))' },
  { region: 'Tanga', users: 765, schools: 15, color: 'hsl(var(--pink-500))' },
  { region: 'Others', users: 1240, schools: 34, color: 'hsl(var(--muted))' }
];

const countryData = [
  { name: 'Tanzania', value: 85, users: 10234, color: 'hsl(var(--primary))' },
  { name: 'Kenya', value: 10, users: 1200, color: 'hsl(var(--electric-blue))' },
  { name: 'Uganda', value: 3, users: 360, color: 'hsl(var(--neon-accent))' },
  { name: 'Rwanda', value: 2, users: 240, color: 'hsl(var(--emerald-500))' }
];

const cityData = [
  { city: 'Dar es Salaam', users: 2845, growth: 15.2, schools: 45 },
  { city: 'Mwanza', users: 1932, growth: 12.8, schools: 32 },
  { city: 'Arusha', users: 1654, growth: 10.5, schools: 28 },
  { city: 'Dodoma', users: 1421, growth: 8.9, schools: 25 },
  { city: 'Mbeya', users: 1156, growth: 7.2, schools: 21 },
  { city: 'Morogoro', users: 987, growth: 6.1, schools: 18 },
  { city: 'Tanga', users: 765, growth: 4.8, schools: 15 },
  { city: 'Zanzibar', users: 543, growth: 3.9, schools: 12 }
];

const chartConfig = {
  users: {
    label: "Users",
    color: "hsl(var(--primary))",
  },
  schools: {
    label: "Schools",
    color: "hsl(var(--electric-blue))",
  }
};

export function GeographicalAnalytics() {
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'schools'>('users');
  
  const totalUsers = regionData.reduce((sum, region) => sum + region.users, 0);
  const totalSchools = regionData.reduce((sum, region) => sum + region.schools, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Regions</CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{regionData.length}</div>
            <p className="text-xs text-muted-foreground">Across East Africa</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-electric-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-electric-blue">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all regions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schools</CardTitle>
            <Building2 className="h-4 w-4 text-neon-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-accent">{totalSchools}</div>
            <p className="text-xs text-muted-foreground">Educational institutions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{countryData.length}</div>
            <p className="text-xs text-muted-foreground">Operational presence</p>
          </CardContent>
        </Card>
      </div>

      {/* Regional Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Bar Chart */}
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="text-lg font-bold gradient-text">Users by Region</CardTitle>
            <CardDescription>Distribution of users across different regions</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px]">
              <BarChart data={regionData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" />
                <YAxis dataKey="region" type="category" width={80} />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload[0]) {
                      return (
                        <div className="bg-background/95 border border-border/50 rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-electric-blue">
                            Users: {payload[0].value?.toLocaleString()}
                          </p>
                          <p className="text-sm text-neon-accent">
                            Schools: {payload[0].payload?.schools}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="users" 
                  fill="var(--color-users)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Country Distribution Pie Chart */}
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="text-lg font-bold gradient-text">Country Distribution</CardTitle>
            <CardDescription>User distribution by country</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ChartContainer config={chartConfig} className="h-[300px]">
                <PieChart>
                  <Pie
                    data={countryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {countryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background/95 border border-border/50 rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-electric-blue">
                              Users: {data.users.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {data.value}% of total
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* City Rankings and Regional Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cities */}
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="text-lg font-bold gradient-text">Top Cities by Users</CardTitle>
            <CardDescription>Leading cities with highest user concentrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cityData.slice(0, 6).map((city, index) => (
              <div key={city.city} className="flex items-center justify-between p-3 rounded-xl bg-accent/10 hover:bg-accent/20 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="outline" 
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      index === 0 ? 'bg-primary text-primary-foreground' :
                      index === 1 ? 'bg-electric-blue text-white' :
                      index === 2 ? 'bg-neon-accent text-white' : 
                      'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-semibold">{city.city}</p>
                    <p className="text-sm text-muted-foreground">{city.schools} schools</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{city.users.toLocaleString()}</p>
                  <div className="flex items-center text-sm">
                    <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                    <span className="text-emerald-500">{city.growth}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Regional Growth */}
        <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="text-lg font-bold gradient-text">Regional Market Penetration</CardTitle>
            <CardDescription>User adoption rates by region</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {regionData.slice(0, 6).map((region) => {
              const penetration = (region.users / totalUsers) * 100;
              return (
                <div key={region.region} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{region.region}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {region.users.toLocaleString()} users
                      </Badge>
                      <span className="text-sm font-semibold">{penetration.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress 
                    value={penetration} 
                    className="h-2"
                    style={{
                      // @ts-ignore - Custom CSS property
                      '--progress-background': region.color
                    }}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Heat Map Placeholder */}
      <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
        <CardHeader>
          <CardTitle className="text-lg font-bold gradient-text">Geographic Heat Map</CardTitle>
          <CardDescription>Visual representation of user density across regions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gradient-to-br from-primary/5 to-electric-blue/5 rounded-xl border border-border/30 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 text-primary mx-auto" />
              <p className="text-lg font-semibold gradient-text">Interactive Map</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Heat map visualization showing user concentration, school locations, and regional performance metrics across East Africa
              </p>
              <Badge className="bg-gradient-electric text-white">
                <Activity className="h-3 w-3 mr-1" />
                Real-time Data
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}