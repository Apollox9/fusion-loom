import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
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
            <CardTitle className="text-3xl font-bold gradient-text mb-4">Terms and Conditions</CardTitle>
            <div className="w-16 h-1 bg-gradient-neon mx-auto mb-4 rounded-full"></div>
            <CardDescription className="text-lg text-muted-foreground">
              Project Fusion - Blaqlogic Digitals
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg text-foreground/90 mb-6">
              Welcome to Project Fusion, a service by Blaqlogic Digitals. By accessing or using our platform, systems, or services, you agree to be bound by the following terms and conditions:
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Definitions</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li><strong>"Company"</strong> refers to Blaqlogic Digitals.</li>
                  <li><strong>"Client"</strong> refers to any registered school, institution, or organization using Project Fusion.</li>
                  <li><strong>"User"</strong> refers to individuals (e.g., headmasters, auditors, packers, operators) authorized by the Client.</li>
                  <li><strong>"Platform"</strong> refers to the web and embedded systems used in the name-printing and garment management solution.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Eligibility</h2>
                <p className="text-foreground/90">
                  Clients must be officially registered educational institutions. Users must be authorized by the client and 18 years or older to operate the system.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Use of Service</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>Clients agree to use Project Fusion only for its intended purpose: managing student garment name printing through our integrated system.</li>
                  <li>Any misuse, reverse-engineering, or resale of the platform is strictly prohibited.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Registration & Accounts</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>Clients must provide accurate school and contact information during registration.</li>
                  <li>Clients are responsible for maintaining the confidentiality of login credentials.</li>
                  <li>Blaqlogic reserves the right to suspend access if fraudulent activity is detected.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Garment & Printing Policy</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>A minimum of 20 garments per student is required to initiate printing.</li>
                  <li>We recommend categorizing classes into smallest units (Streams), for easy management.</li>
                  <li>Each garment is priced at TZS 500, with any garments beyond 20 charged at TZS 300.</li>
                  <li>Blaqlogic is not responsible for incorrect garment counts if not verified by the school.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Profit Sharing & Rewards</h2>
                <p className="text-foreground/90 mb-3">Schools are eligible for a reward based on the number of students:</p>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>&lt;100 students: 5%</li>
                  <li>100–199 students: 8%</li>
                  <li>200–499 students: 10%</li>
                  <li>500+ students: 18%</li>
                </ul>
                <p className="text-foreground/90 mt-3">
                  The final reward is calculated in real time in the Shares & Submission tab.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Payments</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>Payments must be completed and verified before any printing process can begin.</li>
                  <li>All payment methods are found in the Support & Contact tab.</li>
                  <li>No refunds will be issued once printing has started.</li>
                  <li>Any financial disputes must be raised within 7 working days of transaction.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Hardware & System Usage</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>The printing system includes sensitive mechanical and ink-based components.</li>
                  <li>Clients must not tamper with the hardware or software components of the printer.</li>
                  <li>Damage caused by mishandling will void support and may incur repair charges.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Support & Maintenance</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>Clients can contact support via email, WhatsApp, or phone for issues related to the system.</li>
                  <li>System updates may be rolled out without prior notice to improve performance or security.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Privacy Policy</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>All student data is treated with strict confidentiality.</li>
                  <li>Data will not be shared with third parties without the client's explicit consent.</li>
                  <li>We comply with local data protection regulations.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">11. Intellectual Property</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>All code, hardware designs, UI elements, and embedded logic are the intellectual property of Blaqlogic Digitals.</li>
                  <li>Clients may not reproduce, redistribute, or clone the platform in any form.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">12. Limitation of Liability</h2>
                <p className="text-foreground/90 mb-3">Blaqlogic Digitals is not liable for:</p>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>Power outages, machine wear or third-party material defects.</li>
                  <li>Missed printing deadlines due to unverified payments or late garment submissions.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">13. Termination</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>Blaqlogic may suspend or terminate access if these terms are violated.</li>
                  <li>Clients may cancel their contract with 14 days' notice, provided all dues are cleared.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">14. Changes to Terms</h2>
                <p className="text-foreground/90">
                  These terms may be updated periodically. Clients will be notified via the dashboard or email when changes occur.
                </p>
              </section>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mt-8">
                <p className="text-foreground font-semibold text-center">
                  By using Project Fusion, we acknowledge that you have read, understood, and agreed to these terms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}