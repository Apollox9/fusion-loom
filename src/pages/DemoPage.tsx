import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, CheckCircle, MapPin, Phone, Mail, User, School, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

const DemoPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    location: '',
    headmasterName: '',
    email: '',
    phone: '',
    preferredDate: '',
    message: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.schoolName || !formData.location || !formData.headmasterName || 
        !formData.email || !formData.phone || !formData.preferredDate) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Save to database
      const { error } = await supabase
        .from('demo_requests')
        .insert({
          school_name: formData.schoolName,
          location: formData.location,
          headmaster_name: formData.headmasterName,
          email: formData.email,
          phone: formData.phone,
          preferred_date: formData.preferredDate,
          message: formData.message || null
        });

      if (error) throw error;

      setIsSubmitted(true);
      
      toast({
        title: "Demo Request Submitted!",
        description: "We'll contact you soon to schedule your demo."
      });
    } catch (error) {
      console.error('Error submitting demo request:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
        {/* Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Success Message */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-2xl text-center">
            <div className="animate-fade-in-up">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-4xl font-bold font-display mb-6">
                Demo Request Received!
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Thank you for your interest in Project Fusion. We've received your demo request 
                for <strong>{formData.schoolName}</strong> and will contact you at{' '}
                <strong>{formData.email}</strong> within 24 hours to schedule your personalized demonstration.
              </p>
              
              <Card className="text-left mb-8">
                <CardHeader>
                  <CardTitle>What happens next?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mt-1">1</div>
                    <div>
                      <h4 className="font-semibold">Initial Contact</h4>
                      <p className="text-muted-foreground">Our team will reach out within 24 hours to confirm your demo appointment.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mt-1">2</div>
                    <div>
                      <h4 className="font-semibold">Demo Preparation</h4>
                      <p className="text-muted-foreground">We'll customize the demonstration to match your school's specific needs.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mt-1">3</div>
                    <div>
                      <h4 className="font-semibold">Live Demonstration</h4>
                      <p className="text-muted-foreground">Experience the complete printing workflow from start to finish at your school.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button size="lg" className="px-8 py-4">
                    Back to Home
                  </Button>
                </Link>
                <Link to="/features">
                  <Button variant="outline" size="lg" className="px-8 py-4">
                    Explore Features
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 text-primary" />
              <h1 className="text-lg font-bold font-display">Schedule Demo</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-6 leading-tight">
              <span className="text-gradient">Experience Project Fusion</span>
              <br />
              <span className="text-foreground">Live at Your School</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Schedule a personalized demonstration where our team will visit your school 
              and show you the complete uniform printing process from submission to delivery.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Form */}
      <section className="py-8 px-6">
        <div className="container mx-auto max-w-2xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-display text-center">Request Your Demo</CardTitle>
              <CardDescription className="text-center">
                Fill out the form below and our team will contact you to schedule your personalized demonstration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* School Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <School className="w-5 h-5 text-primary" />
                    <span>School Information</span>
                  </h3>
                  
                  <div>
                    <Label htmlFor="schoolName">School Name *</Label>
                    <Input
                      id="schoolName"
                      type="text"
                      placeholder="Enter your school name"
                      value={formData.schoolName}
                      onChange={(e) => handleInputChange('schoolName', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">School Location *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        type="text"
                        placeholder="City, Region"
                        className="pl-10"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <User className="w-5 h-5 text-primary" />
                    <span>Contact Information</span>
                  </h3>
                  
                  <div>
                    <Label htmlFor="headmasterName">Headmaster/Principal Name *</Label>
                    <Input
                      id="headmasterName"
                      type="text"
                      placeholder="Full name of school head"
                      value={formData.headmasterName}
                      onChange={(e) => handleInputChange('headmasterName', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="school@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+255 XXX XXX XXX"
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Scheduling */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span>Preferred Date</span>
                  </h3>
                  
                  <div>
                    <Label htmlFor="preferredDate">When would you like the demo? *</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Additional Notes (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Any specific requirements or questions for the demo?"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Demo Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-16 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4">What to Expect</h2>
            <p className="text-xl text-muted-foreground">
              Our comprehensive demo will cover everything you need to know
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                  <School className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>System Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  See how easy it is to set up and configure Project Fusion for your school's specific needs.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                  <User className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Student Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Experience the intuitive student portal and see how easy it is for students to place orders.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Live Printing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Watch our team demonstrate the complete printing process from order to finished product.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DemoPage;
