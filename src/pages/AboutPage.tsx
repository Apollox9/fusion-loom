import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Target, Users, Award, Zap, Heart, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
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
              <Heart className="w-6 h-6 text-primary" />
              <h1 className="text-lg font-bold font-display">About Us</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold font-display mb-6 leading-tight">
              <span className="text-gradient">Revolutionizing Education</span>
              <br />
              <span className="text-foreground">One School at a Time</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              At Project Fusion, we believe that technology should simplify, not complicate. 
              We're on a mission to transform how schools handle uniform printing, making it 
              effortless, profitable, and sustainable.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-display text-center mb-4">Our Story</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Project Fusion was born from a simple observation: schools across Tanzania were 
                struggling with outdated, inefficient uniform printing processes that drained resources 
                and frustrated administrators, students, and parents alike.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Founded by <strong>Blaqlogic Digitals</strong> in 2024, we set out to create a solution 
                that would not only streamline the printing process but also generate sustainable revenue 
                for educational institutions. Our team of experienced developers, educators, and business 
                strategists came together with one goal: to make uniform printing effortless while 
                empowering schools financially.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, we're proud to serve over 150 schools across the region, processing thousands 
                of uniform orders monthly and helping educational institutions focus on what matters 
                most: education.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center hover-lift">
              <CardHeader>
                <div className="w-16 h-16 rounded-xl bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl font-display">Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  We strive for perfection in every aspect of our platform, from user experience 
                  to print quality, ensuring schools receive nothing but the best.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover-lift">
              <CardHeader>
                <div className="w-16 h-16 rounded-xl bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl font-display">Partnership</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  We view our relationship with schools as true partnerships, working together 
                  to achieve mutual success and educational advancement.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover-lift">
              <CardHeader>
                <div className="w-16 h-16 rounded-xl bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl font-display">Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  We continuously push the boundaries of what's possible, leveraging cutting-edge 
                  technology to solve real-world educational challenges.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover-lift">
              <CardHeader>
                <div className="w-16 h-16 rounded-xl bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl font-display">Empowerment</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  We believe in empowering schools with the tools and revenue streams they need 
                  to thrive and focus on their core educational mission.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover-lift">
              <CardHeader>
                <div className="w-16 h-16 rounded-xl bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl font-display">Integrity</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Transparency, honesty, and ethical practices are at the core of everything we do. 
                  Schools can trust us to deliver on our promises.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover-lift">
              <CardHeader>
                <div className="w-16 h-16 rounded-xl bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl font-display">Sustainability</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  We're committed to creating sustainable solutions that benefit schools, 
                  students, and the environment for generations to come.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Impact */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display mb-4">Our Impact</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real numbers, real results, real difference
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-gradient mb-2">150+</div>
                <div className="text-muted-foreground">Schools Served</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-gradient mb-2">25,000+</div>
                <div className="text-muted-foreground">Uniforms Printed</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-gradient mb-2">98%</div>
                <div className="text-muted-foreground">Satisfaction Rate</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-gradient mb-2">$500K+</div>
                <div className="text-muted-foreground">Revenue Generated</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display mb-4">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground">
              The passionate individuals behind Project Fusion
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-foreground">BD</span>
                </div>
                <h3 className="text-2xl font-bold font-display">Blaqlogic Digitals Team</h3>
                <p className="text-muted-foreground">Founders & Development Team</p>
              </div>
              
              <p className="text-muted-foreground text-center leading-relaxed">
                Our diverse team of software engineers, UX designers, business analysts, and 
                education specialists brings together decades of combined experience in 
                technology, education, and business development. We're united by our passion 
                for creating solutions that make a real difference in the educational sector.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-4xl font-bold text-primary-foreground mb-6 font-display">
              Ready to Join Our Mission?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto">
              Become part of the educational revolution. Let's work together to transform 
              your school's uniform printing process and boost your revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?tab=register">
                <Button size="lg" variant="secondary" className="px-8 py-4 text-lg bg-background text-foreground hover:bg-background/90 hover:scale-105 transition-all duration-300">
                  Join Project Fusion
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;