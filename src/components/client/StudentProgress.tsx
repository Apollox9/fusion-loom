import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Clock, Loader } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StudentProgressProps {
  student: any;
  className: string;
  onBack: () => void;
}

interface Phase {
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  duration?: string;
  timestamp?: Date;
}

export const StudentProgress: React.FC<StudentProgressProps> = ({ student, className, onBack }) => {
  const totalGarments = (student.total_light_garment_count || 0) + (student.total_dark_garment_count || 0);
  const printedGarments = (student.printed_light_garment_count || 0) + (student.printed_dark_garment_count || 0);
  
  // Determine phases based on student data
  const phases: Phase[] = [
    {
      name: 'Waiting Auditing',
      status: 'completed',
      duration: '2 mins',
      timestamp: student.created_at ? new Date(student.created_at) : undefined
    },
    {
      name: 'Auditing',
      status: 'completed',
      duration: '3 mins'
    },
    {
      name: 'Audited / Waiting Printing',
      status: 'completed',
      duration: '1 min'
    },
    {
      name: 'Printing',
      status: printedGarments === totalGarments ? 'completed' : printedGarments > 0 ? 'in-progress' : 'pending',
      duration: printedGarments === totalGarments ? '7 mins' : undefined
    },
    {
      name: 'Printing Done / Waiting Packaging',
      status: student.light_garments_printed && student.dark_garments_printed ? 'completed' : 'pending',
      duration: student.light_garments_printed && student.dark_garments_printed ? '2 mins' : undefined
    },
    {
      name: 'Packaged',
      status: student.is_served ? 'completed' : 'pending',
      timestamp: student.updated_at && student.is_served ? new Date(student.updated_at) : undefined
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
                      {phase.timestamp && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDistanceToNow(phase.timestamp, { addSuffix: true })}
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
            {student.is_served ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-lg">All Done!</p>
                <p className="text-sm text-muted-foreground">
                  Completed {formatDistanceToNow(new Date(student.updated_at), { addSuffix: true })}
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
