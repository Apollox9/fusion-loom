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
import { Search, CheckCircle, AlertTriangle, Send, FileText } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  total_dark_garment_count: number;
  total_light_garment_count: number;
  class_name: string;
}

interface Class {
  id: string;
  name: string;
  students: Student[];
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
}

interface AuditReport {
  id: string;
  session_id: string;
  total_students_audited: number;
  students_with_discrepancies: number;
  status: string;
}

export default function AuditingPage() {
  const { toast } = useToast();
  
  // Form states
  const [sessionId, setSessionId] = useState('');
  const [auditorId, setAuditorId] = useState('');
  
  // Session data
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  
  // Audit states
  const [currentClassIndex, setCurrentClassIndex] = useState(0);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [studentAudits, setStudentAudits] = useState<Map<string, StudentAudit>>(new Map());
  const [isAuditing, setIsAuditing] = useState(false);
  
  // Report states
  const [auditReports, setAuditReports] = useState<AuditReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Current student being audited
  const currentClass = sessionData?.classes[currentClassIndex];
  const currentStudent = currentClass?.students[currentStudentIndex];
  const currentAudit = currentStudent ? studentAudits.get(currentStudent.id) : null;

  // Progress calculation
  const totalStudents = sessionData?.classes.reduce((total, cls) => total + cls.students.length, 0) || 0;
  const auditedStudents = studentAudits.size;
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
      // For now, creating sample data structure
      const mockSessionData: SessionData = {
        school_id: 'sample-school-id',
        school_name: 'Sample Primary School',
        classes: [
          {
            id: 'class-1',
            name: 'Grade 1A',
            students: [
              { id: 'student-1', full_name: 'John Doe', total_dark_garment_count: 3, total_light_garment_count: 2, class_name: 'Grade 1A' },
              { id: 'student-2', full_name: 'Jane Smith', total_dark_garment_count: 2, total_light_garment_count: 3, class_name: 'Grade 1A' }
            ]
          },
          {
            id: 'class-2',
            name: 'Grade 1B',
            students: [
              { id: 'student-3', full_name: 'Bob Johnson', total_dark_garment_count: 4, total_light_garment_count: 1, class_name: 'Grade 1B' },
              { id: 'student-4', full_name: 'Alice Brown', total_dark_garment_count: 2, total_light_garment_count: 4, class_name: 'Grade 1B' }
            ]
          }
        ]
      };

      setSessionData(mockSessionData);
      setIsAuditing(true);
      setCurrentClassIndex(0);
      setCurrentStudentIndex(0);
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

  const auditStudent = (
    collectedDark: number,
    collectedLight: number,
    notes: string
  ) => {
    if (!currentStudent) return;

    const darkDiscrepancy = collectedDark - currentStudent.total_dark_garment_count;
    const lightDiscrepancy = collectedLight - currentStudent.total_light_garment_count;
    const hasDiscrepancy = darkDiscrepancy !== 0 || lightDiscrepancy !== 0;

    const audit: StudentAudit = {
      student_id: currentStudent.id,
      collected_dark_garments: collectedDark,
      collected_light_garments: collectedLight,
      auditor_notes: notes,
      has_discrepancy: hasDiscrepancy
    };

    setStudentAudits(new Map(studentAudits.set(currentStudent.id, audit)));

    // Move to next student
    if (currentStudentIndex < currentClass!.students.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1);
    } else if (currentClassIndex < sessionData!.classes.length - 1) {
      setCurrentClassIndex(currentClassIndex + 1);
      setCurrentStudentIndex(0);
    }

    toast({
      title: hasDiscrepancy ? 'Discrepancy Found' : 'Student Audited',
      description: hasDiscrepancy 
        ? `${currentStudent.full_name} has garment count discrepancies`
        : `${currentStudent.full_name} audit completed successfully`
    });
  };

  const submitAuditReport = async () => {
    if (!sessionData || studentAudits.size === 0) return;

    try {
      const discrepancyStudents = Array.from(studentAudits.values()).filter(audit => audit.has_discrepancy);
      
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
            summary: `Audit completed for ${sessionData.school_name}. ${discrepancyStudents.length} discrepancies found out of ${studentAudits.size} students audited.`
          },
          discrepancies_found: discrepancyStudents.length > 0,
          total_students_audited: studentAudits.size,
          students_with_discrepancies: discrepancyStudents.length,
          status: 'PENDING'
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Insert student audits
      const studentAuditRecords = Array.from(studentAudits.entries()).map(([studentId, audit]) => {
        const student = sessionData.classes
          .flatMap(cls => cls.students)
          .find(s => s.id === studentId)!;
        
        return {
          audit_report_id: reportData.id,
          student_id: studentId,
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
      });

      const { error: auditsError } = await supabase
        .from('student_audits')
        .insert(studentAuditRecords);

      if (auditsError) throw auditsError;

      toast({
        title: 'Audit Report Submitted',
        description: 'Report has been sent to admin for review'
      });

      // Reset state
      setIsAuditing(false);
      setSessionData(null);
      setStudentAudits(new Map());
      setSessionId('');
      setAuditorId('');
      
      // Reload reports
      loadAuditReports();
    } catch (error) {
      console.error('Error submitting audit report:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit audit report',
        variant: 'destructive'
      });
    }
  };

  if (!isAuditing) {
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
                Recent Audit Reports
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
                          {report.total_students_audited} students audited
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auditing Session: {sessionId}</h1>
          <p className="text-muted-foreground">School: {sessionData?.school_name}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsAuditing(false)}
        >
          Exit Audit
        </Button>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Audit Progress</span>
              <span>{auditedStudents}/{totalStudents} students</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {currentStudent ? (
        <AuditStudentForm 
          student={currentStudent}
          existingAudit={currentAudit}
          onAudit={auditStudent}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold">Audit Complete!</h3>
              <p className="text-muted-foreground">
                All {totalStudents} students have been audited
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={submitAuditReport} className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Submit Report to Admin
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Summary */}
      {studentAudits.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(studentAudits.entries()).map(([studentId, audit]) => {
                  const student = sessionData?.classes
                    .flatMap(cls => cls.students)
                    .find(s => s.id === studentId);
                  
                  return (
                    <TableRow key={studentId}>
                      <TableCell>{student?.full_name}</TableCell>
                      <TableCell>{student?.class_name}</TableCell>
                      <TableCell>
                        {student?.total_dark_garment_count}D / {student?.total_light_garment_count}L
                      </TableCell>
                      <TableCell>
                        {audit.collected_dark_garments}D / {audit.collected_light_garments}L
                      </TableCell>
                      <TableCell>
                        <Badge variant={audit.has_discrepancy ? 'destructive' : 'default'}>
                          {audit.has_discrepancy ? 'Discrepancy' : 'Match'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AuditStudentForm({ 
  student, 
  existingAudit, 
  onAudit 
}: { 
  student: Student; 
  existingAudit: StudentAudit | null;
  onAudit: (dark: number, light: number, notes: string) => void;
}) {
  const [collectedDark, setCollectedDark] = useState(existingAudit?.collected_dark_garments ?? student.total_dark_garment_count);
  const [collectedLight, setCollectedLight] = useState(existingAudit?.collected_light_garments ?? student.total_light_garment_count);
  const [notes, setNotes] = useState(existingAudit?.auditor_notes ?? '');

  const darkDiscrepancy = collectedDark - student.total_dark_garment_count;
  const lightDiscrepancy = collectedLight - student.total_light_garment_count;
  const hasDiscrepancy = darkDiscrepancy !== 0 || lightDiscrepancy !== 0;

  const handleSubmit = () => {
    onAudit(collectedDark, collectedLight, notes);
    // Reset for next student
    setCollectedDark(0);
    setCollectedLight(0);
    setNotes('');
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

        <Button 
          onClick={handleSubmit}
          disabled={hasDiscrepancy && !notes.trim()}
          className="w-full"
        >
          {hasDiscrepancy ? 'Record Discrepancy' : 'Confirm Audit'}
        </Button>
      </CardContent>
    </Card>
  );
}