import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [signInForm, setSignInForm] = useState({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState({
    // Step 1: School Information
    schoolName: '',
    headmasterName: '',
    schoolType: '',
    studentCount: '',
    
    // Step 2: Contact Details
    email: '',
    phone: '',
    address: '',
    country: '',
    region: '',
    district: '',
    promoCode: '', // Agent ID or Invitational Code (optional)
    
    // Step 3: Account Security
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    receiveUpdates: false
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(signInForm.email, signInForm.password);

    if (error) {
      toast({
        title: 'Sign In Failed',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.'
      });
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Here you would implement forgot password functionality
    // For now, we'll just show a success message
    setTimeout(() => {
      setEmailSent(true);
      setLoading(false);
      toast({
        title: 'Recovery Email Sent',
        description: `We've sent account recovery instructions to ${forgotEmail}`
      });
    }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate promo code if provided
      let agentId: string | null = null;
      let promoCodeUsed: string | null = null;
      
      if (registerForm.promoCode.trim()) {
        const normalizedCode = registerForm.promoCode.trim().toUpperCase();
        
        // First check if it's an invitational code
        const { data: codeData, error: codeError } = await supabase
          .from('agent_invitational_codes')
          .select('*, agents!inner(id, user_id)')
          .eq('code', normalizedCode)
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (codeData) {
          agentId = codeData.agent_id;
          promoCodeUsed = codeData.code;
        } else {
          // Check if it's a staff ID (agent's promo code)
          const { data: staffData } = await supabase
            .from('staff')
            .select('user_id')
            .ilike('staff_id', normalizedCode)
            .eq('role', 'AGENT')
            .maybeSingle();

          if (staffData) {
            const { data: agentData } = await supabase
              .from('agents')
              .select('id')
              .eq('user_id', staffData.user_id)
              .single();

            if (agentData) {
              agentId = agentData.id;
              promoCodeUsed = normalizedCode;
            }
          }
        }

        // If code provided but not found/valid, show warning but continue
        if (!agentId && registerForm.promoCode.trim()) {
          toast({
            title: 'Invalid Promo Code',
            description: 'The promo code entered is invalid or expired. Registration will continue without referral.',
            variant: 'destructive'
          });
        }
      }

      const { error } = await signUp(
        registerForm.email,
        registerForm.password,
        registerForm.headmasterName,
        'SCHOOL_USER'
      );

      if (error) {
        toast({
          title: 'Registration Failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        // Store promo code info in localStorage temporarily for post-confirmation processing
        if (agentId && promoCodeUsed) {
          localStorage.setItem('pendingReferral', JSON.stringify({
            agentId,
            promoCode: promoCodeUsed,
            schoolName: registerForm.schoolName,
            email: registerForm.email
          }));
        }
        
        setEmailSent(true);
        toast({
          title: 'School Registered!',
          description: `We've sent a confirmation email to ${registerForm.email}`
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    }

    setLoading(false);
  };

  const isStep1Valid = () => {
    return registerForm.schoolName && registerForm.headmasterName && 
           registerForm.schoolType && registerForm.studentCount;
  };

  const isStep2Valid = () => {
    return registerForm.email && registerForm.phone && registerForm.address && 
           registerForm.country && registerForm.region && registerForm.district;
  };

  const isStep3Valid = () => {
    return registerForm.password && registerForm.confirmPassword && 
           registerForm.password === registerForm.confirmPassword && 
           registerForm.agreeTerms;
  };

  const passwordsMatch = () => {
    if (!registerForm.confirmPassword) return true;
    return registerForm.password === registerForm.confirmPassword;
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-electric-blue/10 p-4 relative overflow-hidden">
        <Card className="w-full max-w-lg shadow-electric bg-gradient-card border-border/50 backdrop-blur-sm animate-scale-in relative z-10">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold gradient-text mb-4">Check Your Email</CardTitle>
            <div className="w-16 h-1 bg-gradient-neon mx-auto mb-4 rounded-full"></div>
          </CardHeader>
          <CardContent className="px-8 pb-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-muted-foreground">
                We've sent a confirmation email to <strong>{mode === 'register' ? registerForm.email : forgotEmail}</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Please check your email and click the link to {mode === 'register' ? 'activate your account' : 'reset your password'}.
              </p>
            </div>
            <Button 
              onClick={() => {
                setEmailSent(false);
                setShowForgotPassword(false);
                setMode('signin');
              }}
              variant="outline"
              className="w-full"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-electric-blue/10 p-4 relative overflow-hidden">
        <Card className="w-full max-w-lg shadow-electric bg-gradient-card border-border/50 backdrop-blur-sm animate-scale-in relative z-10">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold gradient-text mb-4">Forgot Password</CardTitle>
            <div className="w-16 h-1 bg-gradient-neon mx-auto mb-4 rounded-full"></div>
            <CardDescription className="text-lg text-muted-foreground">
              Enter your email to receive password reset instructions
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="forgot-email" className="text-sm font-semibold text-foreground">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  placeholder="your.email@school.edu"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-hero text-white shadow-primary hover:shadow-electric transition-all duration-300 font-semibold text-lg hover-lift" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Send Recovery Email
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-electric-blue/10 p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-electric-blue/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-accent/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      <Card className={`w-full shadow-electric bg-gradient-card border-border/50 backdrop-blur-sm animate-scale-in relative z-10 ${
        mode === 'register' ? 'max-w-2xl' : 'max-w-lg'
      }`}>
        <CardHeader className="text-center pb-4">
          <Link to="/">
            <CardTitle className="text-3xl font-bold gradient-text mb-4 hover:text-primary transition-colors cursor-pointer">Project Fusion</CardTitle>
          </Link>
          <div className="w-16 h-1 bg-gradient-neon mx-auto mb-4 rounded-full"></div>
          <CardDescription className="text-lg text-muted-foreground">
            {mode === 'signin' ? 'Access your intelligent school management dashboard' : 'Register your school with Project Fusion'}
          </CardDescription>
        </CardHeader>
        <CardContent className={`px-8 pb-6 ${mode === 'register' ? 'max-h-[80vh] overflow-y-auto' : ''}`}>
          {mode === 'register' && (
            <>
              {/* Step Indicators */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center">
                  {[1, 2, 3].map((step, index) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        currentStep > step 
                          ? 'bg-primary text-primary-foreground' 
                          : currentStep === step 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {currentStep > step ? <Check className="w-4 h-4" /> : step}
                      </div>
                      {index < 2 && (
                        <div className={`w-12 h-1 mx-2 transition-all duration-500 ${
                          currentStep > step + 1 ? 'bg-primary' : 'bg-muted'
                        }`}>
                          {currentStep === step + 1 && (
                            <div className="h-full bg-primary animate-pulse" style={{width: '50%'}} />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Titles */}
              <div className="text-center mb-4">
                {currentStep === 1 && (
                  <>
                    <h3 className="text-lg font-semibold text-foreground">School Information</h3>
                    <p className="text-sm text-muted-foreground mt-1">Basic details about your institution</p>
                  </>
                )}
                {currentStep === 2 && (
                  <>
                    <h3 className="text-lg font-semibold text-foreground">Contact Details</h3>
                    <p className="text-sm text-muted-foreground mt-1">How we can reach you</p>
                  </>
                )}
                {currentStep === 3 && (
                  <>
                    <h3 className="text-lg font-semibold text-foreground">Account Security</h3>
                    <p className="text-sm text-muted-foreground mt-1">Setup your login credentials</p>
                  </>
                )}
              </div>
            </>
          )}

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="signin-email" className="text-sm font-semibold text-foreground">Email Address</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={signInForm.email}
                  onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                  required
                  className="h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  placeholder="your.email@school.edu"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="signin-password" className="text-sm font-semibold text-foreground">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={signInForm.password}
                  onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                  required
                  className="h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  placeholder="Enter your password"
                />
                
                {/* Remember Me and Forgot Password */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-me" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember-me" className="text-sm text-muted-foreground">Remember me</Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline font-normal"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-hero text-white shadow-primary hover:shadow-electric transition-all duration-300 font-semibold text-lg hover-lift" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Sign In to Dashboard
              </Button>
              
              {/* Sign Up Link */}
              <div className="text-center mt-4">
                <span className="text-sm text-muted-foreground">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-sm text-primary hover:underline font-bold"
                >
                  Register your school
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Step 1: School Information */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="school-name" className="text-sm font-semibold text-foreground">School Name</Label>
                     <Input
                       id="school-name"
                       type="text"
                       value={registerForm.schoolName}
                       onChange={(e) => setRegisterForm({ ...registerForm, schoolName: e.target.value.toUpperCase() })}
                       required
                       className="h-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                       placeholder="Enter your school name"
                     />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="headmaster-name" className="text-sm font-semibold text-foreground">Headmaster Name</Label>
                     <Input
                       id="headmaster-name"
                       type="text"
                       value={registerForm.headmasterName}
                       onChange={(e) => setRegisterForm({ ...registerForm, headmasterName: e.target.value.toUpperCase() })}
                       required
                       className="h-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                       placeholder="Enter headmaster's full name"
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="school-type" className="text-sm font-semibold text-foreground">School Type</Label>
                      <Select value={registerForm.schoolType} onValueChange={(value) => setRegisterForm({ ...registerForm, schoolType: value })}>
                        <SelectTrigger className="h-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary School</SelectItem>
                          <SelectItem value="secondary">Secondary School</SelectItem>
                          <SelectItem value="high">High School</SelectItem>
                          <SelectItem value="combined">Combined School</SelectItem>
                          <SelectItem value="college">College</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="student-count" className="text-sm font-semibold text-foreground">Student Count</Label>
                      <Select value={registerForm.studentCount} onValueChange={(value) => setRegisterForm({ ...registerForm, studentCount: value })}>
                        <SelectTrigger className="h-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="less-100">Less than 100</SelectItem>
                          <SelectItem value="100-200">100-200</SelectItem>
                          <SelectItem value="200-500">200-500</SelectItem>
                          <SelectItem value="500+">500+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Contact Details */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-foreground">Official Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                      className="h-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                      placeholder="school@example.edu"
                    />
                  </div>
                  
                   <div className="grid grid-cols-3 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="country" className="text-sm font-semibold text-foreground">Country</Label>
                       <Input
                         id="country"
                         type="text"
                         value={registerForm.country}
                         onChange={(e) => setRegisterForm({ ...registerForm, country: e.target.value.toUpperCase() })}
                         required
                         className="h-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 uppercase"
                         placeholder="TANZANIA"
                       />
                     </div>
                     
                     <div className="space-y-2">
                       <Label htmlFor="region" className="text-sm font-semibold text-foreground">Region/State</Label>
                       <Input
                         id="region"
                         type="text"
                         value={registerForm.region}
                         onChange={(e) => setRegisterForm({ ...registerForm, region: e.target.value.toUpperCase() })}
                         required
                         className="h-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 uppercase"
                         placeholder="DAR ES SALAAM"
                       />
                     </div>
                     
                     <div className="space-y-2">
                       <Label htmlFor="district" className="text-sm font-semibold text-foreground">District</Label>
                       <Input
                         id="district"
                         type="text"
                         value={registerForm.district}
                         onChange={(e) => setRegisterForm({ ...registerForm, district: e.target.value.toUpperCase() })}
                         required
                         className="h-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 uppercase"
                         placeholder="KINONDONI"
                       />
                     </div>
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="phone" className="text-sm font-semibold text-foreground">Phone Number</Label>
                     <Input
                       id="phone"
                       type="tel"
                       value={registerForm.phone}
                       onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value.toUpperCase() })}
                       required
                       className="h-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 uppercase"
                       placeholder="+255 123 456 789"
                     />
                   </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-semibold text-foreground">School Address</Label>
                    <Textarea
                      id="address"
                      value={registerForm.address}
                      onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                      required
                      className="min-h-[80px] bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                      placeholder="Enter your school's full address"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="promo-code" className="text-sm font-semibold text-foreground">
                      Agent ID / Promo Code <span className="text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="promo-code"
                      type="text"
                      value={registerForm.promoCode}
                      onChange={(e) => setRegisterForm({ ...registerForm, promoCode: e.target.value.toUpperCase() })}
                      className="h-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 uppercase font-mono"
                      placeholder="e.g., AGENT123ABC or ABC123XYZ0"
                    />
                    <p className="text-xs text-muted-foreground">
                      If you have an agent's promo code or invitational code, enter it here
                    </p>
                  </div>
                </>
              )}

              {/* Step 3: Account Security */}
              {currentStep === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                        className="h-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 pr-12"
                        placeholder="Enter a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Use at least 8 characters with a mix of letters, numbers, and symbols</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-semibold text-foreground">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        required
                        className="h-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 pr-12"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {!passwordsMatch() && registerForm.confirmPassword && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="agree-terms" 
                        checked={registerForm.agreeTerms}
                        onCheckedChange={(checked) => setRegisterForm({ ...registerForm, agreeTerms: checked as boolean })}
                        className="mt-1"
                      />
                      <Label htmlFor="agree-terms" className="text-sm text-muted-foreground leading-relaxed">
                        I agree to the{' '}
                        <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                      </Label>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="receive-updates" 
                        checked={registerForm.receiveUpdates}
                        onCheckedChange={(checked) => setRegisterForm({ ...registerForm, receiveUpdates: checked as boolean })}
                        className="mt-1"
                      />
                      <Label htmlFor="receive-updates" className="text-sm text-muted-foreground leading-relaxed">
                        I'd like to receive updates about new features and improvements
                      </Label>
                    </div>
                  </div>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={currentStep === 1 ? () => setMode('signin') : prevStep}
                  className="px-6"
                >
                  {currentStep === 1 ? 'Already have an account?' : 'Previous'}
                </Button>
                
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      (currentStep === 1 && !isStep1Valid()) ||
                      (currentStep === 2 && !isStep2Valid())
                    }
                    className="px-6"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!isStep3Valid() || loading}
                    className="px-6"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                )}
              </div>
            </form>
          )}
          
          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <Link 
                to="/terms" 
                className="hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Terms & Conditions
              </Link>
              <span className="text-border">•</span>
              <Link 
                to="/privacy" 
                className="hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
              <span className="text-border">•</span>
              <Link 
                to="/help" 
                className="hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Help & Support
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground/70">
              © 2025 Blaqlogic Digitals. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}