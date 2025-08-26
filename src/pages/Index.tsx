import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, School, Users, Package, Printer } from 'lucide-react';

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Project Fusion
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Complete school printing management system with device sync, order tracking, 
            and real-time notifications for educational institutions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Comprehensive School Management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <School className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>School Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manage multiple schools, classes, and student records with bulk import capabilities.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Order Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Complete order lifecycle from submission to delivery with real-time status updates.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Printer className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Device Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Secure HMAC-authenticated communication with ESP32 printing devices.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Staff Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Role-based access control with comprehensive staff task and metrics tracking.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to streamline your school printing?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join schools across Tanzania using Project Fusion for efficient printing management.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')}>
            Start Your Journey
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
