import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, School, Users, Package, Printer } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-electric-blue/10">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-electric-blue/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-accent/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-primary/10 rounded-full blur-2xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-32">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-bold mb-8 gradient-text leading-tight">
              Project Fusion
            </h1>
            <div className="w-24 h-1 bg-gradient-neon mx-auto mb-8 rounded-full"></div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Revolutionary school printing management with AI-powered analytics, 
              real-time device sync, and seamless order tracking for the future of education.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-up">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-gradient-hero text-white shadow-electric hover:shadow-neon transition-all duration-300 px-8 py-4 text-lg font-semibold hover-lift"
            >
              Start Your Journey
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 px-8 py-4 text-lg font-semibold hover-lift neon-border"
            >
              Sign In
            </Button>
          </div>
          
          {/* Floating Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 animate-scale-in">
            <div className="glass-effect rounded-2xl p-6 hover-lift">
              <div className="text-3xl font-bold gradient-text">50K+</div>
              <div className="text-muted-foreground">Students Served</div>
            </div>
            <div className="glass-effect rounded-2xl p-6 hover-lift">
              <div className="text-3xl font-bold gradient-text">200+</div>
              <div className="text-muted-foreground">Schools Connected</div>
            </div>
            <div className="glass-effect rounded-2xl p-6 hover-lift">
              <div className="text-3xl font-bold gradient-text">99.9%</div>
              <div className="text-muted-foreground">Uptime Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              Next-Generation Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed for modern educational institutions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center bg-gradient-card border-border/50 shadow-card hover-lift group">
              <CardHeader>
                <div className="relative">
                  <School className="h-16 w-16 mx-auto mb-4 text-primary group-hover:text-electric-blue transition-colors duration-300" />
                  <div className="absolute inset-0 bg-electric-blue/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">Smart School Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  AI-powered analytics for managing multiple schools, classes, and student records with seamless bulk import capabilities.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center bg-gradient-card border-border/50 shadow-card hover-lift group">
              <CardHeader>
                <div className="relative">
                  <Package className="h-16 w-16 mx-auto mb-4 text-primary group-hover:text-electric-blue transition-colors duration-300" />
                  <div className="absolute inset-0 bg-electric-blue/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">Real-Time Order Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Complete order lifecycle management from submission to delivery with live status updates and automated notifications.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center bg-gradient-card border-border/50 shadow-card hover-lift group">
              <CardHeader>
                <div className="relative">
                  <Printer className="h-16 w-16 mx-auto mb-4 text-primary group-hover:text-electric-blue transition-colors duration-300" />
                  <div className="absolute inset-0 bg-electric-blue/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">Secure Device Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Military-grade HMAC authentication for ESP32 devices with real-time monitoring and automated health checks.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center bg-gradient-card border-border/50 shadow-card hover-lift group">
              <CardHeader>
                <div className="relative">
                  <Users className="h-16 w-16 mx-auto mb-4 text-primary group-hover:text-electric-blue transition-colors duration-300" />
                  <div className="absolute inset-0 bg-electric-blue/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">Advanced Staff Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Granular role-based access control with comprehensive performance metrics and automated task distribution.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 gradient-text leading-tight">
              Transform Education Today
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed">
              Join over 200 schools across Tanzania revolutionizing their printing infrastructure 
              with AI-powered management and real-time analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="bg-gradient-hero text-white shadow-electric hover:shadow-neon transition-all duration-300 px-12 py-6 text-xl font-bold hover-lift animate-glow"
              >
                Begin Transformation
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full border-2 border-background"></div>
                  <div className="w-8 h-8 bg-electric-blue rounded-full border-2 border-background"></div>
                  <div className="w-8 h-8 bg-neon-accent rounded-full border-2 border-background"></div>
                </div>
                <span>1000+ educators trust us</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
