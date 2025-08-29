import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimelineAnalytics } from './TimelineAnalytics';
import { GeographicalAnalytics } from './GeographicalAnalytics';
import { 
  BarChart3, 
  TrendingUp, 
  Map, 
  Calendar,
  Globe
} from 'lucide-react';

export function AnalyticsTab() {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('daily');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold gradient-text mb-2">Analytics Dashboard</h2>
          <p className="text-lg text-muted-foreground">Comprehensive insights and user distribution metrics</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          Real-time analytics
        </div>
      </div>

      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline Analytics
          </TabsTrigger>
          <TabsTrigger value="geographical" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Geographical Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6">
          <TimelineAnalytics 
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </TabsContent>

        <TabsContent value="geographical" className="space-y-6">
          <GeographicalAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}