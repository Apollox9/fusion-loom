import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  School, 
  Package, 
  Printer,
  LogOut,
  Settings,
  MessageSquare,
  Upload
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    schools: 0,
    orders: 0,
    machines: 0,
    students: 0
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      }
    };

    const fetchStats = async () => {
      try {
        const [schoolsRes, ordersRes, machinesRes, studentsRes] = await Promise.all([
          supabase.from('schools').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase.from('machines').select('id', { count: 'exact', head: true }),
          supabase.from('students').select('id', { count: 'exact', head: true })
        ]);

        setStats({
          schools: schoolsRes.count || 0,
          orders: ordersRes.count || 0,
          machines: machinesRes.count || 0,
          students: studentsRes.count || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchProfile();
    fetchStats();
  }, [user, toast]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-500';
      case 'SUPERVISOR': return 'bg-blue-500';
      case 'OPERATOR': return 'bg-green-500';
      case 'AGENT': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getQuickActions = (role: string) => {
    const baseActions = [
      { title: 'View Orders', href: '/orders', icon: Package },
      { title: 'Messages', href: '/conversations', icon: MessageSquare },
      { title: 'Settings', href: '/settings', icon: Settings },
    ];

    if (role === 'ADMIN') {
      return [
        { title: 'Import Data', href: '/imports', icon: Upload },
        { title: 'Manage Schools', href: '/schools', icon: School },
        { title: 'Machines', href: '/machines', icon: Printer },
        ...baseActions,
      ];
    }

    if (role === 'SCHOOL_USER') {
      return [
        { title: 'Create Order', href: '/orders/new', icon: Package },
        ...baseActions,
      ];
    }

    return baseActions;
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Project Fusion</h1>
            <p className="text-muted-foreground">School Printing Management</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{profile.full_name}</p>
              <Badge className={`${getRoleColor(profile.role)} text-white`}>
                {profile.role.replace('_', ' ')}
              </Badge>
            </div>
            
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Schools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <School className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-2xl font-bold">{stats.schools}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Package className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-2xl font-bold">{stats.orders}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Machines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Printer className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-2xl font-bold">{stats.machines}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-2xl font-bold">{stats.students}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for your role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getQuickActions(profile.role).map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.title}
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => navigate(action.href)}
                  >
                    <Icon className="h-6 w-6" />
                    {action.title}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;