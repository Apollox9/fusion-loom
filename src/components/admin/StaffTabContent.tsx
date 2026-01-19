import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  Shield, 
  Award, 
  Building2,
  MoreVertical,
  Edit,
  Trash2,
  Search,
  Key,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { generateStaffId } from '@/utils/staffIdGenerator';
import { StaffDetailSheet } from './StaffDetailSheet';

interface StaffTabContentProps {
  onRefresh?: () => void;
}

export function StaffTabContent({ onRefresh }: StaffTabContentProps) {
  const [staff, setStaff] = useState<any[]>([]);
  const [agentDetails, setAgentDetails] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [detailStaff, setDetailStaff] = useState<any>(null);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'role'>('name');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // New staff form
  const [newStaff, setNewStaff] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    role: 'OPERATOR' as 'OPERATOR' | 'SUPERVISOR' | 'AUDITOR' | 'AGENT',
    businessName: '',
    country: '',
    region: ''
  });
  
  // Edit staff form
  const [editForm, setEditForm] = useState({
    fullName: '',
    phoneNumber: '',
    role: 'OPERATOR' as string,
    businessName: '',
    country: '',
    region: '',
    newPassword: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setStaff(data || []);
      
      // Fetch agent details for AGENT role staff members
      const agentUserIds = (data || [])
        .filter(s => s.role === 'AGENT' && s.user_id)
        .map(s => s.user_id);
      
      if (agentUserIds.length > 0) {
        const { data: agents } = await supabase
          .from('agents')
          .select('user_id, business_name, country, region')
          .in('user_id', agentUserIds);
        
        if (agents) {
          const agentMap: Record<string, any> = {};
          agents.forEach(a => {
            agentMap[a.user_id] = a;
          });
          setAgentDetails(agentMap);
        }
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  // Role count stats
  const roleCounts = {
    OPERATOR: staff.filter(s => s.role === 'OPERATOR').length,
    AUDITOR: staff.filter(s => s.role === 'AUDITOR').length,
    SUPERVISOR: staff.filter(s => s.role === 'SUPERVISOR').length,
    AGENT: staff.filter(s => s.role === 'AGENT').length
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OPERATOR': return <UserCheck className="w-4 h-4" />;
      case 'AUDITOR': return <Shield className="w-4 h-4" />;
      case 'SUPERVISOR': return <Award className="w-4 h-4" />;
      case 'AGENT': return <Building2 className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
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

  // Filter and sort staff
  const filteredStaff = staff
    .filter(s => {
      const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.staff_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || s.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.full_name || '').localeCompare(b.full_name || '');
      if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'role') return (a.role || '').localeCompare(b.role || '');
      return 0;
    });

  const handleCreateStaff = async () => {
    try {
      setIsCreatingStaff(true);
      
      if (!newStaff.email || !newStaff.fullName || !newStaff.password) {
        toast.error('Email, full name, and password are required');
        return;
      }

      const staffId = generateStaffId(newStaff.role);
      
      const body: any = {
        email: newStaff.email,
        password: newStaff.password,
        fullName: newStaff.fullName,
        phoneNumber: newStaff.phoneNumber,
        role: newStaff.role,
        staffId: staffId
      };

      if (newStaff.role === 'AGENT') {
        body.businessName = newStaff.businessName;
        body.country = newStaff.country;
        body.region = newStaff.region;
      }

      const { data, error } = await supabase.functions.invoke('create-staff', { body });

      if (error) throw new Error(error.message || 'Failed to create staff member');
      if (!data?.success) throw new Error(data?.error || 'Failed to create staff member');

      toast.success(`Staff member created successfully (ID: ${staffId})`);
      setShowAddStaff(false);
      resetNewStaffForm();
      fetchStaff();
      onRefresh?.();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      toast.error(error.message || 'Failed to create staff member');
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const resetNewStaffForm = () => {
    setNewStaff({
      email: '',
      password: '',
      fullName: '',
      phoneNumber: '',
      role: 'OPERATOR',
      businessName: '',
      country: '',
      region: ''
    });
  };

  const handleEditClick = (staffMember: any) => {
    setSelectedStaff(staffMember);
    setEditForm({
      fullName: staffMember.full_name || '',
      phoneNumber: staffMember.phone_number || '',
      role: staffMember.role || 'OPERATOR',
      businessName: '',
      country: '',
      region: '',
      newPassword: ''
    });
    setShowEditStaff(true);
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;
    
    try {
      setIsSaving(true);
      
      const { error: staffError } = await supabase
        .from('staff')
        .update({
          full_name: editForm.fullName,
          phone_number: editForm.phoneNumber,
          role: editForm.role as 'ADMIN' | 'AGENT' | 'AUDITOR' | 'OPERATOR' | 'SCHOOL_USER' | 'SUPERVISOR',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStaff.id);

      if (staffError) throw staffError;

      // Update password if provided
      if (editForm.newPassword && editForm.newPassword.length >= 6 && selectedStaff.user_id) {
        // Note: Password update requires admin access via edge function
        const { error: authError } = await supabase.functions.invoke('update-staff-password', {
          body: { userId: selectedStaff.user_id, newPassword: editForm.newPassword }
        });
        
        if (authError) {
          console.error('Error updating password:', authError);
          toast.error('Staff updated but password change failed');
        } else {
          toast.success('Staff and password updated successfully');
        }
      } else {
        toast.success('Staff updated successfully');
      }

      setShowEditStaff(false);
      setSelectedStaff(null);
      fetchStaff();
      onRefresh?.();
    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast.error(error.message || 'Failed to update staff');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (staffMember: any) => {
    setSelectedStaff(staffMember);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedStaff) return;
    
    try {
      // Delete from staff table
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', selectedStaff.id);

      if (error) throw error;

      toast.success('Staff member deleted successfully');
      setShowDeleteConfirm(false);
      setSelectedStaff(null);
      fetchStaff();
      onRefresh?.();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      toast.error(error.message || 'Failed to delete staff member');
    }
  };

  const statsCards = [
    { role: 'OPERATOR', label: 'Operators', count: roleCounts.OPERATOR, icon: <UserCheck className="w-5 h-5" /> },
    { role: 'AUDITOR', label: 'Auditors', count: roleCounts.AUDITOR, icon: <Shield className="w-5 h-5" /> },
    { role: 'SUPERVISOR', label: 'Supervisors', count: roleCounts.SUPERVISOR, icon: <Award className="w-5 h-5" /> },
    { role: 'AGENT', label: 'Agents', count: roleCounts.AGENT, icon: <Building2 className="w-5 h-5" /> }
  ];

  return (
    <div className="space-y-4">
      {/* Role Count Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card 
            key={stat.role} 
            className={`cursor-pointer transition-colors ${roleFilter === stat.role ? 'border-primary' : 'hover:border-primary/50'}`}
            onClick={() => setRoleFilter(roleFilter === stat.role ? 'all' : stat.role)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.count}</p>
                </div>
                <div className={`p-3 rounded-lg ${getRoleBadgeColor(stat.role)}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="date">Date Registered</SelectItem>
            <SelectItem value="role">Role</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="OPERATOR">Operator</SelectItem>
            <SelectItem value="AUDITOR">Auditor</SelectItem>
            <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
            <SelectItem value="AGENT">Agent</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={showAddStaff} onOpenChange={setShowAddStaff}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>Create a new staff account with login credentials</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={newStaff.fullName}
                  onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  placeholder="Enter password (min 6 chars)"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={newStaff.phoneNumber}
                  onChange={(e) => setNewStaff({ ...newStaff, phoneNumber: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={newStaff.role} onValueChange={(value: any) => setNewStaff({ ...newStaff, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATOR">Operator</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    <SelectItem value="AUDITOR">Auditor</SelectItem>
                    <SelectItem value="AGENT">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newStaff.role === 'AGENT' && (
                <>
                  <div>
                    <Label>Business Name</Label>
                    <Input
                      value={newStaff.businessName}
                      onChange={(e) => setNewStaff({ ...newStaff, businessName: e.target.value })}
                      placeholder="Enter business name"
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input
                      value={newStaff.country}
                      onChange={(e) => setNewStaff({ ...newStaff, country: e.target.value })}
                      placeholder="Enter country"
                    />
                  </div>
                  <div>
                    <Label>Region</Label>
                    <Input
                      value={newStaff.region}
                      onChange={(e) => setNewStaff({ ...newStaff, region: e.target.value })}
                      placeholder="Enter region"
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddStaff(false)}>Cancel</Button>
              <Button onClick={handleCreateStaff} disabled={isCreatingStaff}>
                {isCreatingStaff ? 'Creating...' : 'Create Staff'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
          <CardDescription>Manage operators, supervisors, auditors, and agents</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : filteredStaff.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member, index) => (
                  <TableRow 
                    key={member.id} 
                    className="cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => {
                      setDetailStaff(member);
                      setShowDetailSheet(true);
                    }}
                  >
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm">{member.staff_id}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{member.full_name}</span>
                        {member.role === 'AGENT' && agentDetails[member.user_id] && (
                          <div className="text-xs text-muted-foreground">
                            {agentDetails[member.user_id].business_name} • {agentDetails[member.user_id].region}, {agentDetails[member.user_id].country}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(member.role)}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>{member.sessions_hosted || 0}</TableCell>
                    <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailStaff(member);
                            setShowDetailSheet(true);
                          }}
                        >
                          <ClipboardList className="w-4 h-4 mr-1" />
                          Tasks
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(member);
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(member);
                            }}>
                              <Key className="w-4 h-4 mr-2" />
                              Change Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(member);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Staff
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Staff Members Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Add your first staff member'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditStaff} onOpenChange={setShowEditStaff}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>Update staff details and credentials</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={editForm.phoneNumber}
                onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATOR">Operator</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  <SelectItem value="AUDITOR">Auditor</SelectItem>
                  <SelectItem value="AGENT">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>New Password (leave blank to keep current)</Label>
              <Input
                type="password"
                value={editForm.newPassword}
                onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                placeholder="Enter new password (min 6 chars)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditStaff(false)}>Cancel</Button>
            <Button onClick={handleUpdateStaff} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedStaff?.full_name}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Staff Detail Sheet */}
      <StaffDetailSheet
        staff={detailStaff}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        onRefresh={fetchStaff}
      />
    </div>
  );
}
