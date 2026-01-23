import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, Printer, TrendingUp, School, Shield, Zap, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroSlideshow } from '@/components/landing/HeroSlideshow';
import FacebookIcon from '@/assets/icons/facebook.svg';
import InstagramIcon from '@/assets/icons/instagram.svg';
import TwitterIcon from '@/assets/icons/twitter.svg';
import YoutubeIcon from '@/assets/icons/youtube.svg';
import ProjectFusionLogo from '@/assets/project-fusion-logo.png';
import ProjectFusionLogoMono from '@/assets/project-fusion-logo-mono.png';

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
  return <span className="font-bold text-3xl md:text-4xl text-white drop-shadow-lg">
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
      <div className="w-12 h-12 rounded-lg bg-gradient-hero flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white" />
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
      <div className="w-16 h-16 rounded-full bg-gradient-hero flex items-center justify-center text-white font-bold text-xl animate-float">
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

  return <div className="min-h-screen bg-background relative">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-electric-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-neon-accent/5 rounded-full blur-3xl" />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Header - with blur effect */}
      <header className="border-b border-border/50 bg-background/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src={ProjectFusionLogo} 
                alt="Project Fusion" 
                className="h-10 w-auto object-contain"
              />
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

      {/* Hero Section - Full viewport with slideshow */}
      <section className="relative h-[calc(100vh-65px)] overflow-hidden">
        {/* Slideshow as background */}
        <HeroSlideshow 
          autoPlayInterval={4000}
          className="absolute inset-0"
        />

        {/* Content overlay */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
          <div className="animate-fade-in-up max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display mb-6 leading-tight text-white drop-shadow-2xl">
              Automated Uniform
              <br />
              Printing for Smart Schools
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
              Streamline your school's uniform name-printing process with our cloud-based platform. 
              From submission to delivery, we handle everything while you earn profits.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link to="/auth?tab=register">
                <Button size="lg" className="px-8 py-4 text-lg bg-gradient-hero hover:shadow-lg hover:scale-105 transition-all duration-300 animate-glow">
                  Join as a School
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/features">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-white text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm">
                  Explore Features
                </Button>
              </Link>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto">
              <div className="text-center bg-black/20 backdrop-blur-sm rounded-xl p-4">
                <AnimatedCounter end={150} suffix="+" />
                <p className="text-white/80 mt-1 text-sm md:text-base">Schools Connected</p>
              </div>
              <div className="text-center bg-black/20 backdrop-blur-sm rounded-xl p-4">
                <AnimatedCounter end={25000} suffix="+" />
                <p className="text-white/80 mt-1 text-sm md:text-base">Uniforms Printed</p>
              </div>
              <div className="text-center bg-black/20 backdrop-blur-sm rounded-xl p-4">
                <AnimatedCounter end={98} suffix="%" />
                <p className="text-white/80 mt-1 text-sm md:text-base">Success Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-background relative z-10">
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
      <section id="features" className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background relative z-10">
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
      <section id="pricing" className="py-20 px-6 bg-background relative z-10">
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
                  <div className={`w-16 h-16 rounded-full ${tier.color === 'from-muted to-muted-foreground' ? 'bg-gradient-to-br from-muted to-muted-foreground' : 'bg-gradient-hero'} flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-white font-bold text-lg">{tier.percentage}</span>
                  </div>
                  <CardTitle className="text-xl font-display">{tier.range} Students</CardTitle>
                  <CardDescription>Profit percentage on each uniform printed</CardDescription>
                </CardHeader>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Section - Vertical gradient that blends into footer */}
      <section className="py-20 px-6 relative z-10" style={{ background: 'linear-gradient(to bottom, hsl(235 75% 28%), hsl(210 98% 55%), hsl(220 30% 15%))' }}>
        <div className="container mx-auto text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-4xl font-bold text-white mb-6 font-display">
              Ready to Transform Your School's Uniform Process?
            </h2>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
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
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-white text-white hover:bg-white/10 transition-all duration-300 hover:scale-105">
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-gray-900 text-white relative z-10">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Logo & About */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src={ProjectFusionLogoMono} 
                  alt="Project Fusion" 
                  className="h-8 w-auto object-contain"
                />
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
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                   className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors p-2">
                  <img src={FacebookIcon} alt="Facebook" className="w-full h-full" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" 
                   className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors p-2">
                  <img src={InstagramIcon} alt="Instagram" className="w-full h-full" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" 
                   className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors p-2">
                  <img src={TwitterIcon} alt="Twitter" className="w-full h-full" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" 
                   className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors p-2">
                  <img src={YoutubeIcon} alt="YouTube" className="w-full h-full" />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              ©2026 Blaqlogic Digitals. All rights reserved.
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
