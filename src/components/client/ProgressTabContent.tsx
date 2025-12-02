import React, { useState } from 'react';
import { SessionProgress } from './SessionProgress';
import { ClassProgress } from './ClassProgress';
import { StudentProgress } from './StudentProgress';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer } from 'lucide-react';

interface ProgressTabContentProps {
  sessions: any[];
}

type ViewLevel = 'session' | 'class' | 'student';

export const ProgressTabContent: React.FC<ProgressTabContentProps> = ({ sessions }) => {
  const [viewLevel, setViewLevel] = useState<ViewLevel>('session');
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Find the ONGOING order (already filtered in parent)
  const activeSession = sessions[0];

  const handleViewClass = (classId: string) => {
    const sessionData = selectedSession?.session_data || activeSession?.session_data;
    const classes = sessionData?.classes || [];
    const classData = classes.find((c: any, index: number) => (c.id || index.toString()) === classId) || classes[parseInt(classId)];
    
    if (classData) {
      setSelectedClass(classData);
      setViewLevel('class');
    }
  };

  const handleViewStudent = (studentId: string) => {
    const students = selectedClass?.students || [];
    const student = students.find((s: any, index: number) => (s.id || index.toString()) === studentId) || students[parseInt(studentId)];
    
    if (student) {
      setSelectedStudent(student);
      setViewLevel('student');
    }
  };

  const handleBackToSession = () => {
    setViewLevel('session');
    setSelectedClass(null);
    setSelectedStudent(null);
  };

  const handleBackToClass = () => {
    setViewLevel('class');
    setSelectedStudent(null);
  };

  if (!activeSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Print Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Printer className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No order in progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentSession = selectedSession || activeSession;

  return (
    <div className="space-y-6">
      {viewLevel === 'session' && (
        <SessionProgress 
          order={currentSession}
          onViewClass={handleViewClass}
        />
      )}

      {viewLevel === 'class' && selectedClass && (
        <ClassProgress
          classData={selectedClass}
          onBack={handleBackToSession}
          onViewStudent={handleViewStudent}
        />
      )}

      {viewLevel === 'student' && selectedStudent && selectedClass && (
        <StudentProgress
          student={selectedStudent}
          className={selectedClass.name}
          onBack={handleBackToClass}
        />
      )}
    </div>
  );
};
