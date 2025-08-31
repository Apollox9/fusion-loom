import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Edit, Trash2, Search, UserCheck, UserX, Award, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Staff type definitions
interface BaseStaff {
  id: string;
  fullName: string;
  registeredAt: string;
}

interface Operator extends BaseStaff {
  type: 'operator';
  operatorID: string;
  sessionsHosted: number;
}

interface Auditor extends BaseStaff {
  type: 'auditor';
  auditorID: string;
  sessionsAudited: number;
}

interface Supervisor extends BaseStaff {
  type: 'supervisor';
  operatorID: string;
  sessionsSupervised: number;
}

interface Agent extends BaseStaff {
  type: 'agent';
  businessName: string;
  region: string;
  country: string;
  agentID: string;
  sessionsOrganised: number;
}

type Staff = Operator | Auditor | Supervisor | Agent;

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    type: 'operator',
    fullName: '',
    businessName: '',
    region: '',
    country: ''
  });

  const generateUniqueID = (type: string): string => {
    const prefix = type.toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}${timestamp}${random}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      toast({
        title: 'Error',
        description: 'Full name is required',
        variant: 'destructive'
      });
      return;
    }

    const baseStaff = {
      id: editingStaff?.id || crypto.randomUUID(),
      fullName: formData.fullName.trim(),
      registeredAt: editingStaff?.registeredAt || new Date().toISOString(),
    };

    let newStaff: Staff;

    switch (formData.type) {
      case 'operator':
        newStaff = {
          ...baseStaff,
          type: 'operator',
          operatorID: editingStaff?.type === 'operator' ? editingStaff.operatorID : generateUniqueID('operator'),
          sessionsHosted: editingStaff?.type === 'operator' ? editingStaff.sessionsHosted : 0,
        };
        break;
      case 'auditor':
        newStaff = {
          ...baseStaff,
          type: 'auditor',
          auditorID: editingStaff?.type === 'auditor' ? editingStaff.auditorID : generateUniqueID('auditor'),
          sessionsAudited: editingStaff?.type === 'auditor' ? editingStaff.sessionsAudited : 0,
        };
        break;
      case 'supervisor':
        newStaff = {
          ...baseStaff,
          type: 'supervisor',
          operatorID: editingStaff?.type === 'supervisor' ? editingStaff.operatorID : generateUniqueID('supervisor'),
          sessionsSupervised: editingStaff?.type === 'supervisor' ? editingStaff.sessionsSupervised : 0,
        };
        break;
      case 'agent':
        if (!formData.businessName.trim() || !formData.region.trim() || !formData.country.trim()) {
          toast({
            title: 'Error',
            description: 'Business name, region, and country are required for agents',
            variant: 'destructive'
          });
          return;
        }
        newStaff = {
          ...baseStaff,
          type: 'agent',
          businessName: formData.businessName.trim(),
          region: formData.region.trim(),
          country: formData.country.trim(),
          agentID: editingStaff?.type === 'agent' ? editingStaff.agentID : generateUniqueID('agent'),
          sessionsOrganised: editingStaff?.type === 'agent' ? editingStaff.sessionsOrganised : 0,
        };
        break;
      default:
        return;
    }

    if (editingStaff) {
      setStaff(prev => prev.map(s => s.id === editingStaff.id ? newStaff : s));
      toast({
        title: 'Success',
        description: 'Staff member updated successfully'
      });
    } else {
      setStaff(prev => [...prev, newStaff]);
      toast({
        title: 'Success',
        description: 'Staff member added successfully'
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: 'operator',
      fullName: '',
      businessName: '',
      region: '',
      country: ''
    });
    setEditingStaff(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      type: staffMember.type,
      fullName: staffMember.fullName,
      businessName: staffMember.type === 'agent' ? staffMember.businessName : '',
      region: staffMember.type === 'agent' ? staffMember.region : '',
      country: staffMember.type === 'agent' ? staffMember.country : ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    toast({
      title: 'Success',
      description: 'Staff member deleted successfully'
    });
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (s.type === 'operator' && s.operatorID.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (s.type === 'auditor' && s.auditorID.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (s.type === 'supervisor' && s.operatorID.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (s.type === 'agent' && (s.agentID.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                s.businessName.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesType = selectedType === 'all' || s.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getStaffIcon = (type: string) => {
    switch (type) {
      case 'operator': return <UserCheck className="w-4 h-4" />;
      case 'auditor': return <Shield className="w-4 h-4" />;
      case 'supervisor': return <Award className="w-4 h-4" />;
      case 'agent': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getStaffBadgeColor = (type: string) => {
    switch (type) {
      case 'operator': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'auditor': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'supervisor': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'agent': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const statsData = [
    { type: 'operator', count: staff.filter(s => s.type === 'operator').length, label: 'Operators' },
    { type: 'auditor', count: staff.filter(s => s.type === 'auditor').length, label: 'Auditors' },
    { type: 'supervisor', count: staff.filter(s => s.type === 'supervisor').length, label: 'Supervisors' },
    { type: 'agent', count: staff.filter(s => s.type === 'agent').length, label: 'Agents' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Staff Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your team of operators, auditors, supervisors, and agents
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="type">Staff Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Operator</SelectItem>
                      <SelectItem value="auditor">Auditor</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>

                {formData.type === 'agent' && (
                  <>
                    <div>
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                        placeholder="Enter business name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        value={formData.region}
                        onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                        placeholder="Enter region"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Enter country"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-primary-glow">
                    {editingStaff ? 'Update' : 'Add'} Staff
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat) => (
            <Card key={stat.type} className="bg-card/80 backdrop-blur-sm hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">{stat.count}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${getStaffBadgeColor(stat.type)}`}>
                    {getStaffIcon(stat.type)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search staff members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-40">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="operator">Operators</SelectItem>
                    <SelectItem value="auditor">Auditors</SelectItem>
                    <SelectItem value="supervisor">Supervisors</SelectItem>
                    <SelectItem value="agent">Agents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Table */}
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredStaff.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name & Type</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getStaffBadgeColor(member.type)}`}>
                            {getStaffIcon(member.type)}
                          </div>
                          <div>
                            <p className="font-medium">{member.fullName}</p>
                            <Badge variant="outline" className={getStaffBadgeColor(member.type)}>
                              {member.type.charAt(0).toUpperCase() + member.type.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {member.type === 'operator' ? member.operatorID :
                         member.type === 'auditor' ? member.auditorID :
                         member.type === 'supervisor' ? member.operatorID :
                         member.agentID}
                      </TableCell>
                      <TableCell>
                        {member.type === 'agent' ? (
                          <div className="text-sm">
                            <p className="font-medium">{member.businessName}</p>
                            <p className="text-muted-foreground">{member.region}, {member.country}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">
                            {member.type === 'operator' ? member.sessionsHosted :
                             member.type === 'auditor' ? member.sessionsAudited :
                             member.type === 'supervisor' ? member.sessionsSupervised :
                             member.sessionsOrganised}
                          </p>
                          <p className="text-muted-foreground">
                            {member.type === 'operator' ? 'Sessions Hosted' :
                             member.type === 'auditor' ? 'Sessions Audited' :
                             member.type === 'supervisor' ? 'Sessions Supervised' :
                             'Sessions Organised'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(member.registeredAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(member)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(member.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedType !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start by adding your first staff member'
                  }
                </p>
                {!searchTerm && selectedType === 'all' && (
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-gradient-to-r from-primary to-primary-glow"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff Member
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}