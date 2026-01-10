import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock, Users, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ClassData {
  id: string;
  name: string;
  is_attended: boolean;
  total_students_served_in_class: number;
  total_students_to_serve_in_class: number;
  students: any[];
}

interface SessionProgressProps {
  order: any;
  classes: ClassData[];
  onViewClass: (classId: string) => void;
}

export const SessionProgress: React.FC<SessionProgressProps> = ({ order, classes, onViewClass }) => {
  // Calculate from actual data in students/classes tables - count is_served and is_attended
  const totalStudents = order.total_students || 0;
  
  // Count students with is_served=TRUE by looping through all class students
  const completedStudents = classes.reduce((total, cls) => {
    return total + (cls.students?.filter((s: any) => s.is_served === true).length || 0);
  }, 0);
  
  const totalClasses = order.total_classes_to_serve || classes.length;
  
  // Count classes with is_attended=TRUE
  const completedClasses = classes.filter(c => c.is_attended === true).length;
  
  const progressPercentage = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0;
  
  // Use order columns for current class and student (updated in real-time)
  const currentClassName = order.current_class_name;
  const currentStudentName = order.current_student_name;
  
  // Find current class data for progress bar
  const currentClassData = currentClassName 
    ? classes.find(c => c.name === currentClassName) 
    : null;
  
  const getClassStatus = (cls: ClassData) => {
    // Count students with is_served=TRUE from this class
    const completed = cls.students?.filter((s: any) => s.is_served === true).length || 0;
    const total = cls.total_students_to_serve_in_class || cls.students?.length || 0;
    
    if (cls.is_attended === true && completed === total) return 'Completed';
    if (completed > 0 || cls.is_attended === true) return 'Printing';
    return 'Pending';
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
          <CardDescription>Order ID: {order.external_ref || order.id?.slice(0, 8)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{totalStudents}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Classes</p>
              <p className="text-2xl font-bold">{totalClasses}</p>
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
            <span>Started {order.created_at ? formatDistanceToNow(new Date(order.created_at), { addSuffix: true }) : 'recently'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Activity - using order columns */}
      {(currentClassName || currentStudentName) && (
        <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Current Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentClassName && (
              <div>
                <p className="text-sm text-muted-foreground">Current Class</p>
                <p className="font-semibold text-lg">{currentClassName}</p>
                {currentClassData && (
                  <div className="mt-2">
                    <Progress 
                      value={currentClassData.total_students_to_serve_in_class > 0 
                        ? (currentClassData.total_students_served_in_class / currentClassData.total_students_to_serve_in_class) * 100 
                        : 0} 
                      className="h-2" 
                    />
                  </div>
                )}
              </div>
            )}
            {currentStudentName && (
              <div>
                <p className="text-sm text-muted-foreground">Current Student</p>
                <p className="font-semibold">{currentStudentName}</p>
                <Badge className="mt-1">Processing</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Class List - from classes table */}
      <Card>
        <CardHeader>
          <CardTitle>Class Breakdown</CardTitle>
          <CardDescription>View detailed progress for each class ({completedClasses} of {totalClasses} completed)</CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length > 0 ? (
            <div className="space-y-3">
              {classes.map((cls) => {
                const total = cls.total_students_to_serve_in_class || cls.students?.length || 0;
                // Count students with is_served=TRUE
                const completed = cls.students?.filter((s: any) => s.is_served === true).length || 0;
                const progress = total > 0 ? (completed / total) * 100 : 0;
                const status = getClassStatus(cls);
                
                return (
                  <div key={cls.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
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
                      onClick={() => onViewClass(cls.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No class data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
