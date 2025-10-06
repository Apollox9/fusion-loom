import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  TrendingUp, 
  Award, 
  Target,
  DollarSign,
  Calendar,
  Users,
  Package,
  Trophy,
  Info
} from 'lucide-react';
import { formatTZS, calculateProfitByTier, getProfitTier } from '@/utils/pricing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const AnimatedCounter = ({ end, duration = 2000, prefix = "", suffix = "" }: { 
  end: number; 
  duration?: number; 
  prefix?: string; 
  suffix?: string; 
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

interface ProfitTabProps {
  sessions: any[];
  stats: {
    totalStudents: number;
    projectedProfit: number;
  };
}

const getTierIcon = (percentage: string) => {
  if (percentage === '18%') return '💎';
  if (percentage === '10%') return '🥇';
  if (percentage === '8%') return '🥈';
  return '🥉';
};

const getTierName = (percentage: string) => {
  if (percentage === '18%') return 'Platinum';
  if (percentage === '10%') return 'Gold';
  if (percentage === '8%') return 'Silver';
  return 'Bronze';
};

export function ProfitTab({ sessions, stats }: ProfitTabProps) {
  const currentTier = getProfitTier(stats.totalStudents);
  
  // Get active/pending session
  const activeSession = sessions.find(s => s.status === 'PENDING' || s.status === 'QUEUED' || s.status === 'IN_PROGRESS');
  
  // Get completed sessions
  const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
  
  // Calculate total lifetime profit
  const totalLifetimeProfit = completedSessions.reduce((sum, s) => {
    const profit = calculateProfitByTier(s.total_students || 0, Number(s.total_amount) || 0);
    return sum + profit;
  }, 0);
  
  // Calculate average profit per session
  const avgProfitPerSession = completedSessions.length > 0 
    ? totalLifetimeProfit / completedSessions.length 
    : 0;
  
  // Get highest profit session
  const sessionProfits = completedSessions.map(s => ({
    session: s,
    profit: calculateProfitByTier(s.total_students || 0, Number(s.total_amount) || 0)
  }));
  const highestProfitSession = sessionProfits.sort((a, b) => b.profit - a.profit)[0];
  
  // Prepare growth chart data
  const growthData = completedSessions
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((s, index) => {
      const profit = calculateProfitByTier(s.total_students || 0, Number(s.total_amount) || 0);
      return {
        name: `Session ${index + 1}`,
        profit: profit,
        date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });
  
  // Calculate monthly growth
  const monthlyGrowth = growthData.length > 1 
    ? ((growthData[growthData.length - 1].profit - growthData[0].profit) / growthData[0].profit * 100)
    : 0;
  
  // Calculate progress to next tier
  const getProgressToNextTier = () => {
    const current = stats.totalStudents;
    if (current < 100) return { current, target: 100, percentage: (current / 100) * 100 };
    if (current < 200) return { current, target: 200, percentage: ((current - 100) / 100) * 100 };
    if (current < 500) return { current, target: 500, percentage: ((current - 200) / 300) * 100 };
    return { current, target: 500, percentage: 100 };
  };
  
  const tierProgress = getProgressToNextTier();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-green-600 to-primary bg-clip-text text-transparent">
          PROFIT OVERVIEW
        </h1>
        <p className="text-muted-foreground">
          Track your earnings, growth, and progress towards your next profit tier.
        </p>
      </div>

      {/* Section 1: Projected Profit (Active Order) */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Current Session Profit Estimate
        </h2>
        
        {activeSession ? (
          <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Active Session</CardTitle>
                  <CardDescription>Order ID: #{activeSession.external_ref || activeSession.order_id || activeSession.id?.slice(0, 8)}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">
                  {activeSession.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{activeSession.total_students || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Garments</p>
                  <p className="text-2xl font-bold">{(activeSession.total_dark_garments || 0) + (activeSession.total_light_garments || 0)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Profit Tier
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Profit tiers increase with more students. Higher tiers mean better profit margins.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </p>
                  <p className="text-lg font-semibold text-primary">
                    {getTierIcon(getProfitTier(activeSession.total_students || 0).percentage)} {getTierName(getProfitTier(activeSession.total_students || 0).percentage)} ({getProfitTier(activeSession.total_students || 0).percentage})
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white">
                <p className="text-sm opacity-90 mb-1">Projected Profit (TZS)</p>
                <p className="text-4xl font-bold">
                  <AnimatedCounter 
                    end={calculateProfitByTier(activeSession.total_students || 0, Number(activeSession.total_amount) || 0)} 
                    prefix="TZS " 
                  />
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress to Next Tier</span>
                  <span className="font-medium">{tierProgress.current} / {tierProgress.target} students</span>
                </div>
                <Progress value={tierProgress.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {tierProgress.target - tierProgress.current > 0 
                    ? `${tierProgress.target - tierProgress.current} more students to unlock next tier!` 
                    : 'Maximum tier reached!'}
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Profits are officially credited once the session is fully completed.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No active session at the moment</p>
              <p className="text-sm text-muted-foreground mt-2">Submit a new order to start earning!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Section 2: Profit History */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          Past Earnings Summary
        </h2>
        
        <Card>
          <CardContent className="p-6">
            {completedSessions.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead className="text-right">Students</TableHead>
                        <TableHead className="text-right">Total Garments</TableHead>
                        <TableHead className="text-right">Profit Earned</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Date Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedSessions.map((session, index) => {
                        const profit = calculateProfitByTier(session.total_students || 0, Number(session.total_amount) || 0);
                        const tier = getProfitTier(session.total_students || 0);
                        return (
                          <TableRow key={session.id}>
                            <TableCell className="font-medium">Session {completedSessions.length - index}</TableCell>
                            <TableCell className="font-mono text-sm">#{session.external_ref || session.id?.slice(0, 8)}</TableCell>
                            <TableCell className="text-right">{session.total_students || 0}</TableCell>
                            <TableCell className="text-right">{(session.total_dark_garments || 0) + (session.total_light_garments || 0)}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600">{formatTZS(profit)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-medium">
                                {getTierIcon(tier.percentage)} {getTierName(tier.percentage)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(session.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Total Lifetime Profit</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatTZS(totalLifetimeProfit)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Average Profit per Session</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatTZS(avgProfitPerSession)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No completed sessions yet</p>
                <p className="text-sm text-muted-foreground mt-2">Your profit history will appear here once sessions are completed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Growth Analytics */}
      {growthData.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Your Growth Journey
          </h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Profit Growth Over Time</CardTitle>
              <CardDescription>Track your earning progression across sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      fontSize={12}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      fontSize={12}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => formatTZS(value)}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fill="url(#profitGradient)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-amber-600" />
                      <p className="text-sm font-medium text-muted-foreground">Highest Profit Session</p>
                    </div>
                    {highestProfitSession ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Session #{highestProfitSession.session.external_ref || highestProfitSession.session.id?.slice(0, 8)}
                        </p>
                        <p className="text-2xl font-bold text-amber-600">{formatTZS(highestProfitSession.profit)}</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">N/A</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <p className="text-sm font-medium text-muted-foreground">Average Growth</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {monthlyGrowth > 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-primary" />
                      <p className="text-sm font-medium text-muted-foreground">Current Tier Status</p>
                    </div>
                    <p className="text-lg font-bold">
                      {getTierIcon(currentTier.percentage)} {getTierName(currentTier.percentage)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentTier.range} students
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20">
                <p className="text-center font-medium text-foreground">
                  Keep growing! Each completed session brings you closer to higher profit tiers and rewards.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="text-center space-y-4 pt-8 border-t">
        <p className="text-lg font-medium text-muted-foreground">
          Every order contributes to your school's success. The more you print, the more you earn.
        </p>
        <p className="text-xs text-muted-foreground">
          ©2025 Blaqlogic Digitals. All rights reserved.
        </p>
      </div>
    </div>
  );
}
