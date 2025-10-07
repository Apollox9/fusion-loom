import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock, Users, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SessionProgressProps {
  order: any;
  onViewClass: (classId: string) => void;
}

export const SessionProgress: React.FC<SessionProgressProps> = ({ order, onViewClass }) => {
  const sessionData = order.session_data || {};
  const classes = sessionData.classes || [];
  
  const totalStudents = order.total_students || 0;
  const completedStudents = classes.reduce((sum: number, cls: any) => {
    return sum + (cls.students?.filter((s: any) => s.is_served).length || 0);
  }, 0);
  
  const progressPercentage = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0;
  
  const currentClass = classes.find((cls: any) => {
    const hasInProgress = cls.students?.some((s: any) => !s.is_served);
    return hasInProgress;
  });
  
  const currentStudent = currentClass?.students?.find((s: any) => !s.is_served);
  
  const getClassStatus = (cls: any) => {
    const total = cls.students?.length || 0;
    const completed = cls.students?.filter((s: any) => s.is_served).length || 0;
    
    if (completed === 0) return 'Pending';
    if (completed === total) return 'Completed';
    return 'Printing';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Session Summary Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Session Overview
          </CardTitle>
          <CardDescription>Order ID: {order.external_ref || order.id.slice(0, 8)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{totalStudents}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Classes</p>
              <p className="text-2xl font-bold">{classes.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Printed Students</p>
              <p className="text-2xl font-bold text-green-600">{completedStudents}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold text-primary">{progressPercentage.toFixed(0)}%</p>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{completedStudents} of {totalStudents} students</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Started {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Activity */}
      {currentClass && (
        <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Current Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Current Class</p>
              <p className="font-semibold text-lg">{currentClass.name}</p>
              <div className="mt-2">
                <Progress 
                  value={((currentClass.students?.filter((s: any) => s.is_served).length || 0) / (currentClass.students?.length || 1)) * 100} 
                  className="h-2" 
                />
              </div>
            </div>
            {currentStudent && (
              <div>
                <p className="text-sm text-muted-foreground">Current Student</p>
                <p className="font-semibold">{currentStudent.full_name}</p>
                <Badge className="mt-1">Processing</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Class List */}
      <Card>
        <CardHeader>
          <CardTitle>Class Breakdown</CardTitle>
          <CardDescription>View detailed progress for each class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {classes.map((cls: any, index: number) => {
              const total = cls.students?.length || 0;
              const completed = cls.students?.filter((s: any) => s.is_served).length || 0;
              const progress = total > 0 ? (completed / total) * 100 : 0;
              const status = getClassStatus(cls);
              
              return (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{cls.name}</h4>
                      <Badge variant={status === 'Completed' ? 'default' : status === 'Printing' ? 'secondary' : 'outline'}>
                        {status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {total} students
                      </span>
                      <span>{completed} printed</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewClass(cls.id || index.toString())}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
