import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, CheckCircle, AlertTriangle, Send, FileText, Save, Users, BookOpen, ArrowLeft } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  total_dark_garment_count: number;
  total_light_garment_count: number;
  class_name: string;
  audit_status?: 'not_audited' | 'matched' | 'discrepancy';
}

interface Class {
  id: string;
  name: string;
  students: Student[];
  audited_count: number;
  total_count: number;
}

interface SessionData {
  school_id: string;
  school_name: string;
  classes: Class[];
}

interface StudentAudit {
  student_id: string;
  collected_dark_garments: number;
  collected_light_garments: number;
  auditor_notes: string;
  has_discrepancy: boolean;
  is_published: boolean;
}

interface AuditReport {
  id: string;
  session_id: string;
  total_students_audited: number;
  students_with_discrepancies: number;
  status: string;
  created_at: string;
}

type AuditView = 'search' | 'classes' | 'class_detail' | 'student_audit';

export default function AuditingPage() {
  const { toast } = useToast();
  
  // Form states
  const [sessionId, setSessionId] = useState('');
  const [auditorId, setAuditorId] = useState('');
  
  // Session data
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  
  // Navigation states
  const [currentView, setCurrentView] = useState<AuditView>('search');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Search states
  const [classSearch, setClassSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  
  // Audit states
  const [studentAudits, setStudentAudits] = useState<Map<string, StudentAudit>>(new Map());
  const [currentAuditReportId, setCurrentAuditReportId] = useState<string | null>(null);
  
  // Report states
  const [auditReports, setAuditReports] = useState<AuditReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Progress calculations
  const totalStudents = sessionData?.classes.reduce((total, cls) => total + cls.students.length, 0) || 0;
  const auditedStudents = Array.from(studentAudits.values()).filter(audit => audit.is_published).length;
  const progress = totalStudents > 0 ? (auditedStudents / totalStudents) * 100 : 0;

  useEffect(() => {
    loadAuditReports();
  }, []);

  const loadAuditReports = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAuditReports(data || []);
    } catch (error) {
      console.error('Error loading audit reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const searchSession = async () => {
    if (!sessionId.trim() || !auditorId.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both Session ID and Auditor ID',
        variant: 'destructive'
      });
      return;
    }

    setLoadingSession(true);
    try {
      // Mock session data - in real implementation, fetch from orders table
      const mockSessionData: SessionData = {
        school_id: 'sample-school-id',
        school_name: 'Sample Primary School',
        classes: [
          {
            id: 'class-1',
            name: 'Grade 1A',
            audited_count: 0,
            total_count: 2,
            students: [
              { id: 'student-1', full_name: 'John Doe', total_dark_garment_count: 3, total_light_garment_count: 2, class_name: 'Grade 1A', audit_status: 'not_audited' },
              { id: 'student-2', full_name: 'Jane Smith', total_dark_garment_count: 2, total_light_garment_count: 3, class_name: 'Grade 1A', audit_status: 'not_audited' }
            ]
          },
          {
            id: 'class-2',
            name: 'Grade 1B',
            audited_count: 0,
            total_count: 2,
            students: [
              { id: 'student-3', full_name: 'Bob Johnson', total_dark_garment_count: 4, total_light_garment_count: 1, class_name: 'Grade 1B', audit_status: 'not_audited' },
              { id: 'student-4', full_name: 'Alice Brown', total_dark_garment_count: 2, total_light_garment_count: 4, class_name: 'Grade 1B', audit_status: 'not_audited' }
            ]
          }
        ]
      };

      setSessionData(mockSessionData);
      setCurrentView('classes');
      setStudentAudits(new Map());

      toast({
        title: 'Session Found',
        description: `Loaded session for ${mockSessionData.school_name}`
      });
    } catch (error) {
      console.error('Error searching session:', error);
      toast({
        title: 'Error',
        description: 'Failed to load session data',
        variant: 'destructive'
      });
    } finally {
      setLoadingSession(false);
    }
  };

  const saveStudentAudit = (
    collectedDark: number,
    collectedLight: number,
    notes: string
  ) => {
    if (!selectedStudent) return;

    const darkDiscrepancy = collectedDark - selectedStudent.total_dark_garment_count;
    const lightDiscrepancy = collectedLight - selectedStudent.total_light_garment_count;
    const hasDiscrepancy = darkDiscrepancy !== 0 || lightDiscrepancy !== 0;

    const audit: StudentAudit = {
      student_id: selectedStudent.id,
      collected_dark_garments: collectedDark,
      collected_light_garments: collectedLight,
      auditor_notes: notes,
      has_discrepancy: hasDiscrepancy,
      is_published: false
    };

    setStudentAudits(new Map(studentAudits.set(selectedStudent.id, audit)));

    toast({
      title: 'Audit Saved',
      description: `${selectedStudent.full_name} audit saved as draft`
    });
  };

  const generateDiscrepancyMessage = (
    collectedDark: number,
    collectedLight: number,
    submittedDark: number,
    submittedLight: number
  ): string => {
    const messages: string[] = [];
    
    // Check dark garments
    if (collectedDark === 0 && submittedDark > 0) {
      messages.push("No dark garments collected at all");
    } else if (collectedDark > submittedDark) {
      messages.push("Collected dark garments exceed the number of submitted ones");
    } else if (collectedDark < submittedDark) {
      messages.push("Collected dark garments are fewer than the number of submitted ones");
    }
    
    // Check light garments
    if (collectedLight === 0 && submittedLight > 0) {
      messages.push("No light garments collected at all");
    } else if (collectedLight > submittedLight) {
      messages.push("Collected light garments exceed the number of submitted ones");
    } else if (collectedLight < submittedLight) {
      messages.push("Collected light garments are fewer than the number of submitted ones");
    }
    
    // Check if no garments collected at all
    if (collectedDark === 0 && collectedLight === 0 && (submittedDark > 0 || submittedLight > 0)) {
      return "No garments collected at all";
    }
    
    return messages.join(". ");
  };

  const updateStudentProductionData = async (audit: StudentAudit) => {
    if (!selectedStudent) return;

    try {
      // Update the student record with audited garment counts
      const { error } = await supabase
        .from('students')
        .update({
          total_dark_garment_count: audit.collected_dark_garments,
          total_light_garment_count: audit.collected_light_garments,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStudent.id);

      if (error) {
        console.error('Error updating student production data:', error);
        toast({
          title: 'Warning',
          description: 'Audit saved but production data update failed',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating student production data:', error);
    }
  };

  const publishStudentAudit = async (
    collectedDark: number,
    collectedLight: number,
    notes: string
  ) => {
    if (!selectedStudent) return;

    const darkDiscrepancy = collectedDark - selectedStudent.total_dark_garment_count;
    const lightDiscrepancy = collectedLight - selectedStudent.total_light_garment_count;
    const hasDiscrepancy = darkDiscrepancy !== 0 || lightDiscrepancy !== 0;

    // Generate automatic discrepancy message if there's a discrepancy
    let finalNotes = notes;
    if (hasDiscrepancy) {
      const discrepancyMessage = generateDiscrepancyMessage(
        collectedDark,
        collectedLight,
        selectedStudent.total_dark_garment_count,
        selectedStudent.total_light_garment_count
      );
      finalNotes = notes ? `${notes}. ${discrepancyMessage}` : discrepancyMessage;
    }

    const audit: StudentAudit = {
      student_id: selectedStudent.id,
      collected_dark_garments: collectedDark,
      collected_light_garments: collectedLight,
      auditor_notes: finalNotes,
      has_discrepancy: hasDiscrepancy,
      is_published: true
    };

    setStudentAudits(new Map(studentAudits.set(selectedStudent.id, audit)));

    // Update student production data with audited values
    await updateStudentProductionData(audit);

    // Update session data with audit status
    if (sessionData && selectedClass) {
      const updatedClasses = sessionData.classes.map(cls => {
        if (cls.id === selectedClass.id) {
          const updatedStudents = cls.students.map(student => {
            if (student.id === selectedStudent.id) {
              return { 
                ...student, 
                audit_status: hasDiscrepancy ? 'discrepancy' as const : 'matched' as const 
              };
            }
            return student;
          });
          const auditedCount = updatedStudents.filter(s => s.audit_status !== 'not_audited').length;
          return { ...cls, students: updatedStudents, audited_count: auditedCount };
        }
        return cls;
      });
      setSessionData({ ...sessionData, classes: updatedClasses });
      setSelectedClass(prev => prev ? { ...prev, audited_count: prev.audited_count + (selectedStudent.audit_status === 'not_audited' ? 1 : 0) } : null);
    }

    // Create or update audit report
    await createOrUpdateAuditReport(audit);

    toast({
      title: hasDiscrepancy ? 'Discrepancy Published' : 'Audit Published',
      description: `${selectedStudent.full_name} audit sent to admin`
    });

    setCurrentView('class_detail');
  };

  const createOrUpdateAuditReport = async (audit: StudentAudit) => {
    if (!sessionData || !selectedStudent) return;

    try {
      const publishedAudits = Array.from(studentAudits.values()).filter(a => a.is_published);
      const discrepancyStudents = publishedAudits.filter(a => a.has_discrepancy);

      if (currentAuditReportId) {
        // Update existing report
        const { error: reportError } = await supabase
          .from('audit_reports')
          .update({
            total_students_audited: publishedAudits.length,
            students_with_discrepancies: discrepancyStudents.length,
            discrepancies_found: discrepancyStudents.length > 0,
            report_details: {
              school_name: sessionData.school_name,
              auditor_id: auditorId,
              session_id: sessionId,
              summary: `Audit in progress for ${sessionData.school_name}. ${discrepancyStudents.length} discrepancies found out of ${publishedAudits.length} students audited.`
            }
          })
          .eq('id', currentAuditReportId);

        if (reportError) throw reportError;
      } else {
        // Create new report
        const { data: reportData, error: reportError } = await supabase
          .from('audit_reports')
          .insert({
            session_id: sessionId,
            auditor_id: auditorId,
            auditor_user_id: (await supabase.auth.getUser()).data.user?.id,
            school_id: sessionData.school_id,
            report_details: {
              school_name: sessionData.school_name,
              auditor_id: auditorId,
              session_id: sessionId,
              summary: `Audit started for ${sessionData.school_name}. ${discrepancyStudents.length} discrepancies found out of ${publishedAudits.length} students audited.`
            },
            discrepancies_found: discrepancyStudents.length > 0,
            total_students_audited: publishedAudits.length,
            students_with_discrepancies: discrepancyStudents.length,
            status: 'PENDING'
          })
          .select()
          .single();

        if (reportError) throw reportError;
        setCurrentAuditReportId(reportData.id);
      }

      // Insert/update student audit record
      const student = sessionData.classes
        .flatMap(cls => cls.students)
        .find(s => s.id === selectedStudent.id)!;

      const studentAuditRecord = {
        audit_report_id: currentAuditReportId,
        student_id: selectedStudent.id,
        student_name: student.full_name,
        class_name: student.class_name,
        submitted_dark_garments: student.total_dark_garment_count,
        submitted_light_garments: student.total_light_garment_count,
        collected_dark_garments: audit.collected_dark_garments,
        collected_light_garments: audit.collected_light_garments,
        dark_garments_discrepancy: audit.collected_dark_garments - student.total_dark_garment_count,
        light_garments_discrepancy: audit.collected_light_garments - student.total_light_garment_count,
        has_discrepancy: audit.has_discrepancy,
        auditor_notes: audit.auditor_notes
      };

      const { error: auditError } = await supabase
        .from('student_audits')
        .upsert(studentAuditRecord, { onConflict: 'student_id,audit_report_id' });

      if (auditError) throw auditError;

    } catch (error) {
      console.error('Error creating/updating audit report:', error);
      toast({
        title: 'Error',
        description: 'Failed to save audit record',
        variant: 'destructive'
      });
    }
  };

  const saveAndExitAudit = () => {
    setCurrentView('search');
    setSessionData(null);
    setStudentAudits(new Map());
    setSessionId('');
    setAuditorId('');
    setCurrentAuditReportId(null);
    
    toast({
      title: 'Audit Session Saved',
      description: 'Your progress has been saved. You can resume later.'
    });
    
    loadAuditReports();
  };

  // Filter functions
  const filteredClasses = sessionData?.classes.filter(cls => 
    cls.name.toLowerCase().includes(classSearch.toLowerCase())
  ) || [];

  const filteredStudents = selectedClass?.students.filter(student =>
    student.full_name.toLowerCase().includes(studentSearch.toLowerCase())
  ) || [];

  if (currentView === 'search') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Session Auditing</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Session */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Start New Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionId">Session ID</Label>
                <Input
                  id="sessionId"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Enter session ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auditorId">Auditor ID</Label>
                <Input
                  id="auditorId"
                  value={auditorId}
                  onChange={(e) => setAuditorId(e.target.value)}
                  placeholder="Enter your auditor ID"
                />
              </div>
              <Button 
                onClick={searchSession} 
                disabled={loadingSession}
                className="w-full"
              >
                {loadingSession ? 'Searching...' : 'Start Audit'}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Recent Audit Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReports ? (
                <div className="text-center py-4">Loading reports...</div>
              ) : auditReports.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No audit reports found
                </div>
              ) : (
                <div className="space-y-2">
                  {auditReports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Session: {report.session_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {report.total_students_audited} students audited • {new Date(report.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={report.students_with_discrepancies > 0 ? 'destructive' : 'default'}>
                        {report.students_with_discrepancies} discrepancies
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentView === 'classes') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Audit: {sessionData?.school_name}</h1>
            <p className="text-muted-foreground">Session: {sessionId} • Auditor: {auditorId}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveAndExitAudit}>
              <Save className="h-4 w-4 mr-2" />
              Save & Exit
            </Button>
          </div>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{auditedStudents}/{totalStudents} students audited</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Class Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              placeholder="Search classes by name..."
              className="mb-4"
            />
          </CardContent>
        </Card>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedClass(cls);
                    setCurrentView('class_detail');
                  }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {cls.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{cls.audited_count}/{cls.total_count} students</span>
                  </div>
                  <Progress value={(cls.audited_count / cls.total_count) * 100} className="h-2" />
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline">
                      {cls.total_count} total
                    </Badge>
                    <Badge variant="secondary">
                      {cls.audited_count} audited
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (currentView === 'class_detail') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setCurrentView('classes')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Classes
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{selectedClass?.name}</h1>
              <p className="text-muted-foreground">{sessionData?.school_name} • Session: {sessionId}</p>
            </div>
          </div>
          <Button variant="outline" onClick={saveAndExitAudit}>
            <Save className="h-4 w-4 mr-2" />
            Save & Exit
          </Button>
        </div>

        {/* Class Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Class Progress</span>
                <span>{selectedClass?.audited_count}/{selectedClass?.total_count} students audited</span>
              </div>
              <Progress value={selectedClass ? (selectedClass.audited_count / selectedClass.total_count) * 100 : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Student Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search students by name..."
            />
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Submitted Garments</TableHead>
                  <TableHead>Audit Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell>
                      {student.total_dark_garment_count}D / {student.total_light_garment_count}L
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        student.audit_status === 'not_audited' ? 'outline' :
                        student.audit_status === 'matched' ? 'default' : 'destructive'
                      }>
                        {student.audit_status === 'not_audited' ? 'Not Audited' :
                         student.audit_status === 'matched' ? 'Matched' : 'Discrepancy'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedStudent(student);
                          setCurrentView('student_audit');
                        }}
                      >
                        {student.audit_status === 'not_audited' ? 'Audit' : 'Re-audit'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === 'student_audit') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setCurrentView('class_detail')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {selectedClass?.name}
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Auditing: {selectedStudent?.full_name}</h1>
              <p className="text-muted-foreground">{selectedClass?.name} • {sessionData?.school_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveAndExitAudit}>
              <Save className="h-4 w-4 mr-2" />
              Save & Exit
            </Button>
          </div>
        </div>

        {selectedStudent && (
          <AuditStudentForm 
            student={selectedStudent}
            existingAudit={studentAudits.get(selectedStudent.id) || null}
            onSave={saveStudentAudit}
            onPublish={publishStudentAudit}
          />
        )}
      </div>
    );
  }

  return null;
}

function AuditStudentForm({ 
  student, 
  existingAudit, 
  onSave,
  onPublish 
}: { 
  student: Student; 
  existingAudit: StudentAudit | null;
  onSave: (dark: number, light: number, notes: string) => void;
  onPublish: (dark: number, light: number, notes: string) => void;
}) {
  const [collectedDark, setCollectedDark] = useState(existingAudit?.collected_dark_garments ?? student.total_dark_garment_count);
  const [collectedLight, setCollectedLight] = useState(existingAudit?.collected_light_garments ?? student.total_light_garment_count);
  const [notes, setNotes] = useState(existingAudit?.auditor_notes ?? '');

  const darkDiscrepancy = collectedDark - student.total_dark_garment_count;
  const lightDiscrepancy = collectedLight - student.total_light_garment_count;
  const hasDiscrepancy = darkDiscrepancy !== 0 || lightDiscrepancy !== 0;

  const handleSave = () => {
    onSave(collectedDark, collectedLight, notes);
  };

  const handlePublish = () => {
    onPublish(collectedDark, collectedLight, notes);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Auditing: {student.full_name}
        </CardTitle>
        <p className="text-muted-foreground">Class: {student.class_name}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Submitted Garments */}
          <div className="space-y-4">
            <h4 className="font-semibold">Submitted Garments</h4>
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-muted rounded-lg">
                <span>Dark Garments:</span>
                <span className="font-semibold">{student.total_dark_garment_count}</span>
              </div>
              <div className="flex justify-between p-3 bg-muted rounded-lg">
                <span>Light Garments:</span>
                <span className="font-semibold">{student.total_light_garment_count}</span>
              </div>
            </div>
          </div>

          {/* Collected Garments */}
          <div className="space-y-4">
            <h4 className="font-semibold">Collected Garments</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collectedDark">Dark Garments Collected</Label>
                <Input
                  id="collectedDark"
                  type="number"
                  value={collectedDark}
                  onChange={(e) => setCollectedDark(parseInt(e.target.value) || 0)}
                  min="0"
                />
                {darkDiscrepancy !== 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className={darkDiscrepancy > 0 ? 'text-red-600' : 'text-blue-600'}>
                      {darkDiscrepancy > 0 ? '+' : ''}{darkDiscrepancy} from submitted
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="collectedLight">Light Garments Collected</Label>
                <Input
                  id="collectedLight"
                  type="number"
                  value={collectedLight}
                  onChange={(e) => setCollectedLight(parseInt(e.target.value) || 0)}
                  min="0"
                />
                {lightDiscrepancy !== 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className={lightDiscrepancy > 0 ? 'text-red-600' : 'text-blue-600'}>
                      {lightDiscrepancy > 0 ? '+' : ''}{lightDiscrepancy} from submitted
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Discrepancy Alert */}
        {hasDiscrepancy && (
          <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Discrepancy Detected</span>
            </div>
            <p className="text-amber-700 mt-1">
              The collected garment counts don't match the submitted counts. Please add notes below.
            </p>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Auditor Notes {hasDiscrepancy && <span className="text-red-500">*</span>}</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={hasDiscrepancy 
              ? "Please explain the discrepancy..." 
              : "Optional notes about this audit..."
            }
            rows={3}
          />
        </div>

        <div className="flex gap-4">
          <Button 
            variant="outline"
            onClick={handleSave}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={handlePublish}
            disabled={hasDiscrepancy && !notes.trim()}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            Publish to Admin
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}