import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Edit, 
  Save, 
  Users, 
  BookOpen,
  FileText,
  Clock,
  User,
  History,
  Search,
  Download
} from 'lucide-react';
import { downloadAuditReport } from '@/utils/auditReportPdfGenerator';
import { formatDistanceToNow } from 'date-fns';

interface AuditTrailEntry {
  timestamp: string;
  auditor_id: string;
  auditor_name: string;
  action: string;
  field: string;
  old_value: any;
  new_value: any;
  entity_type: 'order' | 'class' | 'student';
  entity_id: string;
  entity_name: string;
}

export default function AuditSessionPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const { profile } = useRoleBasedAuth();
  
  const [auditReport, setAuditReport] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('session');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // Search states
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('all');
  
  // Edit dialogs
  const [showEditSession, setShowEditSession] = useState(false);
  const [showEditClass, setShowEditClass] = useState(false);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  
  // Original submitted data (immutable snapshot)
  const [submittedData, setSubmittedData] = useState<any>(null);
  
  // Edit forms
  const [sessionForm, setSessionForm] = useState({
    total_garments: 0,
    total_dark_garments: 0,
    total_light_garments: 0,
    total_classes_to_serve: 0,
    total_students: 0
  });
  
  const [classForm, setClassForm] = useState({
    total_students_to_serve_in_class: 0
  });
  
  const [studentForm, setStudentForm] = useState({
    total_light_garment_count: 0,
    total_dark_garment_count: 0
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);

  // Filtered classes and students based on search
  const filteredClasses = useMemo(() => {
    if (!classSearchQuery.trim()) return classes;
    const query = classSearchQuery.toLowerCase();
    return classes.filter(cls => 
      cls.name?.toLowerCase().includes(query)
    );
  }, [classes, classSearchQuery]);

  const filteredStudents = useMemo(() => {
    let filtered = students;
    
    // First apply class filter
    if (studentClassFilter !== 'all') {
      filtered = filtered.filter(student => student.class_id === studentClassFilter);
    }
    
    // Then apply search
    if (studentSearchQuery.trim()) {
      const query = studentSearchQuery.toLowerCase();
      filtered = filtered.filter(student => {
        const studentClass = classes.find(c => c.id === student.class_id);
        return (
          student.full_name?.toLowerCase().includes(query) ||
          studentClass?.name?.toLowerCase().includes(query)
        );
      });
    }
    
    // Sort alphabetically by name
    return filtered.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  }, [students, studentSearchQuery, studentClassFilter, classes]);

  useEffect(() => {
    if (auditId) {
      fetchAuditData();
    }
  }, [auditId]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      
      // Fetch audit report
      const { data: report, error: reportError } = await supabase
        .from('audit_reports')
        .select('*')
        .eq('id', auditId)
        .single();

      if (reportError) throw reportError;
      setAuditReport(report);
      
      // Load existing audit trail
      const existingTrail = (report.report_details as any)?.audit_trail || [];
      setAuditTrail(existingTrail);
      
      // Load submitted_data snapshot if exists
      const existingSubmittedData = report.submitted_data;

      // Fetch order data using session_id (external_ref)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('external_ref', report.session_id)
        .single();

      if (orderError) throw orderError;
      setOrderData(order);

      // Fetch classes for this session
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('session_id', order.id)
        .order('name', { ascending: true });

      if (classesError) throw classesError;
      setClasses(classesData || []);

      // Fetch all students for this session
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('session_id', order.id)
        .order('full_name', { ascending: true });

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);
      
      // If no submitted_data exists, create snapshot from original submitted values
      if (!existingSubmittedData) {
        const snapshot = {
          session: {
            total_students: order.submitted_total_students || order.total_students,
            total_garments: order.submitted_total_garments || order.total_garments,
            total_dark_garments: order.submitted_total_dark_garments || order.total_dark_garments,
            total_light_garments: order.submitted_total_light_garments || order.total_light_garments,
            total_classes: order.submitted_total_classes || order.total_classes_to_serve
          },
          classes: (classesData || []).map(cls => ({
            id: cls.id,
            name: cls.name,
            submitted_students_count: cls.submitted_students_count || cls.total_students_to_serve_in_class
          })),
          students: (studentsData || []).map(student => ({
            id: student.id,
            full_name: student.full_name,
            class_id: student.class_id,
            submitted_light_garment_count: student.submitted_light_garment_count || student.total_light_garment_count,
            submitted_dark_garment_count: student.submitted_dark_garment_count || student.total_dark_garment_count
          }))
        };
        
        setSubmittedData(snapshot);
        
        // Save snapshot to database
        await supabase
          .from('audit_reports')
          .update({ submitted_data: snapshot })
          .eq('id', auditId);
      } else {
        setSubmittedData(existingSubmittedData);
      }
    } catch (error: any) {
      console.error('Error fetching audit data:', error);
      toast.error('Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  const addAuditTrailEntry = (
    action: string,
    field: string,
    oldValue: any,
    newValue: any,
    entityType: 'order' | 'class' | 'student',
    entityId: string,
    entityName: string
  ) => {
    const entry: AuditTrailEntry = {
      timestamp: new Date().toISOString(),
      auditor_id: profile?.id || '',
      auditor_name: profile?.full_name || 'Unknown',
      action,
      field,
      old_value: oldValue,
      new_value: newValue,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName
    };
    
    return entry;
  };

  const handleEditSessionClick = () => {
    if (orderData) {
      setSessionForm({
        total_garments: orderData.total_garments || 0,
        total_dark_garments: orderData.total_dark_garments || 0,
        total_light_garments: orderData.total_light_garments || 0,
        total_classes_to_serve: orderData.total_classes_to_serve || 0,
        total_students: orderData.total_students || 0
      });
      setShowEditSession(true);
    }
  };

  const handleSaveSession = async () => {
    if (!orderData) return;
    
    try {
      setIsSaving(true);
      
      const newEntries: AuditTrailEntry[] = [];
      
      // Track changes
      if (sessionForm.total_garments !== orderData.total_garments) {
        newEntries.push(addAuditTrailEntry('UPDATE', 'total_garments', orderData.total_garments, sessionForm.total_garments, 'order', orderData.id, orderData.external_ref));
      }
      if (sessionForm.total_dark_garments !== orderData.total_dark_garments) {
        newEntries.push(addAuditTrailEntry('UPDATE', 'total_dark_garments', orderData.total_dark_garments, sessionForm.total_dark_garments, 'order', orderData.id, orderData.external_ref));
      }
      if (sessionForm.total_light_garments !== orderData.total_light_garments) {
        newEntries.push(addAuditTrailEntry('UPDATE', 'total_light_garments', orderData.total_light_garments, sessionForm.total_light_garments, 'order', orderData.id, orderData.external_ref));
      }
      if (sessionForm.total_classes_to_serve !== orderData.total_classes_to_serve) {
        newEntries.push(addAuditTrailEntry('UPDATE', 'total_classes_to_serve', orderData.total_classes_to_serve, sessionForm.total_classes_to_serve, 'order', orderData.id, orderData.external_ref));
      }
      if (sessionForm.total_students !== orderData.total_students) {
        newEntries.push(addAuditTrailEntry('UPDATE', 'total_students', orderData.total_students, sessionForm.total_students, 'order', orderData.id, orderData.external_ref));
      }
      
      // Update orders table
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          total_garments: sessionForm.total_garments,
          total_dark_garments: sessionForm.total_dark_garments,
          total_light_garments: sessionForm.total_light_garments,
          total_classes_to_serve: sessionForm.total_classes_to_serve,
          total_students: sessionForm.total_students,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderData.id);

      if (updateError) throw updateError;
      
      // Update audit report with new trail entries
      const updatedTrail = [...auditTrail, ...newEntries];
      const { error: reportError } = await supabase
        .from('audit_reports')
        .update({
          report_details: { audit_trail: updatedTrail } as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', auditId);

      if (reportError) throw reportError;
      
      setAuditTrail(updatedTrail);
      toast.success('Session data updated successfully');
      setShowEditSession(false);
      fetchAuditData();
    } catch (error: any) {
      console.error('Error updating session:', error);
      toast.error(error.message || 'Failed to update session data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClassClick = (cls: any) => {
    setSelectedClass(cls);
    setClassForm({
      total_students_to_serve_in_class: cls.total_students_to_serve_in_class || 0
    });
    setShowEditClass(true);
  };

  const handleSaveClass = async () => {
    if (!selectedClass) return;
    
    try {
      setIsSaving(true);
      
      const newEntries: AuditTrailEntry[] = [];
      
      if (classForm.total_students_to_serve_in_class !== selectedClass.total_students_to_serve_in_class) {
        newEntries.push(addAuditTrailEntry(
          'UPDATE', 
          'total_students_to_serve_in_class', 
          selectedClass.total_students_to_serve_in_class, 
          classForm.total_students_to_serve_in_class, 
          'class', 
          selectedClass.id, 
          selectedClass.name
        ));
      }
      
      const { error: updateError } = await supabase
        .from('classes')
        .update({
          total_students_to_serve_in_class: classForm.total_students_to_serve_in_class,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedClass.id);

      if (updateError) throw updateError;
      
      const updatedTrail = [...auditTrail, ...newEntries];
      const { error: reportError } = await supabase
        .from('audit_reports')
        .update({
          report_details: { audit_trail: updatedTrail } as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', auditId);

      if (reportError) throw reportError;
      
      setAuditTrail(updatedTrail);
      toast.success('Class data updated successfully');
      setShowEditClass(false);
      setSelectedClass(null);
      fetchAuditData();
    } catch (error: any) {
      console.error('Error updating class:', error);
      toast.error(error.message || 'Failed to update class data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditStudentClick = (student: any) => {
    setSelectedStudent(student);
    setStudentForm({
      total_light_garment_count: student.total_light_garment_count || 0,
      total_dark_garment_count: student.total_dark_garment_count || 0
    });
    setShowEditStudent(true);
  };

  const handleSaveStudent = async () => {
    if (!selectedStudent) return;
    
    try {
      setIsSaving(true);
      
      const newEntries: AuditTrailEntry[] = [];
      
      if (studentForm.total_light_garment_count !== selectedStudent.total_light_garment_count) {
        newEntries.push(addAuditTrailEntry(
          'UPDATE', 
          'total_light_garment_count', 
          selectedStudent.total_light_garment_count, 
          studentForm.total_light_garment_count, 
          'student', 
          selectedStudent.id, 
          selectedStudent.full_name
        ));
      }
      if (studentForm.total_dark_garment_count !== selectedStudent.total_dark_garment_count) {
        newEntries.push(addAuditTrailEntry(
          'UPDATE', 
          'total_dark_garment_count', 
          selectedStudent.total_dark_garment_count, 
          studentForm.total_dark_garment_count, 
          'student', 
          selectedStudent.id, 
          selectedStudent.full_name
        ));
      }
      
      const { error: updateError } = await supabase
        .from('students')
        .update({
          total_light_garment_count: studentForm.total_light_garment_count,
          total_dark_garment_count: studentForm.total_dark_garment_count,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStudent.id);

      if (updateError) throw updateError;
      
      const updatedTrail = [...auditTrail, ...newEntries];
      
      // Update discrepancy tracking
      const hasDiscrepancy = newEntries.length > 0;
      const studentsWithDiscrepancies = auditReport?.students_with_discrepancies || 0;
      
      const { error: reportError } = await supabase
        .from('audit_reports')
        .update({
          report_details: { audit_trail: updatedTrail } as any,
          discrepancies_found: hasDiscrepancy || auditReport?.discrepancies_found,
          students_with_discrepancies: hasDiscrepancy ? studentsWithDiscrepancies + 1 : studentsWithDiscrepancies,
          total_students_audited: (auditReport?.total_students_audited || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', auditId);

      if (reportError) throw reportError;
      
      setAuditTrail(updatedTrail);
      toast.success('Student data updated successfully');
      setShowEditStudent(false);
      setSelectedStudent(null);
      fetchAuditData();
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast.error(error.message || 'Failed to update student data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteAudit = async () => {
    try {
      const { error } = await supabase
        .from('audit_reports')
        .update({
          status: 'COMPLETED',
          updated_at: new Date().toISOString()
        })
        .eq('id', auditId);

      if (error) throw error;
      
      toast.success('Audit completed successfully');
      navigate('/auditor');
    } catch (error: any) {
      console.error('Error completing audit:', error);
      toast.error(error.message || 'Failed to complete audit');
    }
  };

  const getStudentsForClass = (classId: string) => {
    return students.filter(s => s.class_id === classId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audit data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/auditor')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">Audit Session: {auditReport?.session_id}</h1>
                <p className="text-sm text-muted-foreground">
                  School: {orderData?.school_name} • Auditor: {profile?.full_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (auditReport && orderData) {
                    downloadAuditReport({
                      auditReport,
                      orderData,
                      auditorName: profile?.full_name || 'Unknown',
                      submittedData,
                      auditTrail,
                      classes,
                      students
                    });
                    toast.success('Audit report generated successfully!');
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline" onClick={() => setShowAuditTrail(true)}>
                <History className="w-4 h-4 mr-2" />
                Audit Trail ({auditTrail.length})
              </Button>
              <Badge variant={auditReport?.status === 'COMPLETED' ? 'default' : 'secondary'}>
                {auditReport?.status}
              </Badge>
              {auditReport?.status !== 'COMPLETED' && (
                <Button onClick={handleCompleteAudit}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Audit
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="session" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Session Overview
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Classes ({classes.length})
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              All Students ({students.length})
            </TabsTrigger>
          </TabsList>

          {/* Session Overview Tab */}
          <TabsContent value="session">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Submitted Data</CardTitle>
                    <CardDescription>Original data from school submission</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold">{submittedData?.session?.total_students || orderData?.submitted_total_students || orderData?.total_students || 0}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Garments</p>
                      <p className="text-2xl font-bold">{submittedData?.session?.total_garments || orderData?.submitted_total_garments || orderData?.total_garments || 0}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Light Garments</p>
                      <p className="text-2xl font-bold">{submittedData?.session?.total_light_garments || orderData?.submitted_total_light_garments || orderData?.total_light_garments || 0}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Dark Garments</p>
                      <p className="text-2xl font-bold">{submittedData?.session?.total_dark_garments || orderData?.submitted_total_dark_garments || orderData?.total_dark_garments || 0}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Classes</p>
                      <p className="text-2xl font-bold">{submittedData?.session?.total_classes || orderData?.submitted_total_classes || orderData?.total_classes_to_serve || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Collected Data (Audit)</CardTitle>
                    <CardDescription>Data collected during audit</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleEditSessionClick}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold">{orderData?.total_students || 0}</p>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm text-muted-foreground">Total Garments</p>
                      <p className="text-2xl font-bold">{orderData?.total_garments || 0}</p>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm text-muted-foreground">Light Garments</p>
                      <p className="text-2xl font-bold">{orderData?.total_light_garments || 0}</p>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm text-muted-foreground">Dark Garments</p>
                      <p className="text-2xl font-bold">{orderData?.total_dark_garments || 0}</p>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm text-muted-foreground">Total Classes</p>
                      <p className="text-2xl font-bold">{orderData?.total_classes_to_serve || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">School Name</p>
                    <p className="font-medium">{orderData?.school_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Headmaster</p>
                    <p className="font-medium">{orderData?.headmaster_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{orderData?.district}, {orderData?.region}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Session ID</p>
                    <p className="font-medium font-mono">{orderData?.external_ref}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>{orderData?.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{orderData?.created_at ? new Date(orderData.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <CardTitle>Classes in Session</CardTitle>
                    <CardDescription>Review and update class data</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search classes..."
                      value={classSearchQuery}
                      onChange={(e) => setClassSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Students (Submitted)</TableHead>
                      <TableHead>Students (Collected)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Discrepancy</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {classSearchQuery ? 'No classes match your search' : 'No classes found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClasses.map((cls, index) => {
                        const classStudents = getStudentsForClass(cls.id);
                        const submittedCount = classStudents.length;
                        const collectedCount = cls.total_students_to_serve_in_class || classStudents.length;
                        const hasDiscrepancy = submittedCount !== collectedCount;
                        
                        return (
                          <TableRow key={cls.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{cls.name}</TableCell>
                            <TableCell>{submittedCount}</TableCell>
                            <TableCell>{collectedCount}</TableCell>
                            <TableCell>
                              <Badge variant={cls.is_attended ? 'default' : 'secondary'}>
                                {cls.is_attended ? 'Attended' : 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {hasDiscrepancy ? (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Mismatch
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1 text-green-600">
                                  <CheckCircle className="w-3 h-3" />
                                  OK
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => handleEditClassClick(cls)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <CardTitle>All Students ({filteredStudents.length})</CardTitle>
                    <CardDescription>Review and update student garment counts - sorted alphabetically</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={studentClassFilter} onValueChange={setStudentClassFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Light (Submitted)</TableHead>
                      <TableHead>Light (Collected)</TableHead>
                      <TableHead>Dark (Submitted)</TableHead>
                      <TableHead>Dark (Collected)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          {studentSearchQuery ? 'No students match your search' : 'No students found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student, index) => {
                        const studentClass = classes.find(c => c.id === student.class_id);
                        // Get submitted data from snapshot
                        const submittedStudent = submittedData?.students?.find((s: any) => s.id === student.id);
                        const submittedLight = submittedStudent?.submitted_light_garment_count ?? student.submitted_light_garment_count ?? student.total_light_garment_count ?? 0;
                        const submittedDark = submittedStudent?.submitted_dark_garment_count ?? student.submitted_dark_garment_count ?? student.total_dark_garment_count ?? 0;
                        const hasDiscrepancy = (student.total_light_garment_count !== submittedLight) || (student.total_dark_garment_count !== submittedDark);
                        
                        return (
                          <TableRow key={student.id} className={hasDiscrepancy ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{student.full_name}</TableCell>
                            <TableCell>{studentClass?.name || 'N/A'}</TableCell>
                            <TableCell>{submittedLight}</TableCell>
                            <TableCell className={student.total_light_garment_count !== submittedLight ? 'text-orange-600 font-semibold' : ''}>
                              {student.total_light_garment_count || 0}
                            </TableCell>
                            <TableCell>{submittedDark}</TableCell>
                            <TableCell className={student.total_dark_garment_count !== submittedDark ? 'text-orange-600 font-semibold' : ''}>
                              {student.total_dark_garment_count || 0}
                            </TableCell>
                            <TableCell>
                              <Badge variant={student.is_served ? 'default' : 'secondary'}>
                                {student.is_served ? 'Served' : 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => handleEditStudentClick(student)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Session Dialog */}
      <Dialog open={showEditSession} onOpenChange={setShowEditSession}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Session Data (Collected)</DialogTitle>
            <DialogDescription>Enter the actual collected data from the printing site</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Total Students</Label>
              <Input
                type="number"
                value={sessionForm.total_students}
                onChange={(e) => setSessionForm({ ...sessionForm, total_students: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Total Classes</Label>
              <Input
                type="number"
                value={sessionForm.total_classes_to_serve}
                onChange={(e) => setSessionForm({ ...sessionForm, total_classes_to_serve: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Total Garments</Label>
              <Input
                type="number"
                value={sessionForm.total_garments}
                onChange={(e) => setSessionForm({ ...sessionForm, total_garments: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Light Garments</Label>
              <Input
                type="number"
                value={sessionForm.total_light_garments}
                onChange={(e) => setSessionForm({ ...sessionForm, total_light_garments: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Dark Garments</Label>
              <Input
                type="number"
                value={sessionForm.total_dark_garments}
                onChange={(e) => setSessionForm({ ...sessionForm, total_dark_garments: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditSession(false)}>Cancel</Button>
            <Button onClick={handleSaveSession} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={showEditClass} onOpenChange={setShowEditClass}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Class: {selectedClass?.name}</DialogTitle>
            <DialogDescription>Enter the actual collected data for this class</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Total Students in Class</Label>
              <Input
                type="number"
                value={classForm.total_students_to_serve_in_class}
                onChange={(e) => setClassForm({ ...classForm, total_students_to_serve_in_class: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditClass(false)}>Cancel</Button>
            <Button onClick={handleSaveClass} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={showEditStudent} onOpenChange={setShowEditStudent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Student: {selectedStudent?.full_name}</DialogTitle>
            <DialogDescription>Enter the actual collected garment counts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Light Garments Count</Label>
              <Input
                type="number"
                value={studentForm.total_light_garment_count}
                onChange={(e) => setStudentForm({ ...studentForm, total_light_garment_count: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Dark Garments Count</Label>
              <Input
                type="number"
                value={studentForm.total_dark_garment_count}
                onChange={(e) => setStudentForm({ ...studentForm, total_dark_garment_count: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditStudent(false)}>Cancel</Button>
            <Button onClick={handleSaveStudent} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Trail Dialog */}
      <Dialog open={showAuditTrail} onOpenChange={setShowAuditTrail}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Audit Trail
            </DialogTitle>
            <DialogDescription>Complete history of all changes made during this audit</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {auditTrail.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No changes recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditTrail.map((entry, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{entry.entity_type.toUpperCase()}</Badge>
                        <span className="font-medium">{entry.entity_name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Field:</span> <strong>{entry.field}</strong>
                    </p>
                    <p className="text-sm">
                      <span className="text-red-500">{entry.old_value}</span>
                      <span className="mx-2">→</span>
                      <span className="text-green-500">{entry.new_value}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      By: {entry.auditor_name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuditTrail(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}