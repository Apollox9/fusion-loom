import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  LogOut, 
  Settings,
  Bell,
  Menu
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function Navbar() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully'
      });
      navigate('/auth');
    }
  };

  return (
    <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">PF</span>
            </div>
            <span className="font-bold text-xl text-primary">Project Fusion</span>
          </Link>
          
          {user && (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link to="/client-portal" className="text-muted-foreground hover:text-foreground transition-colors">
                Client Portal
              </Link>
              <Link to="/schools" className="text-muted-foreground hover:text-foreground transition-colors">
                Schools
              </Link>
              <Link to="/orders" className="text-muted-foreground hover:text-foreground transition-colors">
                Orders
              </Link>
              <Link to="/machines" className="text-muted-foreground hover:text-foreground transition-colors">
                Machines
              </Link>
              <Link to="/staff" className="text-muted-foreground hover:text-foreground transition-colors">
                Staff
              </Link>
              <Link to="/conversations" className="text-muted-foreground hover:text-foreground transition-colors">
                Chat
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}