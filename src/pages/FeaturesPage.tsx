import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Zap, TrendingUp, Users, Clock, Printer, School, BarChart, Smartphone, Cloud, Database, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProjectFusionLogo from '@/assets/project-fusion-logo.png';

const FeatureDetail = ({
  icon: Icon,
  title,
  description,
  features,
  delay = 0
}: {
  icon: any;
  title: string;
  description: string;
  features: string[];
  delay?: number;
}) => (
  <Card className={`hover-lift animate-fade-in-up`} style={{ animationDelay: `${delay}ms` }}>
    <CardHeader>
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-hero flex items-center justify-center">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <CardTitle className="text-2xl font-display">{title}</CardTitle>
          <CardDescription className="text-lg">{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-gradient-hero mt-2 flex-shrink-0"></div>
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const FeaturesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background relative">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-electric-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-neon-accent/5 rounded-full blur-3xl" />
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Header */}
      <header className="border-b border-border/50 bg-background/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center">
              <img 
                src={ProjectFusionLogo} 
                alt="Project Fusion" 
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold font-display mb-6 leading-tight">
              <span className="text-gradient">Comprehensive Features</span>
              <br />
              <span className="text-foreground">for Modern Schools</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Discover all the powerful tools and capabilities that make Project Fusion the ultimate 
              uniform printing management solution for educational institutions.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 px-6 relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display mb-4">Core Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to revolutionize your school's uniform printing process
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FeatureDetail
              icon={School}
              title="Smart School Management"
              description="AI-powered administration tools"
              features={[
                "Multi-school support with unified dashboard",
                "Automated student record management",
                "Bulk import/export capabilities",
                "Real-time analytics and reporting",
                "Class and grade organization",
                "Staff role management"
              ]}
              delay={100}
            />

            <FeatureDetail
              icon={Printer}
              title="Advanced Printing System"
              description="Intelligent printing automation"
              features={[
                "AI-optimized print queue management",
                "Quality control with error detection",
                "Multiple garment type support",
                "Color matching and consistency",
                "Print job tracking and status",
                "Cost calculation and optimization"
              ]}
              delay={200}
            />

            <FeatureDetail
              icon={TrendingUp}
              title="Financial Management"
              description="Complete profit tracking system"
              features={[
                "Real-time revenue dashboard",
                "Automated profit calculations",
                "Multi-tier commission structure",
                "Payment tracking and verification",
                "Financial reporting and analytics",
                "Tax calculation assistance"
              ]}
              delay={300}
            />

            <FeatureDetail
              icon={Users}
              title="Student Portal"
              description="Seamless student experience"
              features={[
                "Intuitive order submission interface",
                "Mobile-optimized design",
                "Payment proof upload system",
                "Order tracking and notifications",
                "Size and color selection tools",
                "Order history and reprints"
              ]}
              delay={400}
            />
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-16 px-6 bg-gradient-to-b from-muted/30 to-background relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display mb-4">Advanced Capabilities</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Cutting-edge technology features that set us apart
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FeatureDetail
              icon={Shield}
              title="Security & Compliance"
              description="Enterprise-grade security"
              features={[
                "HMAC authentication for devices",
                "End-to-end data encryption",
                "GDPR compliance built-in",
                "Regular security audits",
                "Role-based access control",
                "Audit trail and logging"
              ]}
              delay={100}
            />

            <FeatureDetail
              icon={Cloud}
              title="Cloud Infrastructure"
              description="Scalable and reliable platform"
              features={[
                "99.9% uptime guarantee",
                "Auto-scaling infrastructure",
                "Global CDN for fast loading",
                "Automated backups",
                "Disaster recovery systems",
                "24/7 monitoring"
              ]}
              delay={200}
            />

            <FeatureDetail
              icon={BarChart}
              title="Analytics & Insights"
              description="Data-driven decision making"
              features={[
                "Comprehensive reporting dashboard",
                "Predictive analytics",
                "Performance metrics tracking",
                "Custom report generation",
                "Data visualization tools",
                "Export capabilities"
              ]}
              delay={300}
            />

            <FeatureDetail
              icon={Smartphone}
              title="Mobile Experience"
              description="Access anywhere, anytime"
              features={[
                "Progressive Web App (PWA)",
                "Offline functionality",
                "Push notifications",
                "Mobile-first design",
                "Touch-optimized interface",
                "Cross-platform compatibility"
              ]}
              delay={400}
            />
          </div>
        </div>
      </section>

      {/* Integration Features */}
      <section className="py-16 px-6 relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display mb-4">Integration & Automation</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Seamlessly integrate with your existing systems
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FeatureDetail
              icon={Database}
              title="System Integration"
              description="Connect with existing tools"
              features={[
                "Student Information System (SIS) integration",
                "Payment gateway connections",
                "Accounting software compatibility",
                "Email and SMS notifications",
                "Calendar synchronization",
                "Third-party API support"
              ]}
              delay={100}
            />

            <FeatureDetail
              icon={Settings}
              title="Workflow Automation"
              description="Streamline operations"
              features={[
                "Automated order processing",
                "Smart notification triggers",
                "Inventory management alerts",
                "Quality assurance workflows",
                "Delivery scheduling automation",
                "Custom automation rules"
              ]}
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-secondary relative z-10">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-4xl font-bold text-primary-foreground mb-6 font-display">
              Ready to Experience These Features?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto">
              Join hundreds of schools already leveraging these powerful capabilities 
              to transform their uniform printing operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?tab=register">
                <Button size="lg" variant="secondary" className="px-8 py-4 text-lg bg-background text-foreground hover:bg-background/90 hover:scale-105 transition-all duration-300">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300 hover:scale-105">
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;
