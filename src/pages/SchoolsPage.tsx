import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Upload, MapPin, Users, GraduationCap, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface School {
  id: string;
  name: string;
  school_id: string;
  email: string;
  phone_number1: string;
  phone_number2: string;
  country: string;
  region: string;
  district: string;
  category: string;
  postal_address: string;
  total_student_count: number;
  total_students_served_in_school: number;
  is_served: boolean;
  is_session_active: boolean;
  service_pass_code: string;
  registered_on: string;
  created_at: string;
}

export default function SchoolsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: '',
    school_id: '',
    email: '',
    phone_number1: '',
    phone_number2: '',
    country: '',
    region: '',
    district: '',
    category: '',
    postal_address: '',
    total_student_count: 0,
    service_pass_code: ''
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch schools',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchool = async () => {
    try {
      const { error } = await supabase
        .from('schools')
        .insert([{
          ...newSchool,
          registered_on: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'School added successfully'
      });

      setIsAddDialogOpen(false);
      setNewSchool({
        name: '',
        school_id: '',
        email: '',
        phone_number1: '',
        phone_number2: '',
        country: '',
        region: '',
        district: '',
        category: '',
        postal_address: '',
        total_student_count: 0,
        service_pass_code: ''
      });
      fetchSchools();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add school',
        variant: 'destructive'
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simple CSV parsing for demo - in production use a proper library
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    
    const schoolsData = lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj: any, header, index) => {
        obj[header.trim()] = values[index]?.trim() || '';
        return obj;
      }, {});
    }).filter(school => school.name);

    try {
      const { error } = await supabase
        .from('schools')
        .insert(schoolsData.map((school: any) => ({
          name: school.name,
          school_id: school.school_id || '',
          email: school.email || '',
          phone_number1: school.phone_number1 || '',
          country: school.country || '',
          region: school.region || '',
          district: school.district || '',
          category: school.category || '',
          postal_address: school.postal_address || '',
          total_student_count: parseInt(school.total_student_count) || 0,
          service_pass_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          registered_on: new Date().toISOString()
        })));

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${schoolsData.length} schools imported successfully`
      });

      fetchSchools();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to import schools',
        variant: 'destructive'
      });
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.district?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-foreground">Schools Management</h1>
          <p className="text-muted-foreground">Manage school registrations and data</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add School
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New School</DialogTitle>
                <DialogDescription>
                  Enter the school details below
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">School Name</Label>
                    <Input
                      id="name"
                      value={newSchool.name}
                      onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                      placeholder="Enter school name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school_id">School ID</Label>
                    <Input
                      id="school_id"
                      value={newSchool.school_id}
                      onChange={(e) => setNewSchool({ ...newSchool, school_id: e.target.value })}
                      placeholder="Enter school ID"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newSchool.email}
                      onChange={(e) => setNewSchool({ ...newSchool, email: e.target.value })}
                      placeholder="school@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newSchool.phone_number1}
                      onChange={(e) => setNewSchool({ ...newSchool, phone_number1: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={newSchool.country}
                      onChange={(e) => setNewSchool({ ...newSchool, country: e.target.value })}
                      placeholder="Country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={newSchool.region}
                      onChange={(e) => setNewSchool({ ...newSchool, region: e.target.value })}
                      placeholder="Region"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={newSchool.district}
                      onChange={(e) => setNewSchool({ ...newSchool, district: e.target.value })}
                      placeholder="District"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={newSchool.category}
                      onChange={(e) => setNewSchool({ ...newSchool, category: e.target.value })}
                      placeholder="Primary/Secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student_count">Total Students</Label>
                    <Input
                      id="student_count"
                      type="number"
                      value={newSchool.total_student_count}
                      onChange={(e) => setNewSchool({ ...newSchool, total_student_count: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Postal Address</Label>
                  <Textarea
                    id="address"
                    value={newSchool.postal_address}
                    onChange={(e) => setNewSchool({ ...newSchool, postal_address: e.target.value })}
                    placeholder="Enter postal address"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSchool}>
                  Add School
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search schools by name, region, or district..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid gap-4">
        {filteredSchools.map((school) => (
          <Card key={school.id} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    {school.name}
                  </CardTitle>
                  <CardDescription>
                    {school.school_id && `ID: ${school.school_id} • `}
                    {school.category && `${school.category} • `}
                    Registered: {new Date(school.registered_on || school.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={school.is_served ? "default" : "secondary"}>
                    {school.is_served ? "Served" : "Not Served"}
                  </Badge>
                  {school.is_session_active && (
                    <Badge variant="outline" className="border-green-500 text-green-700">
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
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                  <div className="text-sm">
                    {[school.district, school.region, school.country].filter(Boolean).join(', ')}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Students
                  </div>
                  <div className="text-sm">
                    {school.total_students_served_in_school} / {school.total_student_count} served
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Contact
                  </div>
                  <div className="text-sm">
                    {school.email && <div>{school.email}</div>}
                    {school.phone_number1 && <div>{school.phone_number1}</div>}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Service Code</div>
                  <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {school.service_pass_code}
                  </div>
                </div>
              </div>
              
              {school.postal_address && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-1">Address</div>
                  <div className="text-sm">{school.postal_address}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSchools.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No schools found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No schools match your search criteria.' : 'Start by adding your first school.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First School
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}