import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Calendar,
  Plus,
  Star,
  Timer,
  Target,
  Award,
  XCircle,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInHours } from 'date-fns';

interface StaffMember {
  id: string;
  user_id: string | null;
  staff_id: string;
  full_name: string;
  email: string;
  role: string;
  phone_number: string | null;
  sessions_hosted: number;
  created_at: string;
}

interface Task {
  id: string;
  staff_user_id: string;
  type: string;
  status: string;
  target_id: string | null;
  assigned_at: string;
  expected_at: string | null;
  completed_at: string | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

interface Metric {
  id: string;
  staff_user_id: string;
  period_start: string;
  period_end: string;
  tasks_assigned: number;
  tasks_completed: number;
  efficiency_score: number | null;
  avg_completion_time_seconds: number | null;
  created_at: string;
}

interface StaffDetailSheetProps {
  staff: StaffMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

const TASK_TYPES = [
  { value: 'SESSION_HOSTING', label: 'Session Hosting', description: 'Host a printing session for a school' },
  { value: 'AUDIT', label: 'Audit', description: 'Audit a completed session' },
  { value: 'EQUIPMENT_CHECK', label: 'Equipment Check', description: 'Inspect and maintain equipment' },
  { value: 'DELIVERY', label: 'Delivery', description: 'Deliver completed orders' },
  { value: 'QUALITY_CONTROL', label: 'Quality Control', description: 'Review print quality' },
  { value: 'CUSTOMER_SUPPORT', label: 'Customer Support', description: 'Handle customer inquiries' },
  { value: 'TRAINING', label: 'Training', description: 'Training or onboarding activities' },
  { value: 'MAINTENANCE', label: 'Maintenance', description: 'General maintenance tasks' },
  { value: 'OTHER', label: 'Other', description: 'Miscellaneous tasks' }
];

export function StaffDetailSheet({ staff, open, onOpenChange, onRefresh }: StaffDetailSheetProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState('tasks');
  
  // New task form
  const [newTask, setNewTask] = useState({
    type: 'SESSION_HOSTING',
    expectedAt: '',
    notes: ''
  });
  
  // Rating form
  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    feedback: ''
  });

  useEffect(() => {
    if (staff?.user_id && open) {
      fetchStaffData();
    }
  }, [staff?.user_id, open]);

