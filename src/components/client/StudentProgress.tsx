import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Clock, Loader, Package } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface StudentProgressProps {
  student: any;
  className: string;
  onBack: () => void;
  sessionId?: string;
}

interface Phase {
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  duration?: string;
  timestamp?: Date;
}

export const StudentProgress: React.FC<StudentProgressProps> = ({ student, className, onBack, sessionId }) => {
  const [auditSessionActive, setAuditSessionActive] = useState(false);
  const [packagedTime, setPackagedTime] = useState<Date | null>(null);
  
  const totalGarments = (student.total_light_garment_count || 0) + (student.total_dark_garment_count || 0);
  const printedGarments = (student.printed_light_garment_count || 0) + (student.printed_dark_garment_count || 0);
  
  // Check if an audit session is active for this order
  useEffect(() => {
    const checkAuditSession = async () => {
      if (!sessionId) return;
      
      const { data } = await supabase
        .from('audit_reports')
        .select('status')
        .eq('session_id', sessionId)
        .maybeSingle();
      
      if (data && data.status === 'IN_PROGRESS') {
        setAuditSessionActive(true);
      }
    };
    
    checkAuditSession();
    
    // Set up real-time subscription for audit reports
    const channel = supabase
      .channel('student-audit-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'audit_reports',
        filter: `session_id=eq.${sessionId}`
      }, (payload: any) => {
        if (payload.new?.status === 'IN_PROGRESS') {
          setAuditSessionActive(true);
        } else {
          setAuditSessionActive(false);
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Track packaged time (5 mins after printing done)
  useEffect(() => {
    if (student.is_served && student.printing_done_at) {
      const printingDoneDate = new Date(student.printing_done_at);
      const packagedDate = new Date(printingDoneDate.getTime() + 5 * 60 * 1000);
      setPackagedTime(packagedDate);
    }
  }, [student.is_served, student.printing_done_at]);

  // Determine phases based on student data with is_audited tracking
  const getPhaseStatus = (phaseName: string): 'completed' | 'in-progress' | 'pending' => {
    const isAudited = student.is_audited === true;
    const hasPrintedGarments = printedGarments > 0;
    const isPrintingDone = student.is_served === true;
    
    switch (phaseName) {
      case 'Waiting Auditing':
        return 'completed'; // Always completed as starting point
      case 'Auditing':
        if (isAudited) return 'completed';
        if (auditSessionActive && !isAudited) return 'in-progress';
        return 'pending';
      case 'Audited':
        return isAudited ? 'completed' : 'pending';
      case 'Printing':
        if (isPrintingDone) return 'completed';
        if (hasPrintedGarments && !isPrintingDone) return 'in-progress';
        return 'pending';
      case 'Printing Done / Waiting Packaging':
        return isPrintingDone ? 'completed' : 'pending';
      case 'Packaged':
        if (isPrintingDone && packagedTime && new Date() >= packagedTime) return 'completed';
        return 'pending';
      default:
        return 'pending';
    }
  };

  const phases: Phase[] = [
    {
      name: 'Waiting Auditing',
      status: 'completed',
      duration: '2 mins',
      timestamp: student.created_at ? new Date(student.created_at) : undefined
    },
    {
      name: 'Auditing',
      status: getPhaseStatus('Auditing'),
      duration: student.is_audited ? '3 mins' : undefined,
      timestamp: student.is_audited && student.updated_at ? new Date(student.updated_at) : undefined
    },
    {
      name: 'Audited',
      status: getPhaseStatus('Audited'),
      timestamp: student.is_audited && student.updated_at ? new Date(student.updated_at) : undefined
    },
    {
      name: 'Printing',
      status: getPhaseStatus('Printing'),
      duration: student.is_served ? '7 mins' : undefined
    },
    {
      name: 'Printing Done / Waiting Packaging',
      status: getPhaseStatus('Printing Done / Waiting Packaging'),
      timestamp: student.printing_done_at ? new Date(student.printing_done_at) : undefined
    },
    {
      name: 'Packaged',
      status: getPhaseStatus('Packaged'),
      timestamp: packagedTime || undefined
    }
  ];
  
  const currentPhase = phases.find(p => p.status === 'in-progress') || phases.find(p => p.status === 'pending');
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Loader className="w-5 h-5 text-primary animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-800 dark:text-green-300 border-green-500/30';
      case 'in-progress':
        return 'bg-primary/20 text-primary border-primary/30';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Class
        </Button>
      </div>

      {/* Student Info Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>{student.full_name}</CardTitle>
          <CardDescription>Class: {className}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Garments</p>
              <p className="text-2xl font-bold">{totalGarments}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Printed</p>
              <p className="text-2xl font-bold text-green-600">{printedGarments}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Light Garments</p>
              <p className="text-lg font-semibold">{student.printed_light_garment_count || 0} / {student.total_light_garment_count || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dark Garments</p>
              <p className="text-lg font-semibold">{student.printed_dark_garment_count || 0} / {student.total_dark_garment_count || 0}</p>
            </div>
          </div>
          
          {currentPhase && (
            <div className="p-4 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-muted-foreground mb-1">Current Phase</p>
              <p className="text-lg font-bold">{currentPhase.name}</p>
              {currentPhase.status === 'in-progress' && (
                <p className="text-sm text-muted-foreground mt-1">Processing...</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Timeline</CardTitle>
          <CardDescription>Detailed journey through the printing process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {phases.map((phase, index) => (
              <div key={index} className="flex gap-4">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div className={`rounded-full p-2 border-2 ${getStatusColor(phase.status)}`}>
                    {getStatusIcon(phase.status)}
                  </div>
                  {index < phases.length - 1 && (
                    <div className={`w-0.5 flex-1 min-h-[40px] ${phase.status === 'completed' ? 'bg-green-500/50' : 'bg-muted'}`} />
                  )}
                </div>
                
                {/* Phase details */}
                <div className="flex-1 pb-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{phase.name}</h4>
                      {phase.duration && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Duration: {phase.duration}
                        </p>
                      )}
                      {phase.timestamp && phase.status === 'completed' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(phase.timestamp, 'MMM d, yyyy h:mm a')} ({formatDistanceToNow(phase.timestamp, { addSuffix: true })})
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(phase.status)}>
                      {phase.status === 'in-progress' ? 'In Progress' : phase.status === 'completed' ? 'Completed' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Indicator */}
      <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5">
        <CardContent className="pt-6">
          <div className="text-center">
            {phases.every(p => p.status === 'completed') ? (
              <>
                <Package className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-lg">All Done & Packaged!</p>
                {packagedTime && (
                  <p className="text-sm text-muted-foreground">
                    Packaged {formatDistanceToNow(packagedTime, { addSuffix: true })}
                  </p>
                )}
              </>
            ) : student.is_served ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-lg">Printing Complete!</p>
                <p className="text-sm text-muted-foreground">
                  {student.printing_done_at 
                    ? `Completed ${formatDistanceToNow(new Date(student.printing_done_at), { addSuffix: true })}`
                    : 'Awaiting packaging'
                  }
                </p>
              </>
            ) : currentPhase?.status === 'in-progress' ? (
              <>
                <Loader className="w-12 h-12 text-primary mx-auto mb-2 animate-spin" />
                <p className="font-semibold text-lg">Currently {currentPhase.name}</p>
                <p className="text-sm text-muted-foreground">Processing in progress</p>
              </>
            ) : (
              <>
                <Clock className="w-12 h-12 text-orange-600 mx-auto mb-2" />
                <p className="font-semibold text-lg">Waiting in Queue</p>
                <p className="text-sm text-muted-foreground">{currentPhase?.name}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
