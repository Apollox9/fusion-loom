import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function VerificationSuccessPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(30);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [confirmationDone, setConfirmationDone] = useState(false);

  useEffect(() => {
    // Confirm school immediately on mount
    const confirmSchool = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        const userEmail = session.user.email?.toLowerCase();
        
        if (userEmail) {
          // Find and confirm the school
          const { data: school } = await supabase
            .from('schools')
            .select('id, status, user_id')
            .eq('email', userEmail)
            .maybeSingle();

          if (school && (school.status === 'unconfirmed' || !school.user_id)) {
            const { error } = await supabase
              .from('schools')
              .update({
                status: 'confirmed',
                user_id: session.user.id,
                registered_on: new Date().toISOString()
              })
              .eq('id', school.id);
            
            if (!error) {
              console.log('School confirmed successfully:', school.id);
              setConfirmationDone(true);
            } else {
              console.error('Error confirming school:', error);
            }
          } else if (school?.status === 'confirmed') {
            setConfirmationDone(true);
          }
        }
        
        // Clear pending school ID from localStorage
        localStorage.removeItem('pendingSchoolId');
      }
    };

    confirmSchool();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Countdown timer - 30 seconds
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

  const handleGoToDashboard = () => {
    navigate('/school/dashboard');
  };

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
                strokeDashoffset={251.2 - (countdown / 30) * 251.2}
                className="text-primary transition-all duration-1000 ease-linear"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">{countdown}</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            Redirecting to your dashboard in <span className="font-bold text-primary">{countdown}</span> seconds...
          </p>
          
          {isAuthenticated && (
            <p className="text-xs text-green-500 mb-4">
              ✓ You are now logged in
            </p>
          )}
          
          {confirmationDone && (
            <p className="text-xs text-green-500 mb-4">
              ✓ School account confirmed
            </p>
          )}
          
          <Button
            onClick={handleGoToDashboard}
            className="w-full bg-gradient-to-r from-primary to-primary-glow text-white font-semibold py-3"
          >
            Go to Dashboard Now
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
