import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Users } from 'lucide-react';

interface StudentData {
  id: string;
  student_id: string | null;
  full_name: string;
  class_id: string;
  total_light_garment_count: number;
  total_dark_garment_count: number;
  printed_light_garment_count: number;
  printed_dark_garment_count: number;
  light_garments_printed: boolean;
  dark_garments_printed: boolean;
  is_served: boolean;
  created_at: string;
  updated_at: string;
}

interface ClassData {
  id: string;
  name: string;
  is_attended: boolean;
  total_students_served_in_class: number;
  total_students_to_serve_in_class: number;
  students: StudentData[];
}

interface ClassProgressProps {
  classData: ClassData;
  onBack: () => void;
  onViewStudent: (studentId: string) => void;
}

export const ClassProgress: React.FC<ClassProgressProps> = ({ classData, onBack, onViewStudent }) => {
  const students = classData.students || [];
  
  // Count students with is_served=TRUE from the students array
  const totalStudents = classData.total_students_to_serve_in_class || students.length;
  const printedStudents = students.filter((s) => s.is_served === true).length;
  const progress = totalStudents > 0 ? (printedStudents / totalStudents) * 100 : 0;
  
  const getStudentPhase = (student: StudentData) => {
    if (student.is_served) return 'Completed';
    if (student.light_garments_printed && student.dark_garments_printed) return 'Packaging';
    if (student.printed_light_garment_count > 0 || student.printed_dark_garment_count > 0) return 'Printing';
    return 'Waiting';
  };
  
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'Completed': return 'bg-green-500/20 text-green-800 dark:text-green-300';
      case 'Packaging': return 'bg-blue-500/20 text-blue-800 dark:text-blue-300';
      case 'Printing': return 'bg-purple-500/20 text-purple-800 dark:text-purple-300';
      default: return 'bg-gray-500/20 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Session
        </Button>
      </div>

      {/* Class Info Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {classData.name}
          </CardTitle>
          <CardDescription>
            Class Progress Overview 
            {classData.is_attended && <Badge className="ml-2 bg-green-500/20 text-green-800">Active</Badge>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{totalStudents}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Printed</p>
              <p className="text-2xl font-bold text-green-600">{printedStudents}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold text-orange-600">{totalStudents - printedStudents}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold text-primary">{progress.toFixed(0)}%</p>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Class Progress</span>
              <span className="text-sm text-muted-foreground">{printedStudents} of {totalStudents}</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Student List - from students table */}
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>Click on a student to view detailed progress</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <div className="space-y-3">
              {students.map((student) => {
                const phase = getStudentPhase(student);
                const totalGarments = (student.total_light_garment_count || 0) + (student.total_dark_garment_count || 0);
                const printedGarments = (student.printed_light_garment_count || 0) + (student.printed_dark_garment_count || 0);
                const studentProgress = totalGarments > 0 ? (printedGarments / totalGarments) * 100 : 0;
                
                return (
                  <div key={student.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{student.full_name}</h4>
                        <Badge className={getPhaseColor(phase)}>
                          {phase}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>{printedGarments} / {totalGarments} garments</span>
                        <span>{studentProgress.toFixed(0)}% complete</span>
                      </div>
                      <Progress value={studentProgress} className="h-2" />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewStudent(student.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No student data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
