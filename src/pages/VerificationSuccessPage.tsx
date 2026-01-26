import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function VerificationSuccessPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
      }
    };
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/school/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-electric-blue/10 p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-accent/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      <Card className="w-full max-w-lg shadow-electric bg-gradient-card border-border/50 backdrop-blur-sm animate-scale-in relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-500 mb-4">
            🎉 Email Verified!
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8 text-center">
          <p className="text-lg text-foreground mb-4">
            Your account has been successfully verified!
          </p>
          <p className="text-muted-foreground mb-8">
            Welcome to Project Fusion. You're now ready to start managing your school's uniform printing.
          </p>
          
          {/* Countdown Circle */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted/30"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (countdown / 10) * 251.2}
                className="text-primary transition-all duration-1000 ease-linear"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">{countdown}</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Redirecting to your dashboard in <span className="font-bold text-primary">{countdown}</span> seconds...
          </p>
          
          {isAuthenticated && (
            <p className="text-xs text-green-500 mt-4">
              ✓ You are now logged in
            </p>
          )}
          
          <button
            onClick={() => navigate('/school/dashboard')}
            className="mt-6 text-primary hover:underline text-sm font-medium"
          >
            Go to dashboard now →
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
