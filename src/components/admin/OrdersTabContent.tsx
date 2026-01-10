import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { formatTZS } from '@/utils/pricing';
import { Eye, Search, ArrowUpDown, Users, Package, Clock, CheckCircle } from 'lucide-react';

interface Order {
  id: string;
  external_ref: string | null;
  school_name: string | null;
  total_students: number;
  total_amount: number | null;
  status: string;
  created_at: string;
  created_by_school: string;
  total_students_served_in_school: number;
  total_classes_served: number;
  total_classes_to_serve: number;
  session_data: any;
}

interface OrdersTabContentProps {
  orders: Order[];
  getStatusBadge: (status: string) => JSX.Element;
  formatCurrency: (amount: number) => string;
}

interface ClassProgress {
  id: string;
  name: string;
  is_attended: boolean;
  total_students_to_serve_in_class: number;
  total_students_served_in_class: number;
  students?: StudentProgress[];
}

interface StudentProgress {
  id: string;
  full_name: string;
  is_served: boolean;
  total_dark_garment_count: number;
  total_light_garment_count: number;
}

export function OrdersTabContent({ orders, getStatusBadge, formatCurrency }: OrdersTabContentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'school'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [classProgress, setClassProgress] = useState<ClassProgress[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  const statusOptions = [
    'all',
    'UNSUBMITTED',
    'SUBMITTED',
    'CONFIRMED',
    'AUTO_CONFIRMED',
    'QUEUED',
    'PICKUP',
    'ONGOING',
    'DONE',
    'PACKAGING',
    'DELIVERY',
    'COMPLETED',
    'ABORTED'
  ];

  const statusColors: { [key: string]: string } = {
    'UNSUBMITTED': 'bg-gray-500/20 text-gray-700 border-gray-500/30',
    'SUBMITTED': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
    'CONFIRMED': 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
    'AUTO_CONFIRMED': 'bg-teal-500/20 text-teal-700 border-teal-500/30',
    'QUEUED': 'bg-purple-500/20 text-purple-700 border-purple-500/30',
    'PICKUP': 'bg-indigo-500/20 text-indigo-700 border-indigo-500/30',
    'ONGOING': 'bg-orange-500/20 text-orange-700 border-orange-500/30',
    'DONE': 'bg-green-500/20 text-green-700 border-green-500/30',
    'PACKAGING': 'bg-cyan-500/20 text-cyan-700 border-cyan-500/30',
    'DELIVERY': 'bg-pink-500/20 text-pink-700 border-pink-500/30',
    'COMPLETED': 'bg-emerald-600/20 text-emerald-800 border-emerald-600/30',
    'ABORTED': 'bg-red-500/20 text-red-700 border-red-500/30'
  };

  const fetchOrderProgress = async (orderId: string) => {
    setIsLoadingProgress(true);
    try {
      // Fetch classes for this order
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('session_id', orderId)
        .order('name');

      if (classError) throw classError;
      
      // Fetch all students for this order to calculate served counts
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('session_id', orderId);
      
      if (studentsError) throw studentsError;
      
      // Attach students to their respective classes
      const classesWithStudents = (classes || []).map(cls => ({
        ...cls,
        students: (allStudents || []).filter(s => s.class_id === cls.id)
      }));
      
      setClassProgress(classesWithStudents);

      // If there are classes, fetch students for the first class
      if (classesWithStudents.length > 0) {
        setSelectedClass(classesWithStudents[0].id);
        setStudentProgress(classesWithStudents[0].students || []);
      }
    } catch (error) {
      console.error('Error fetching order progress:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    const cls = classProgress.find(c => c.id === classId);
    if (cls?.students) {
      setStudentProgress(cls.students);
    }
  };

  // Calculate students served by looping through students with is_served=TRUE
  const calculateStudentsServed = (classes: ClassProgress[]) => {
    return classes.reduce((total, cls) => {
      return total + (cls.students?.filter(s => s.is_served === true).length || 0);
    }, 0);
  };

  // Calculate classes completed by counting is_attended=TRUE
  const calculateClassesCompleted = (classes: ClassProgress[]) => {
    return classes.filter(cls => cls.is_attended === true).length;
  };

  const handleViewProgress = async (order: Order) => {
    setSelectedOrder(order);
    await fetchOrderProgress(order.id);
  };


  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.external_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'school':
          comparison = (a.school_name || '').localeCompare(b.school_name || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Group orders by status for summary
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const calculateProgress = (served: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((served / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-card border-border/50 hover-lift cursor-pointer" onClick={() => setStatusFilter('all')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">All Orders</p>
                <p className="text-2xl font-bold text-primary">{orders.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border/50 hover-lift cursor-pointer" onClick={() => setStatusFilter('ONGOING')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ongoing</p>
                <p className="text-2xl font-bold text-orange-500">{statusCounts['ONGOING'] || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 hover-lift cursor-pointer" onClick={() => setStatusFilter('QUEUED')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Queued</p>
                <p className="text-2xl font-bold text-purple-500">{statusCounts['QUEUED'] || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 hover-lift cursor-pointer" onClick={() => setStatusFilter('COMPLETED')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-emerald-500">{statusCounts['COMPLETED'] || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by school, order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="school">School</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold gradient-text">All Orders</CardTitle>
          <CardDescription>
            Showing {filteredOrders.length} of {orders.length} orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No orders found matching your criteria</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order, index) => (
                  <TableRow key={order.id} className="hover:bg-accent/50 transition-colors">
                    <TableCell className="font-bold text-muted-foreground">
                      {index + 1}.
                    </TableCell>
                    <TableCell className="font-medium font-mono">
                      {order.external_ref || order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.school_name || 'Unknown School'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.total_students || 0}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatTZS(order.total_amount || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status] || 'bg-muted'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant={order.status === 'ONGOING' ? 'outline' : 'ghost'} 
                            size="sm"
                            onClick={() => handleViewProgress(order)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            {order.status === 'ONGOING' ? 'Progress' : 'View'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              {order.status === 'ONGOING' ? 'Order Progress' : 'Order Details'} - {order.external_ref || order.id.slice(0, 8)}
                            </DialogTitle>
                            <DialogDescription>{order.school_name}</DialogDescription>
                          </DialogHeader>
                          
                          {isLoadingProgress ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {/* Overall Progress - Calculate from students/classes tables */}
                              <div className="p-4 bg-accent/20 rounded-lg">
                                <h4 className="font-medium mb-3">Overall Progress</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Students Served</span>
                                    <span>{calculateStudentsServed(classProgress)} / {order.total_students}</span>
                                  </div>
                                  <Progress 
                                    value={calculateProgress(calculateStudentsServed(classProgress), order.total_students)} 
                                    className="h-2"
                                  />
                                </div>
                                <div className="space-y-2 mt-3">
                                  <div className="flex justify-between text-sm">
                                    <span>Classes Completed</span>
                                    <span>{calculateClassesCompleted(classProgress)} / {order.total_classes_to_serve}</span>
                                  </div>
                                  <Progress 
                                    value={calculateProgress(calculateClassesCompleted(classProgress), order.total_classes_to_serve)} 
                                    className="h-2"
                                  />
                                </div>
                              </div>

                              {/* Class Progress with served count from students */}
                              <div>
                                <h4 className="font-medium mb-3">Class Progress</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {classProgress.map(cls => {
                                    const studentsServed = cls.students?.filter(s => s.is_served === true).length || 0;
                                    const totalStudents = cls.students?.length || cls.total_students_to_serve_in_class || 0;
                                    return (
                                      <Button
                                        key={cls.id}
                                        variant={selectedClass === cls.id ? 'default' : 'outline'}
                                        size="sm"
                                        className="justify-start"
                                        onClick={() => handleClassSelect(cls.id)}
                                      >
                                        <span className={`w-2 h-2 rounded-full mr-2 ${cls.is_attended ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                                        {cls.name}
                                        <span className="ml-auto text-xs opacity-70">
                                          {studentsServed}/{totalStudents}
                                        </span>
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Student Progress */}
                              {selectedClass && studentProgress.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-3">
                                    Students ({studentProgress.filter(s => s.is_served).length}/{studentProgress.length} served)
                                  </h4>
                                  <div className="max-h-[200px] overflow-y-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Name</TableHead>
                                          <TableHead>Dark</TableHead>
                                          <TableHead>Light</TableHead>
                                          <TableHead>Status</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {studentProgress.map(student => (
                                          <TableRow key={student.id}>
                                            <TableCell className="font-medium">{student.full_name}</TableCell>
                                            <TableCell>{student.total_dark_garment_count}</TableCell>
                                            <TableCell>{student.total_light_garment_count}</TableCell>
                                            <TableCell>
                                              <Badge className={student.is_served ? 'bg-emerald-500/20 text-emerald-700' : 'bg-yellow-500/20 text-yellow-700'}>
                                                {student.is_served ? 'Served' : 'Pending'}
                                              </Badge>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
