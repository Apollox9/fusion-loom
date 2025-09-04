import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, Printer, TrendingUp, School, Shield, Zap, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

// Animated Counter Component
const AnimatedCounter = ({
  end,
  duration = 2000,
  prefix = "",
  suffix = ""
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span className="font-bold text-3xl text-gradient">
      {prefix}{count.toLocaleString()}{suffix}
    </span>;
};

// Feature Card Component
const FeatureCard = ({
  icon: Icon,
  title,
  description,
  delay = 0
}: {
  icon: any;
  title: string;
  description: string;
  delay?: number;
}) => <Card className={`hover-lift animate-fade-in-up border-primary/20 bg-gradient-to-br from-background to-muted/30`} style={{
  animationDelay: `${delay}ms`
}}>
    <CardHeader>
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary-foreground" />
      </div>
      <CardTitle className="text-xl font-display">{title}</CardTitle>
      <CardDescription className="text-muted-foreground">{description}</CardDescription>
    </CardHeader>
  </Card>;

// How It Works Step Component
const WorkflowStep = ({
  number,
  title,
  description,
  icon: Icon,
  delay = 0
}: {
  number: number;
  title: string;
  description: string;
  icon: any;
  delay?: number;
}) => <div className={`flex flex-col items-center text-center animate-fade-in-up`} style={{
  animationDelay: `${delay}ms`
}}>
    <div className="relative mb-6">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-xl animate-float">
        {number}
      </div>
      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
    </div>
    <h3 className="text-xl font-semibold font-display mb-2">{title}</h3>
    <p className="text-muted-foreground max-w-sm">{description}</p>
  </div>;

const Index = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Printer className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-display">PROJECT FUSION™</h1>
                <p className="text-xs text-muted-foreground">We make it permanent</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Pricing
              </button>
              <Link to="/auth">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  Admin Login
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold font-display mb-6 leading-tight">
              <span className="text-gradient">Effortless Uniform</span>
              <br />
              <span className="text-foreground">Printing for Smart Schools</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Streamline your school's uniform name-printing process with our cloud-based platform. 
              From submission to delivery, we handle everything while you earn profits.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up" style={{
          animationDelay: '200ms'
        }}>
            <Link to="/auth?tab=register">
              <Button size="lg" className="px-8 py-4 text-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:scale-105 transition-all duration-300 animate-glow">
                Join as a School
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/features">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-primary text-primary hover:bg-primary/10">
                Explore Features
              </Button>
            </Link>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fade-in-up" style={{
          animationDelay: '400ms'
        }}>
            <div className="text-center">
              <AnimatedCounter end={150} suffix="+" />
              <p className="text-muted-foreground mt-2">Schools Connected</p>
            </div>
            <div className="text-center">
              <AnimatedCounter end={25000} suffix="+" />
              <p className="text-muted-foreground mt-2">Uniforms Printed</p>
            </div>
            <div className="text-center">
              <AnimatedCounter end={98} suffix="%" />
              <p className="text-muted-foreground mt-2">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to transform your school's uniform printing process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <WorkflowStep number={1} title="School Signup" description="Register your school and set up your printing preferences" icon={School} delay={100} />
            <WorkflowStep number={2} title="Student Submission" description="Students submit their garment details and upload payment proof" icon={Users} delay={200} />
            <WorkflowStep number={3} title="Smart Printing" description="Our AI-optimized system handles all printing automatically" icon={Printer} delay={300} />
            <WorkflowStep number={4} title="Profit & Delivery" description="Track your earnings while we handle delivery to your school" icon={TrendingUp} delay={400} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display mb-4">Why Choose Project Fusion?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for modern schools that value efficiency, transparency, and profitability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={Shield} title="Secure & Reliable" description="Bank-grade security with 99.9% uptime guarantee for peace of mind" delay={100} />
            <FeatureCard icon={Zap} title="Lightning Fast" description="Process hundreds of uniform orders in minutes, not hours" delay={200} />
            <FeatureCard icon={TrendingUp} title="Profit Tracking" description="Real-time earnings dashboard with detailed analytics and reports" delay={300} />
            <FeatureCard icon={Users} title="Student-Friendly" description="Intuitive interface that students can use without training" delay={400} />
            <FeatureCard icon={Clock} title="24/7 Support" description="Round-the-clock assistance to keep your operations running smoothly" delay={500} />
            <FeatureCard icon={Printer} title="Quality Guaranteed" description="Premium printing quality with automated quality control checks" delay={600} />
          </div>
        </div>
      </section>

      {/* Profit Tiers Section */}
      <section id="pricing" className="py-20 px-6 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display mb-4">Transparent Profit Structure</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The more students you onboard, the higher your profit percentage
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{
            range: "< 100",
            percentage: "5%",
            color: "from-muted to-muted-foreground"
          }, {
            range: "100-200",
            percentage: "8%",
            color: "from-primary/60 to-primary"
          }, {
            range: "200-500",
            percentage: "10%",
            color: "from-primary to-secondary"
          }, {
            range: "500+",
            percentage: "18%",
            color: "from-secondary to-accent"
          }].map((tier, index) => <Card key={index} className={`text-center hover-lift animate-fade-in-up`} style={{
            animationDelay: `${index * 100}ms`
          }}>
                <CardHeader>
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-primary-foreground font-bold text-lg">{tier.percentage}</span>
                  </div>
                  <CardTitle className="text-xl font-display">{tier.range} Students</CardTitle>
                  <CardDescription>Profit percentage on each uniform printed</CardDescription>
                </CardHeader>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-secondary">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-4xl font-bold text-primary-foreground mb-6 font-display">
              Ready to Transform Your School's Uniform Process?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto">
              Join hundreds of schools already using Project Fusion to streamline their operations and increase profits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?tab=register">
                <Button size="lg" variant="secondary" className="px-8 py-4 text-lg bg-background text-foreground hover:bg-background/90 hover:scale-105 transition-all duration-300">
                  Get Started Now
                  <ArrowRight className="ml-2 w-5 h-5" />
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

      {/* Footer */}
      <footer className="py-16 px-6 bg-gray-900 text-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Logo & About */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Printer className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold font-display text-xl">PROJECT FUSION™</h3>
                  <p className="text-sm text-gray-400">We make it permanent</p>
                </div>
              </div>
              <p className="text-gray-300 max-w-md leading-relaxed">
                Revolutionizing school uniform printing with cutting-edge technology and seamless automation. 
                We empower schools to streamline their operations while maximizing profitability.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-3">
                <Link to="/terms" className="block text-gray-300 hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
                <Link to="/privacy" className="block text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/about" className="block text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
                <Link to="/contact" className="block text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <span className="text-sm font-bold">f</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <span className="text-sm font-bold">ig</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <span className="text-sm font-bold">X</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <span className="text-sm font-bold">yt</span>
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              ©2025 Blaqlogic Digitals. All rights reserved.
            </div>
            <div className="text-gray-400 text-sm">
              PROJECT FUSION™ is a trademark of Blaqlogic Digitals.
            </div>
          </div>
        </div>
      </footer>
    </div>;
};

export default Index;
