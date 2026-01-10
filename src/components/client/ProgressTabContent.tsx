import React, { useState, useEffect } from 'react';
import { SessionProgress } from './SessionProgress';
import { ClassProgress } from './ClassProgress';
import { StudentProgress } from './StudentProgress';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProgressTabContentProps {
  sessions: any[];
}

type ViewLevel = 'session' | 'class' | 'student';

interface ClassData {
  id: string;
  class_id: string | null;
  name: string;
  is_attended: boolean;
  total_students_served_in_class: number;
  total_students_to_serve_in_class: number;
  session_id: string | null;
  order_id: string | null;
  students: StudentData[];
}

interface StudentData {
  id: string;
  student_id: string | null;
  full_name: string;
  class_id: string;
  session_id: string | null;
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

export const ProgressTabContent: React.FC<ProgressTabContentProps> = ({ sessions }) => {
  const { toast } = useToast();
  const [viewLevel, setViewLevel] = useState<ViewLevel>('session');
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  
  // State for real-time data
  const [orderData, setOrderData] = useState<any>(null);
  const [classesData, setClassesData] = useState<ClassData[]>([]);
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  // Find the ONGOING order
  const activeSession = sessions[0];

  // Fetch data from correct tables
  const fetchProgressData = async () => {
    if (!activeSession?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch order data (for current_class_name, current_student_name, totals)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', activeSession.id)
        .single();

      if (orderError) throw orderError;
      setOrderData(order);

      // Fetch classes linked to this session/order
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .or(`session_id.eq.${activeSession.id},order_id.eq.${activeSession.id}`)
        .order('name', { ascending: true });

      if (classesError) throw classesError;

      // Fetch students linked to this session
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('session_id', activeSession.id)
        .order('full_name', { ascending: true });

      if (studentsError) throw studentsError;

      // Combine classes with their students
      const classesWithStudents: ClassData[] = (classes || []).map((cls: any) => ({
        ...cls,
        students: (students || []).filter((s: any) => s.class_id === cls.id)
      }));

      setClassesData(classesWithStudents);
      setStudentsData(students || []);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch progress data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProgressData();
  }, [activeSession?.id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!activeSession?.id) return;

    // Subscribe to orders table changes
    const ordersChannel = supabase
      .channel('orders-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${activeSession.id}`
        },
        (payload) => {
          console.log('Order updated:', payload);
          if (payload.new) {
            setOrderData(payload.new);
          }
        }
      )
      .subscribe();

    // Subscribe to classes table changes
    const classesChannel = supabase
      .channel('classes-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes'
        },
        (payload) => {
          console.log('Class updated:', payload);
          fetchProgressData(); // Refetch to get updated data with students
        }
      )
      .subscribe();

    // Subscribe to students table changes
    const studentsChannel = supabase
      .channel('students-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students'
        },
        (payload) => {
          console.log('Student updated:', payload);
          fetchProgressData(); // Refetch to update all related data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(classesChannel);
      supabase.removeChannel(studentsChannel);
    };
  }, [activeSession?.id]);

  const handleViewClass = (classId: string) => {
    const classData = classesData.find((c) => c.id === classId);
    
    if (classData) {
      setSelectedClass(classData);
      setViewLevel('class');
    }
  };

  const handleViewStudent = (studentId: string) => {
    const student = selectedClass?.students?.find((s) => s.id === studentId);
    
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Print Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Printer className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
            <p className="text-muted-foreground">Loading progress data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {viewLevel === 'session' && (
        <SessionProgress 
          order={orderData || activeSession}
          classes={classesData}
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
