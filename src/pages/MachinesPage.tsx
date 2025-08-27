import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Printer, MapPin, Activity, Clock, Zap, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Machine {
  id: string;
  device_id: string;
  model: string;
  firmware_version: string;
  is_online: boolean;
  is_printing: boolean;
  last_seen_at: string;
  up_time: string;
  sessions_held: number;
  active_session: string;
  secret_key: string;
  created_at: string;
  updated_at: string;
}

interface MachineLocation {
  id: string;
  machine_id: string;
  lat: number;
  lng: number;
  provider: string;
  created_at: string;
}

export default function MachinesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineLocations, setMachineLocations] = useState<MachineLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMachine, setNewMachine] = useState({
    device_id: '',
    model: '',
    secret_key: ''
  });

  useEffect(() => {
    fetchMachines();
    fetchMachineLocations();
  }, []);

  const fetchMachines = async () => {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMachines(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch machines',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMachineLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('machine_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMachineLocations(data || []);
    } catch (error) {
      console.error('Failed to fetch machine locations:', error);
    }
  };

  const handleAddMachine = async () => {
    try {
      const { error } = await supabase
        .from('machines')
        .insert([{
          device_id: newMachine.device_id,
          model: newMachine.model,
          secret_key: newMachine.secret_key || Math.random().toString(36).substring(2, 15)
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Machine added successfully'
      });

      setIsAddDialogOpen(false);
      setNewMachine({ device_id: '', model: '', secret_key: '' });
      fetchMachines();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add machine',
        variant: 'destructive'
      });
    }
  };

  const getLastLocation = (machineId: string) => {
    return machineLocations
      .filter(loc => loc.machine_id === machineId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  const formatUptime = (uptime: string) => {
    if (!uptime) return 'Unknown';
    // Parse uptime and format it nicely
    return uptime;
  };

  const getStatusColor = (machine: Machine) => {
    if (!machine.is_online) return 'destructive';
    if (machine.is_printing) return 'default';
    return 'secondary';
  };

  const getStatusText = (machine: Machine) => {
    if (!machine.is_online) return 'Offline';
    if (machine.is_printing) return 'Printing';
    return 'Online';
  };

  const filteredMachines = machines.filter(machine =>
    machine.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Machines Management</h1>
          <p className="text-muted-foreground">Monitor and manage printing machines</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Machine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Machine</DialogTitle>
              <DialogDescription>
                Register a new printing machine
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="device_id">Device ID</Label>
                <Input
                  id="device_id"
                  value={newMachine.device_id}
                  onChange={(e) => setNewMachine({ ...newMachine, device_id: e.target.value })}
                  placeholder="Enter device ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={newMachine.model}
                  onChange={(e) => setNewMachine({ ...newMachine, model: e.target.value })}
                  placeholder="Enter machine model"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secret_key">Secret Key (optional)</Label>
                <Input
                  id="secret_key"
                  value={newMachine.secret_key}
                  onChange={(e) => setNewMachine({ ...newMachine, secret_key: e.target.value })}
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMachine}>
                Add Machine
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{machines.length}</div>
            <div className="text-sm text-muted-foreground">Total Machines</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {machines.filter(m => m.is_online).length}
            </div>
            <div className="text-sm text-muted-foreground">Online</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {machines.filter(m => m.is_printing).length}
            </div>
            <div className="text-sm text-muted-foreground">Printing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {machines.filter(m => !m.is_online).length}
            </div>
            <div className="text-sm text-muted-foreground">Offline</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search machines by device ID or model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid gap-4">
        {filteredMachines.map((machine) => {
          const location = getLastLocation(machine.id);
          return (
            <Card key={machine.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Printer className="h-5 w-5" />
                      {machine.device_id}
                    </CardTitle>
                    <CardDescription>
                      {machine.model && `${machine.model} • `}
                      {machine.firmware_version && `v${machine.firmware_version} • `}
                      Added: {new Date(machine.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getStatusColor(machine)}>
                      {getStatusText(machine)}
                    </Badge>
                    {machine.active_session && (
                      <Badge variant="outline" className="border-blue-500 text-blue-700">
                        Active Session
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      Status
                    </div>
                    <div className="text-sm">
                      {machine.last_seen_at && (
                        <div>Last seen: {new Date(machine.last_seen_at).toLocaleString()}</div>
                      )}
                      {machine.up_time && (
                        <div>Uptime: {formatUptime(machine.up_time)}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      Sessions
                    </div>
                    <div className="text-sm">
                      <div>Total: {machine.sessions_held}</div>
                      {machine.active_session && (
                        <div className="text-blue-600">Current: {machine.active_session}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Location
                    </div>
                    <div className="text-sm">
                      {location ? (
                        <div>
                          <div>Lat: {location.lat.toFixed(6)}</div>
                          <div>Lng: {location.lng.toFixed(6)}</div>
                          <div className="text-xs text-muted-foreground">
                            {location.provider} • {new Date(location.created_at).toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">No location data</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Settings className="h-4 w-4" />
                      Configuration
                    </div>
                    <div className="text-sm">
                      <div className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {machine.secret_key.substring(0, 8)}...
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Secret Key
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMachines.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Printer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No machines found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No machines match your search criteria.' : 'Start by adding your first machine.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Machine
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}