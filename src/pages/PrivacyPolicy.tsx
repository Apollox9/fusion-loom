import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
            <CardTitle className="text-3xl font-bold gradient-text mb-4">Privacy Policy</CardTitle>
            <div className="w-16 h-1 bg-gradient-neon mx-auto mb-4 rounded-full"></div>
            <CardDescription className="text-lg text-muted-foreground">
              How we protect and handle your data - Blaqlogic Digitals
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg text-foreground/90 mb-6">
              At Blaqlogic Digitals, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use Project Fusion.
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-medium text-foreground mb-2">School Information</h3>
                    <ul className="list-disc list-inside space-y-2 text-foreground/90">
                      <li>School registration details and contact information</li>
                      <li>Administrative contact details (headmaster, supervisors)</li>
                      <li>Financial and payment information</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-foreground mb-2">Student Data</h3>
                    <ul className="list-disc list-inside space-y-2 text-foreground/90">
                      <li>Student names and class information</li>
                      <li>Garment details and quantities</li>
                      <li>Academic year and session information</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-foreground mb-2">System Usage Data</h3>
                    <ul className="list-disc list-inside space-y-2 text-foreground/90">
                      <li>Login credentials and access logs</li>
                      <li>Printing and audit records</li>
                      <li>System performance and error logs</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>To provide and maintain the Project Fusion service</li>
                  <li>To process garment printing orders and manage inventory</li>
                  <li>To generate audit reports and financial statements</li>
                  <li>To provide customer support and technical assistance</li>
                  <li>To improve our services and develop new features</li>
                  <li>To communicate important updates and service notifications</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Data Protection & Security</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-medium text-foreground mb-2">Confidentiality</h3>
                    <p className="text-foreground/90">
                      All student data is treated with strict confidentiality and is accessible only to authorized personnel within your institution and our support team when necessary for service delivery.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-foreground mb-2">Security Measures</h3>
                    <ul className="list-disc list-inside space-y-2 text-foreground/90">
                      <li>End-to-end encryption for all data transmission</li>
                      <li>Secure cloud storage with regular backups</li>
                      <li>Multi-factor authentication for administrative access</li>
                      <li>Regular security audits and updates</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Sharing & Third Parties</h2>
                <div className="space-y-4">
                  <p className="text-foreground/90">
                    We do <strong>not</strong> sell, trade, or share your personal information with third parties except in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-foreground/90">
                    <li>With your explicit written consent</li>
                    <li>When required by law or legal process</li>
                    <li>To protect our rights, property, or safety</li>
                    <li>With trusted service providers who assist in our operations (under strict confidentiality agreements)</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Retention</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>Student data is retained for the duration of your service contract</li>
                  <li>Audit and financial records are kept for 7 years as required by law</li>
                  <li>System logs are retained for 2 years for security and troubleshooting purposes</li>
                  <li>Upon contract termination, data is securely deleted within 30 days unless legally required to retain</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights</h2>
                <p className="text-foreground/90 mb-3">As a client, you have the right to:</p>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>Access and review all data we hold about your institution</li>
                  <li>Request corrections to inaccurate information</li>
                  <li>Request deletion of your data (subject to legal requirements)</li>
                  <li>Export your data in a standard format</li>
                  <li>Withdraw consent for data processing (may affect service delivery)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Compliance</h2>
                <p className="text-foreground/90">
                  We comply with all applicable local and international data protection regulations, including but not limited to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground/90 mt-3">
                  <li>Tanzania Data Protection Act</li>
                  <li>General Data Protection Regulation (GDPR) principles</li>
                  <li>Educational data protection standards</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Cookies and Tracking</h2>
                <p className="text-foreground/90">
                  We use essential cookies to maintain your session and ensure proper system functionality. We do not use tracking cookies for advertising or marketing purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Updates to This Policy</h2>
                <p className="text-foreground/90">
                  We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. We will notify you of any significant changes via email or through your dashboard.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact Information</h2>
                <p className="text-foreground/90 mb-3">
                  For any privacy-related questions or concerns, please contact us:
                </p>
                <div className="bg-card border border-border/50 rounded-lg p-4">
                  <ul className="space-y-2 text-foreground/90">
                    <li><strong>Email:</strong> privacy@blaqlogic.com</li>
                    <li><strong>Phone:</strong> +255 XXX XXX XXX</li>
                    <li><strong>Address:</strong> Blaqlogic Digitals, Tanzania</li>
                  </ul>
                </div>
              </section>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mt-8">
                <p className="text-foreground font-semibold text-center">
                  Last updated: September 2, 2025
                </p>
                <p className="text-foreground/90 text-center mt-2">
                  By using Project Fusion, you acknowledge that you have read and understand this Privacy Policy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}