  const fetchStaffData = async () => {
    if (!staff?.user_id) return;
    
    try {
      setLoading(true);
      
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('staff_tasks')
        .select('*')
        .eq('staff_user_id', staff.user_id)
        .order('assigned_at', { ascending: false });
      
      if (tasksError) throw tasksError;
      setTasks(tasksData || []);
      
      // Fetch metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('staff_metrics')
        .select('*')
        .eq('staff_user_id', staff.user_id)
        .order('period_start', { ascending: false })
        .limit(30);
      
      if (metricsError) throw metricsError;
      setMetrics(metricsData || []);
    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async () => {
    if (!staff?.user_id) {
      toast.error('Staff member has no associated user account');
      return;
    }
    
    try {
      setIsCreatingTask(true);
      
      const { error } = await supabase
        .from('staff_tasks')
        .insert({
          staff_user_id: staff.user_id,
          type: newTask.type,
          status: 'PENDING',
          expected_at: newTask.expectedAt ? new Date(newTask.expectedAt).toISOString() : null,
          feedback: newTask.notes || null
        });
      
      if (error) throw error;
      
      toast.success('Task assigned successfully');
      setShowAddTask(false);
      setNewTask({ type: 'SESSION_HOSTING', expectedAt: '', notes: '' });
      fetchStaffData();
    } catch (error: any) {
      console.error('Error assigning task:', error);
      toast.error(error.message || 'Failed to assign task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'COMPLETED') {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('staff_tasks')
        .update(updateData)
        .eq('id', taskId);
      
      if (error) throw error;
      
      toast.success(`Task marked as ${newStatus.toLowerCase()}`);
      fetchStaffData();
      
      // If marking as completed, show rating dialog
      if (newStatus === 'COMPLETED') {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          setSelectedTask(task);
          setShowRatingDialog(true);
        }
      }
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(error.message || 'Failed to update task');
    }
  };

  const handleRateTask = async () => {
    if (!selectedTask) return;
    
    try {
      const { error } = await supabase
        .from('staff_tasks')
        .update({
          rating: ratingForm.rating,
          feedback: ratingForm.feedback || selectedTask.feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTask.id);
      
      if (error) throw error;
      
      toast.success('Task rated successfully');
      setShowRatingDialog(false);
      setSelectedTask(null);
      setRatingForm({ rating: 5, feedback: '' });
      fetchStaffData();
    } catch (error: any) {
      console.error('Error rating task:', error);
      toast.error(error.message || 'Failed to rate task');
    }
  };

  // Calculate real-time metrics
  const calculateMetrics = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter(t => t.status === 'PENDING').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const cancelledTasks = tasks.filter(t => t.status === 'CANCELLED').length;
    
    // Calculate average completion time
    const completedWithTime = tasks.filter(t => t.completed_at && t.assigned_at && t.status === 'COMPLETED');
    let avgCompletionHours = 0;
    if (completedWithTime.length > 0) {
      const totalHours = completedWithTime.reduce((sum, t) => {
        return sum + differenceInHours(new Date(t.completed_at!), new Date(t.assigned_at));
      }, 0);
      avgCompletionHours = Math.round(totalHours / completedWithTime.length);
    }
    
    // Calculate efficiency score (completed / assigned)
    const efficiencyScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Calculate average rating
    const ratedTasks = tasks.filter(t => t.rating !== null);
    const avgRating = ratedTasks.length > 0 
      ? (ratedTasks.reduce((sum, t) => sum + (t.rating || 0), 0) / ratedTasks.length).toFixed(1) 
      : 'N/A';
    
    // Overdue tasks
    const overdueTasks = tasks.filter(t => 
      t.expected_at && 
      new Date(t.expected_at) < new Date() && 
      t.status !== 'COMPLETED' && 
      t.status !== 'CANCELLED'
    ).length;
    
    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      cancelledTasks,
      avgCompletionHours,
      efficiencyScore,
      avgRating,
      overdueTasks
    };
  };

  const stats = calculateMetrics();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Loader2 className="w-3 h-3 mr-1 animate-spin" />In Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTaskTypeLabel = (type: string) => {
    return TASK_TYPES.find(t => t.value === type)?.label || type;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OPERATOR': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'AUDITOR': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'SUPERVISOR': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'AGENT': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  if (!staff) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                {staff.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <SheetTitle className="text-xl">{staff.full_name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <span className="font-mono text-xs">{staff.staff_id}</span>
                  <Badge className={getRoleBadgeColor(staff.role)}>{staff.role}</Badge>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-primary">{stats.completedTasks}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingTasks + stats.inProgressTasks}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold">{stats.efficiencyScore}%</div>
                <div className="text-xs text-muted-foreground">Efficiency</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="tasks">
                <ClipboardList className="w-4 h-4 mr-2" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="metrics">
                <TrendingUp className="w-4 h-4 mr-2" />
                Metrics
              </TabsTrigger>
              <TabsTrigger value="overview">
                <Target className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
            </TabsList>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Assigned Tasks</h3>
                <Button size="sm" onClick={() => setShowAddTask(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Assign Task
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <Card key={task.id} className={`
                      ${task.expected_at && new Date(task.expected_at) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' 
                        ? 'border-red-500/50 bg-red-500/5' 
                        : ''}
                    `}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">{getTaskTypeLabel(task.type)}</div>
                            <div className="text-xs text-muted-foreground">
                              Assigned {formatDistanceToNow(new Date(task.assigned_at), { addSuffix: true })}
                            </div>
                          </div>
                          {getStatusBadge(task.status)}
                        </div>
                        
                        {task.expected_at && (
                          <div className="flex items-center text-xs text-muted-foreground mb-2">
                            <Calendar className="w-3 h-3 mr-1" />
                            Due: {format(new Date(task.expected_at), 'PPP p')}
                            {new Date(task.expected_at) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                              <Badge variant="destructive" className="ml-2 text-xs">Overdue</Badge>
                            )}
                          </div>
                        )}
                        
                        {task.feedback && (
                          <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2 mb-2">
                            <MessageSquare className="w-3 h-3 inline mr-1" />
                            {task.feedback}
                          </div>
                        )}
                        
                        {task.rating !== null && (
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < task.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                              />
                            ))}
                            <span className="text-sm text-muted-foreground ml-1">({task.rating}/5)</span>
                          </div>
                        )}
                        
