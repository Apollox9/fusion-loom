import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Mail, MessageCircle, Clock, HelpCircle, Book, Users, Wrench } from 'lucide-react';

export default function HelpSupport() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-electric-blue/10 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/auth">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </Link>
        </div>

        <Card className="shadow-electric bg-gradient-card border-border/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold gradient-text mb-4">Help & Support</CardTitle>
            <div className="w-16 h-1 bg-gradient-neon mx-auto mb-4 rounded-full"></div>
            <CardDescription className="text-lg text-muted-foreground">
              Get assistance with Project Fusion - We're here to help!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center">
                <Phone className="mr-3 h-6 w-6 text-primary" />
                Contact Our Support Team
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-6 text-center">
                    <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Phone Support</h3>
                    <p className="text-foreground/70 mb-3">Call us directly for urgent issues</p>
                    <p className="text-foreground font-medium">+255 XXX XXX XXX</p>
                    <p className="text-sm text-foreground/60 mt-2">Mon-Fri: 8AM-6PM EAT</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-6 text-center">
                    <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">WhatsApp</h3>
                    <p className="text-foreground/70 mb-3">Quick responses via WhatsApp</p>
                    <p className="text-foreground font-medium">+255 XXX XXX XXX</p>
                    <p className="text-sm text-foreground/60 mt-2">Available 24/7</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-6 text-center">
                    <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Email Support</h3>
                    <p className="text-foreground/70 mb-3">Detailed support via email</p>
                    <p className="text-foreground font-medium">support@blaqlogic.com</p>
                    <p className="text-sm text-foreground/60 mt-2">Response within 4 hours</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Support Categories */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center">
                <HelpCircle className="mr-3 h-6 w-6 text-primary" />
                What We Can Help You With
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Wrench className="h-8 w-8 text-primary mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Technical Issues</h3>
                        <ul className="text-foreground/70 space-y-1 text-sm">
                          <li>• System login problems</li>
                          <li>• Printer connectivity issues</li>
                          <li>• Software updates and bugs</li>
                          <li>• Hardware troubleshooting</li>
                          <li>• Data synchronization problems</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Users className="h-8 w-8 text-primary mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Account Management</h3>
                        <ul className="text-foreground/70 space-y-1 text-sm">
                          <li>• User account setup</li>
                          <li>• Password resets</li>
                          <li>• Role and permission changes</li>
                          <li>• School profile updates</li>
                          <li>• Access level modifications</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Book className="h-8 w-8 text-primary mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Training & Guidance</h3>
                        <ul className="text-foreground/70 space-y-1 text-sm">
                          <li>• System walkthrough sessions</li>
                          <li>• Best practices training</li>
                          <li>• Audit process guidance</li>
                          <li>• Report generation help</li>
                          <li>• Workflow optimization</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Clock className="h-8 w-8 text-primary mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Billing & Payments</h3>
                        <ul className="text-foreground/70 space-y-1 text-sm">
                          <li>• Payment processing help</li>
                          <li>• Invoice and billing questions</li>
                          <li>• Reward calculation queries</li>
                          <li>• Payment method setup</li>
                          <li>• Financial report assistance</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Response Times */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center">
                <Clock className="mr-3 h-6 w-6 text-primary" />
                Support Response Times
              </h2>
              <div className="bg-card/50 border border-border/50 rounded-lg p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-2">Critical Issues</div>
                    <div className="text-foreground/70">Within 1 hour</div>
                    <div className="text-sm text-foreground/60 mt-1">System down, login failures</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-2">General Support</div>
                    <div className="text-foreground/70">Within 4 hours</div>
                    <div className="text-sm text-foreground/60 mt-1">Feature questions, training</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-2">Enhancement Requests</div>
                    <div className="text-foreground/70">Within 24 hours</div>
                    <div className="text-sm text-foreground/60 mt-1">Feature requests, improvements</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Emergency Contact */}
            <section>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center">
                  <Phone className="mr-2 h-5 w-5 text-destructive" />
                  Emergency Support
                </h3>
                <p className="text-foreground/90 mb-3">
                  For critical system failures affecting ongoing operations (printing stopped, system completely inaccessible):
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <p className="font-semibold text-foreground">Emergency Hotline:</p>
                    <p className="text-foreground">+255 XXX XXX XXX</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Available:</p>
                    <p className="text-foreground">24/7 for critical issues</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Before Contacting Support */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">Before Contacting Support</h2>
              <div className="bg-card/50 border border-border/50 rounded-lg p-6">
                <p className="text-foreground/90 mb-4">To help us assist you faster, please have the following information ready:</p>
                <ul className="list-disc list-inside space-y-2 text-foreground/70">
                  <li>Your school name and registration details</li>
                  <li>The specific page or feature you're having trouble with</li>
                  <li>Any error messages you're seeing</li>
                  <li>Steps you've already tried to resolve the issue</li>
                  <li>Screenshots or photos of the problem (if applicable)</li>
                </ul>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}