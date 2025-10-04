import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { School, Save } from 'lucide-react';

const SCHOOL_TYPES = [
  'Primary',
  'Secondary',
  'High',
  'Combined',
  'College'
];

const STUDENT_COUNT_RANGES = [
  '< 100',
  '100-200',
  '200-500',
  '500+'
];

export function SchoolSettings() {
  const { user, profile } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    headmasterName: '',
    schoolType: '',
    studentCount: '',
    email: '',
    phoneNumber: '',
    postalAddress: '',
    country: '',
    region: '',
    district: ''
  });

  useEffect(() => {
    fetchSchoolData();
  }, [user]);

  const fetchSchoolData = async () => {
    try {
      // Try to get school data first
      const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (schoolData) {
        setFormData({
          schoolName: schoolData.name || '',
          headmasterName: schoolData.headmaster_name || '',
          schoolType: schoolData.category || '',
          studentCount: getStudentCountRange(schoolData.total_student_count || 0),
          email: schoolData.email || '',
          phoneNumber: schoolData.phone_number1 || '',
          postalAddress: schoolData.postal_address || '',
          country: schoolData.country || '',
          region: schoolData.region || '',
          district: schoolData.district || ''
        });
      } else if (profile) {
        // Use profile data as fallback
        setFormData(prev => ({
          ...prev,
          headmasterName: profile.full_name || '',
          email: user?.email || '',
          phoneNumber: profile.phone_number || '',
          country: profile.country || '',
          region: profile.region || '',
          district: profile.district || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching school data:', error);
    }
  };

  const getStudentCountRange = (count: number): string => {
    if (count < 100) return '< 100';
    if (count >= 100 && count < 200) return '100-200';
    if (count >= 200 && count < 500) return '200-500';
    return '500+';
  };

  const getStudentCountFromRange = (range: string): number => {
    switch (range) {
      case '< 100': return 50;
      case '100-200': return 150;
      case '200-500': return 350;
      case '500+': return 600;
      default: return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const studentCount = getStudentCountFromRange(formData.studentCount);

      // Check if school exists
      const { data: existingSchool } = await supabase
        .from('schools')
        .select('id')
        .limit(1)
        .maybeSingle();

      const schoolPayload = {
        name: formData.schoolName,
        headmaster_name: formData.headmasterName,
        category: formData.schoolType,
        total_student_count: studentCount,
        email: formData.email,
        phone_number1: formData.phoneNumber,
        postal_address: formData.postalAddress,
        country: formData.country,
        region: formData.region,
        district: formData.district
      };

      if (existingSchool) {
        // Update existing school
        const { error: schoolError } = await supabase
          .from('schools')
          .update(schoolPayload)
          .eq('id', existingSchool.id);

        if (schoolError) throw schoolError;
      } else {
        // Insert new school
        const { error: schoolError } = await supabase
          .from('schools')
          .insert({
            ...schoolPayload,
            service_pass_code: Math.random().toString(36).substring(2, 10).toUpperCase()
          });

        if (schoolError) throw schoolError;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.headmasterName,
          phone_number: formData.phoneNumber,
          country: formData.country,
          region: formData.region,
          district: formData.district
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      toast({
        title: 'Settings Updated',
        description: 'Your school information has been saved successfully'
      });
    } catch (error: any) {
      console.error('Error saving school settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save school settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="w-5 h-5" />
          School Settings
        </CardTitle>
        <CardDescription>Update your school information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name</Label>
              <Input
                id="schoolName"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                placeholder="Enter school name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headmasterName">Headmaster Name</Label>
              <Input
                id="headmasterName"
                value={formData.headmasterName}
                onChange={(e) => setFormData({ ...formData, headmasterName: e.target.value })}
                placeholder="Enter headmaster name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolType">School Type</Label>
              <Select value={formData.schoolType} onValueChange={(value) => setFormData({ ...formData, schoolType: value })}>
                <SelectTrigger id="schoolType">
                  <SelectValue placeholder="Select school type" />
                </SelectTrigger>
                <SelectContent>
                  {SCHOOL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentCount">Student Count Range</Label>
              <Select value={formData.studentCount} onValueChange={(value) => setFormData({ ...formData, studentCount: value })}>
                <SelectTrigger id="studentCount">
                  <SelectValue placeholder="Select student count range" />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_COUNT_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>{range} students</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Official Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="school@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+255..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Enter country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="Enter region"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="Enter district"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="postalAddress">School Postal Address</Label>
              <Input
                id="postalAddress"
                value={formData.postalAddress}
                onChange={(e) => setFormData({ ...formData, postalAddress: e.target.value })}
                placeholder="P.O. Box..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-primary to-primary-glow">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