                        <div className="flex gap-2 mt-3">
                          {task.status === 'PENDING' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                              >
                                Start
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600"
                                onClick={() => handleUpdateTaskStatus(task.id, 'CANCELLED')}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {task.status === 'IN_PROGRESS' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Mark Complete
                            </Button>
                          )}
                          {task.status === 'COMPLETED' && task.rating === null && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedTask(task);
                                setShowRatingDialog(true);
                              }}
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Rate Task
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tasks assigned yet</p>
                    <Button className="mt-4" onClick={() => setShowAddTask(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Assign First Task
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Target className="w-4 h-4" />
                      <span className="text-sm">Efficiency Score</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.efficiencyScore}%</div>
                    <Progress value={stats.efficiencyScore} className="mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Timer className="w-4 h-4" />
                      <span className="text-sm">Avg Completion Time</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {stats.avgCompletionHours > 0 ? `${stats.avgCompletionHours}h` : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Star className="w-4 h-4" />
                      <span className="text-sm">Average Rating</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.avgRating}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Overdue Tasks</span>
                    </div>
                    <div className={`text-2xl font-bold ${stats.overdueTasks > 0 ? 'text-red-600' : ''}`}>
                      {stats.overdueTasks}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Historical Metrics */}
              {metrics.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Historical Performance</CardTitle>
                    <CardDescription>Daily metrics from background jobs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {metrics.slice(0, 7).map((metric) => (
                        <div key={metric.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                          <span>{format(new Date(metric.period_start), 'MMM dd, yyyy')}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">
                              {metric.tasks_completed}/{metric.tasks_assigned} tasks
                            </span>
                            <Badge variant="outline">
                              {metric.efficiency_score ? `${Math.round(metric.efficiency_score * 100)}%` : 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Task Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Tasks Assigned</span>
                    <span className="font-semibold">{stats.totalTasks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Completed Tasks</span>
                    <span className="font-semibold text-green-600">{stats.completedTasks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pending Tasks</span>
                    <span className="font-semibold text-yellow-600">{stats.pendingTasks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">In Progress</span>
                    <span className="font-semibold text-blue-600">{stats.inProgressTasks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cancelled Tasks</span>
                    <span className="font-semibold text-red-600">{stats.cancelledTasks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sessions Hosted</span>
                    <span className="font-semibold">{staff.sessions_hosted || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Staff Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{staff.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{staff.phone_number || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Registered</span>
                    <span className="font-medium">{format(new Date(staff.created_at), 'PPP')}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Assign Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign New Task</DialogTitle>
            <DialogDescription>
              Assign a task to {staff.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Task Type</Label>
              <Select value={newTask.type} onValueChange={(v) => setNewTask({ ...newTask, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div>{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expected Completion Date</Label>
              <Input
                type="datetime-local"
                value={newTask.expectedAt}
                onChange={(e) => setNewTask({ ...newTask, expectedAt: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes / Instructions</Label>
              <Textarea
                value={newTask.notes}
                onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                placeholder="Add any specific instructions..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
            <Button onClick={handleAssignTask} disabled={isCreatingTask}>
              {isCreatingTask ? 'Assigning...' : 'Assign Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rate Task Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Task Completion</DialogTitle>
            <DialogDescription>
              Rate the quality of this task completion
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant={ratingForm.rating >= rating ? "default" : "outline"}
                    size="icon"
                    onClick={() => setRatingForm({ ...ratingForm, rating })}
                  >
                    <Star className={`w-5 h-5 ${ratingForm.rating >= rating ? 'fill-current' : ''}`} />
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Feedback (Optional)</Label>
              <Textarea
                value={ratingForm.feedback}
                onChange={(e) => setRatingForm({ ...ratingForm, feedback: e.target.value })}
                placeholder="Add feedback for this task..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRatingDialog(false)}>Skip</Button>
            <Button onClick={handleRateTask}>
              <Award className="w-4 h-4 mr-1" />
              Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
