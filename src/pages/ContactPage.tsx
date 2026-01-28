import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, Phone, MapPin, Clock, Send, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

const ContactPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Save to database
      const { error } = await supabase
        .from('guest_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        });

      if (error) throw error;

      setIsSubmitted(true);
      
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours."
      });
    } catch (error) {
      console.error('Error submitting message:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error sending your message. Please try again.",
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
                Message Received!
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Thank you for reaching out to us, <strong>{formData.name}</strong>. 
                We've received your message and will respond to <strong>{formData.email}</strong> within 24 hours.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button size="lg" className="px-8 py-4 bg-gradient-hero">
                    Back to Home
                  </Button>
                </Link>
                <Link to="/features">
                  <Button variant="outline" size="lg" className="px-8 py-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
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
              <Mail className="w-6 h-6 text-primary" />
              <h1 className="text-lg font-bold font-display">Contact Us</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-6 leading-tight">
              <span className="text-gradient">Get in Touch</span>
              <br />
              <span className="text-foreground">We're Here to Help</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Have questions about Project Fusion? Need support with your implementation? 
              Want to explore partnership opportunities? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Mail className="w-6 h-6 text-primary" />
                    <span>Email Us</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">General Inquiries</p>
                  <p className="font-semibold">info@projectfusion.cloud</p>
                  <p className="text-muted-foreground mt-4 mb-2">Technical Support</p>
                  <p className="font-semibold">support@projectfusion.cloud</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Phone className="w-6 h-6 text-primary" />
                    <span>Call Us</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">Main Office</p>
                  <p className="font-semibold">+255 682 647 619</p>
                  <p className="text-muted-foreground mt-4 mb-2">Support Hotline</p>
                  <p className="font-semibold">+255 682 647 619</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <MapPin className="w-6 h-6 text-primary" />
                    <span>Visit Us</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">Blaqlogic Digitals</p>
                  <p className="text-muted-foreground">
                    Dar es Salaam, Tanzania<br />
                    East Africa
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-primary" />
                    <span>Business Hours</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monday - Friday</span>
                      <span className="font-semibold">8:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saturday</span>
                      <span className="font-semibold">9:00 AM - 2:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sunday</span>
                      <span className="font-semibold">Closed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-display">Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="What's this about?"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      required
                      rows={6}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-gradient-hero hover:shadow-lg transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Quick answers to common questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How quickly can we get started?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Most schools can be up and running within 48 hours of registration. 
                  Our team provides comprehensive onboarding support.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What support do you offer?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We provide 24/7 technical support, training sessions, and dedicated 
                  account management for all our partner schools.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a minimum order requirement?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Yes, our minimum order requirement is 20 garments per student and at least 50 students per school. 
                  This ensures cost-effective production and quality service delivery.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do payments work?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We accept payments through our designated accounts and mobile money services. 
                  The headmaster or school administrator handles payment during session submission. 
                  See our <Link to="/payment-methods" className="text-primary hover:underline">Payment Methods</Link> for 
                  all supported payment options and account details.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
