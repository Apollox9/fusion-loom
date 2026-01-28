import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Call the Edge Function to confirm school
const confirmSchoolViaFunction = async (user: any) => {
  try {
    const userEmail = user.email?.toLowerCase();
    if (!userEmail) {
      console.error('❌ No user email found');
      return false;
    }

    console.log('🔄 Confirming school for email:', userEmail);

    // Call the Edge Function instead of direct query
    const { data, error } = await supabase.functions.invoke('confirm-school', {
      body: {
        userId: user.id,
        email: userEmail,
      },
    });

    console.log('📊 Raw Edge Function response:', { data, error });

    if (error) {
      console.error('❌ Error confirming school:', error);
      return false;
    }

    // Parse the response - it might be a string
    let parsedData;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
        console.log('📊 Parsed response:', parsedData);
      } catch {
        console.error('❌ Failed to parse response:', data);
        return false;
      }
    } else {
      parsedData = data;
    }

    if (parsedData?.success) {
      console.log('✅ School confirmed successfully:', parsedData.message);
      console.log('📦 Updated school:', parsedData.school);
      console.log('👤 Profile created with location data');
      localStorage.removeItem('pendingSchoolId');
      return true;
    } else {
      console.error('❌ Confirmation failed:', parsedData?.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Exception in confirmSchoolViaFunction:', error);
    console.error('📌 Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return false;
  }
};

export default function VerificationSuccessPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(30);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [confirmationDone, setConfirmationDone] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasProcessed = useRef(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Handle the email verification token exchange
    const handleEmailVerification = async () => {
      // Prevent multiple executions
      if (hasProcessed.current) {
        console.log('⚠️ Already processing verification');
        return;
      }
      hasProcessed.current = true;

      try {
        // Check for hash fragments from email verification (Supabase sends tokens in URL hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('Verification page loaded with type:', type);
        console.log('Has access token:', !!accessToken);
        console.log('Has refresh token:', !!refreshToken);

        // If we have tokens from the email verification, set the session
        if (accessToken && refreshToken) {
          console.log('Setting session with tokens...');
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('Error setting session:', sessionError);
            setErrorMessage('Failed to set session. Please try again.');
            setIsProcessing(false);
            return;
          }

          if (sessionData?.user) {
            console.log('Session set successfully for:', sessionData.user.email);
            setIsAuthenticated(true);
            
            // Add delay to ensure state updates complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const confirmed = await confirmSchoolViaFunction(sessionData.user);
            console.log('Confirmation result:', confirmed);
            
            if (confirmed) {
              setConfirmationDone(true);
            } else {
              setErrorMessage('Failed to confirm school. Please contact support.');
            }
          } else {
            console.log('No user in session');
            setErrorMessage('No user found in session. Please try again.');
          }
        } else {
          // No tokens in URL, try to get existing session
          console.log('No tokens in URL, checking for existing session...');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            console.log('Found existing session for:', session.user.email);
            setIsAuthenticated(true);
            
            // Add delay to ensure state updates complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const confirmed = await confirmSchoolViaFunction(session.user);
            console.log('Confirmation result:', confirmed);
            if (confirmed) {
              setConfirmationDone(true);
            } else {
              setErrorMessage('Failed to confirm school. Please contact support.');
            }
          } else {
            console.log('No session found');
            setErrorMessage('No valid session found. Please request a new verification email.');
          }
        }
      } catch (error) {
        console.error('Error during email verification:', error);
        setErrorMessage('An unexpected error occurred. Please try again.');
      } finally {
        console.log('Setting isProcessing to false');
        setIsProcessing(false);
      }
    };

    handleEmailVerification();

    // Cleanup function
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []); // Empty dependency array - runs only once on mount

  // Start countdown only after processing is done and confirmation was successful
  useEffect(() => {
    if (isProcessing || !confirmationDone) return;

    console.log('Starting countdown...');
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          navigate('/school/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isProcessing, confirmationDone, navigate]);

  const handleGoToDashboard = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    navigate('/school/dashboard');
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-electric-blue/10 p-4">
        <Card className="w-full max-w-lg shadow-electric bg-gradient-card border-border/50 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-foreground">Verifying your email...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait while we confirm your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-electric-blue/10 p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>

        <Card className="w-full max-w-lg shadow-electric bg-gradient-card border-border/50 backdrop-blur-sm animate-scale-in relative z-10">
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-red-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-red-500 mb-4">
              ⚠️ Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 text-center">
            <p className="text-lg text-foreground mb-4">
              {errorMessage}
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Please check your email or contact support for assistance.
            </p>
            
            <Button
              onClick={() => navigate('/auth')}
              className="w-full bg-gradient-to-r from-primary to-primary-glow text-white font-semibold py-3"
            >
              Back to Login
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
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
            <p className="text-xs text-green-500 mb-2">
              ✓ You are now logged in
            </p>
          )}
          
          {confirmationDone && (
            <>
              <p className="text-xs text-green-500 mb-2">
                ✓ School account confirmed
              </p>
              <p className="text-xs text-green-500 mb-4">
                ✓ Profile created with location data
              </p>
            </>
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