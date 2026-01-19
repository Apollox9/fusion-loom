import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Building2, 
  Users, 
  Ticket, 
  TrendingUp,
  Plus,
  Copy,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  DollarSign,
  Calendar,
  School,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow, differenceInHours } from 'date-fns';

interface InvitationalCode {
  id: string;
  code: string;
  agent_id: string;
  agent_staff_id: string;
  is_used: boolean;
  used_by_school_id: string | null;
  school_name: string | null;
  credit_worth_factor: number;
  created_at: string;
  used_at: string | null;
  expires_at: string;
}

interface ReferredSchool {
  id: string;
  name: string;
  headmaster_name: string;
  country: string;
  region: string;
  district: string;
  referral_code_used: string;
  referred_at: string;
  total_student_count: number;
}

interface AgentOrder {
  id: string;
  external_ref: string;
  school_name: string;
  total_amount: number;
  total_garments: number;
  status: string;
  created_at: string;
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { profile, loading } = useRoleBasedAuth();
  const { signOut } = useAuth();
  
  const [agentData, setAgentData] = useState<any>(null);
  const [invitationalCodes, setInvitationalCodes] = useState<InvitationalCode[]>([]);
  const [referredSchools, setReferredSchools] = useState<ReferredSchool[]>([]);
  const [orders, setOrders] = useState<AgentOrder[]>([]);
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (profile && profile.role === 'AGENT') {
      fetchAgentData();
    }
  }, [profile]);

  const fetchAgentData = async () => {
    try {
      // Fetch agent record
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', profile?.id)
        .single();

      if (agentError) throw agentError;
      setAgentData(agent);

      // Fetch invitational codes
      const { data: codes, error: codesError } = await supabase
        .from('agent_invitational_codes')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });

      if (codesError) throw codesError;
      setInvitationalCodes(codes || []);

      // Fetch referred schools
      const { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .eq('referred_by_agent_id', agent.id)
        .order('referred_at', { ascending: false });

      if (schoolsError) throw schoolsError;
      setReferredSchools(schools || []);

      // Fetch orders from referred schools
      if (schools && schools.length > 0) {
        const schoolIds = schools.map(s => s.id);
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .in('created_by_school', schoolIds)
          .order('created_at', { ascending: false });

        if (!ordersError && ordersData) {
          setOrders(ordersData);
        }
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
      toast.error('Failed to load agent data');
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateInvitationalCode = async () => {
    if (!agentData) return;
    
    try {
      setIsCreatingCode(true);
      const newCode = generateCode();
      
      // Get staff_id from staff table
      const { data: staffData } = await supabase
        .from('staff')
        .select('staff_id')
        .eq('user_id', profile?.id)
        .single();

      const { error } = await supabase
        .from('agent_invitational_codes')
        .insert({
          code: newCode,
          agent_id: agentData.id,
          agent_staff_id: staffData?.staff_id || 'UNKNOWN',
          credit_worth_factor: 1.0,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      toast.success(`Invitational code ${newCode} created successfully!`);
      setShowCreateDialog(false);
      fetchAgentData();
    } catch (error: any) {
      console.error('Error creating code:', error);
      toast.error(error.message || 'Failed to create invitational code');
    } finally {
      setIsCreatingCode(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copied to clipboard!');
  };

  const calculateCreditWorth = (code: InvitationalCode) => {
    if (!code.used_at || !code.is_used) return 0;
    const hoursToUse = differenceInHours(new Date(code.used_at), new Date(code.created_at));
    // Faster use = higher credit worth (max 2x for instant use, min 0.5x for 30 days)
    const factor = Math.max(0.5, 2 - (hoursToUse / (24 * 30)) * 1.5);
    return factor;
  };

  const stats = useMemo(() => {
    const totalSchools = referredSchools.length;
    const totalCredits = agentData?.total_credits || 0;
    const activeCodesCount = invitationalCodes.filter(c => !c.is_used && new Date(c.expires_at) > new Date()).length;
    const usedCodesCount = invitationalCodes.filter(c => c.is_used).length;
    const totalOrderValue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const estimatedCommission = totalOrderValue * 0.02; // 2% base commission
    
    return { totalSchools, totalCredits, activeCodesCount, usedCodesCount, totalOrderValue, estimatedCommission };
  }, [referredSchools, invitationalCodes, orders, agentData]);

  const filteredSchools = useMemo(() => {
    if (!searchTerm) return referredSchools;
    const query = searchTerm.toLowerCase();
    return referredSchools.filter(s => 
      s.name?.toLowerCase().includes(query) ||
      s.headmaster_name?.toLowerCase().includes(query) ||
      s.region?.toLowerCase().includes(query)
    );
  }, [referredSchools, searchTerm]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getCodeStatus = (code: InvitationalCode) => {
    if (code.is_used) {
      return { label: 'Used', variant: 'default' as const, icon: CheckCircle };
    }
    if (new Date(code.expires_at) < new Date()) {
      return { label: 'Expired', variant: 'destructive' as const, icon: XCircle };
    }
    return { label: 'Active', variant: 'secondary' as const, icon: Clock };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Agent Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name}</p>
                {agentData && (
                  <span className="text-xs text-muted-foreground">
                    • {agentData.business_name} • {agentData.region}, {agentData.country}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchAgentData}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Schools Referred</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSchools}</div>
              <p className="text-xs text-muted-foreground">Total referrals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCodesCount}</div>
              <p className="text-xs text-muted-foreground">{stats.usedCodesCount} used</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">TZS {stats.totalOrderValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From referred schools</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Est. Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">TZS {stats.estimatedCommission.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">2% of order value</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="codes">Invitational Codes</TabsTrigger>
            <TabsTrigger value="schools">Referred Schools</TabsTrigger>
            <TabsTrigger value="orders">School Orders</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your referral program</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Invitational Code
                  </Button>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Your Staff ID (Promo Code)</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-background rounded text-lg font-mono">
                        {agentData?.id ? invitationalCodes[0]?.agent_staff_id || 'Loading...' : 'Loading...'}
                      </code>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(invitationalCodes[0]?.agent_staff_id || '')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Schools can use this code during registration
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Referrals</CardTitle>
                  <CardDescription>Latest schools that joined using your codes</CardDescription>
                </CardHeader>
                <CardContent>
                  {referredSchools.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No referrals yet</p>
                      <p className="text-sm text-muted-foreground">Share your codes to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referredSchools.slice(0, 5).map((school) => (
                        <div key={school.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{school.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {school.region}, {school.country}
                            </p>
                          </div>
                          <Badge variant="secondary">{school.referral_code_used}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Invitational Codes Tab */}
          <TabsContent value="codes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Invitational Codes</CardTitle>
                  <CardDescription>Create and manage unique referral codes</CardDescription>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Code
                </Button>
              </CardHeader>
              <CardContent>
                {invitationalCodes.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No invitational codes yet</p>
                    <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
                      Create Your First Code
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Used By</TableHead>
                        <TableHead>Credit Factor</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitationalCodes.map((code) => {
                        const status = getCodeStatus(code);
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={code.id}>
                            <TableCell className="font-mono font-bold">{code.code}</TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="gap-1">
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{code.school_name || '-'}</TableCell>
                            <TableCell>
                              {code.is_used ? `${calculateCreditWorth(code).toFixed(2)}x` : '-'}
                            </TableCell>
                            <TableCell>{formatDistanceToNow(new Date(code.created_at), { addSuffix: true })}</TableCell>
                            <TableCell>{new Date(code.expires_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => copyToClipboard(code.code)}
                                disabled={code.is_used}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referred Schools Tab */}
          <TabsContent value="schools">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Referred Schools ({referredSchools.length})</CardTitle>
                    <CardDescription>Schools that registered using your codes</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search schools..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredSchools.length === 0 ? (
                  <div className="text-center py-12">
                    <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No schools found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>School Name</TableHead>
                        <TableHead>Headmaster</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Code Used</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchools.map((school, index) => (
                        <TableRow key={school.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{school.name}</TableCell>
                          <TableCell>{school.headmaster_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {school.district}, {school.region}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">{school.referral_code_used}</Badge>
                          </TableCell>
                          <TableCell>{school.total_student_count || 0}</TableCell>
                          <TableCell>
                            {school.referred_at ? formatDistanceToNow(new Date(school.referred_at), { addSuffix: true }) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>School Orders</CardTitle>
                <CardDescription>Orders placed by your referred schools</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <p className="text-sm text-muted-foreground">Orders from referred schools will appear here</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Garments</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Commission (2%)</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono">{order.external_ref || order.id.slice(0, 8)}</TableCell>
                          <TableCell>{order.school_name}</TableCell>
                          <TableCell>{order.total_garments}</TableCell>
                          <TableCell>TZS {(order.total_amount || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-primary font-medium">
                            TZS {((order.total_amount || 0) * 0.02).toLocaleString()}
                          </TableCell>
                          <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Code Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invitational Code</DialogTitle>
            <DialogDescription>
              Generate a unique 10-character code that schools can use during registration. 
              The faster a school uses your code, the higher your credit worth factor!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Preview (new code will be generated)</p>
              <code className="text-2xl font-mono font-bold tracking-widest">{generateCode()}</code>
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>• Code expires in 30 days if unused</p>
              <p>• Each code can only be used once</p>
              <p>• Credit factor: 2x (instant) to 0.5x (30 days)</p>
              <p>• You earn 2% × credit factor of order payments</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateInvitationalCode} disabled={isCreatingCode}>
              {isCreatingCode ? 'Creating...' : 'Create Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
