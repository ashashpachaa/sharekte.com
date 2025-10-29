import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompanyTable } from "@/components/CompanyTable";
import { ArrowRight, TrendingUp, Users, Zap, Shield, BarChart3, Globe, CheckCircle2 } from "lucide-react";

export default function Index() {
  const featuredCompanies = [
    {
      id: 1,
      name: "TechFlow Solutions",
      revenue: "$2.5M",
      industry: "SaaS",
      yearsInBusiness: 5,
      employees: 12,
      image: "bg-gradient-to-br from-blue-400 to-blue-600",
      description: "Cloud-based project management platform",
      roi: "45%"
    },
    {
      id: 2,
      name: "GreenLeaf Organic",
      revenue: "$1.8M",
      industry: "E-Commerce",
      yearsInBusiness: 7,
      employees: 18,
      image: "bg-gradient-to-br from-green-400 to-green-600",
      description: "Sustainable product marketplace",
      roi: "38%"
    },
    {
      id: 3,
      name: "FitLife Digital",
      revenue: "$3.2M",
      industry: "SaaS",
      yearsInBusiness: 6,
      employees: 24,
      image: "bg-gradient-to-br from-red-400 to-orange-600",
      description: "Fitness coaching & training platform",
      roi: "52%"
    },
    {
      id: 4,
      name: "CloudSync Backup",
      revenue: "$1.5M",
      industry: "B2B Software",
      yearsInBusiness: 4,
      employees: 8,
      image: "bg-gradient-to-br from-purple-400 to-purple-600",
      description: "Enterprise backup solutions",
      roi: "41%"
    }
  ];

  const features = [
    {
      icon: Globe,
      title: "Global Marketplace",
      description: "Access thousands of verified, revenue-generating businesses from around the world."
    },
    {
      icon: TrendingUp,
      title: "Transparent Metrics",
      description: "Real financial data, growth trajectories, and proven business models you can analyze."
    },
    {
      icon: Shield,
      title: "Secure Transactions",
      description: "Escrow protection, legal documentation, and buyer safeguards on every purchase."
    },
    {
      icon: Users,
      title: "Expert Support",
      description: "Dedicated advisors guide you through due diligence and acquisition process."
    },
    {
      icon: BarChart3,
      title: "Business Dashboard",
      description: "Comprehensive analytics and management tools for the companies you own."
    },
    {
      icon: Zap,
      title: "Instant Onboarding",
      description: "Quick handoff and transition support to get your business running smoothly."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-background"></div>
        <div className="relative container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Buy Established
                  <span className="block text-primary">Businesses Today</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                  Discover and acquire proven, revenue-generating companies globally. Skip the startup phase and step into profitability.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary-600 text-white h-12 px-8 rounded-lg font-semibold text-base"
                  asChild
                >
                  <Link to="/dashboard" className="flex items-center gap-2">
                    Start Browsing
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 rounded-lg font-semibold text-base"
                >
                  Watch Demo
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/40">
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-primary">2500+</p>
                  <p className="text-sm text-muted-foreground">Businesses Listed</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-primary">$4.2B</p>
                  <p className="text-sm text-muted-foreground">GMV in 2024</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-primary">85%</p>
                  <p className="text-sm text-muted-foreground">Buyer Satisfaction</p>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-20 rounded-2xl blur-3xl"></div>
                <div className="relative bg-gradient-to-br from-primary to-primary-600 rounded-2xl p-8 text-white">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">Annual Revenue</p>
                        <p className="text-2xl font-bold">$2.5M+</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">Team Size</p>
                        <p className="text-2xl font-bold">15+ Employees</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">Average ROI</p>
                        <p className="text-2xl font-bold">44%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Marketplace Table Section */}
      <section className="py-20 md:py-28 border-t border-border/40 bg-muted/20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Browse All Companies
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our complete marketplace of verified businesses. Filter by country and incorporation year to find your perfect match.
            </p>
          </div>
          <CompanyTable />
        </div>
      </section>

      {/* Featured Companies Section */}
      <section id="companies" className="py-20 md:py-28 border-t border-border/40">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Featured Businesses
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Handpicked, profitable companies ready for immediate acquisition
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCompanies.map((company) => (
              <div key={company.id} className="group border border-border/40 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                <div className={`${company.image} h-32 relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity"></div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {company.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{company.description}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-semibold text-foreground">{company.revenue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Industry</span>
                      <span className="font-semibold text-foreground">{company.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ROI</span>
                      <span className="font-semibold text-primary">{company.roi}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-primary hover:bg-primary-600 text-white"
                    asChild
                  >
                    <Link to="/dashboard">View Details</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 rounded-lg font-semibold"
              asChild
            >
              <Link to="/dashboard" className="flex items-center gap-2">
                Browse All Companies
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 bg-muted/30 border-t border-border/40">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools and support for acquiring and managing your businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="space-y-4 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 border-t border-border/40">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple steps to acquire your next business
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Browse",
                description: "Explore our marketplace of verified, profitable businesses"
              },
              {
                step: "02",
                title: "Analyze",
                description: "Review detailed financials, metrics, and business models"
              },
              {
                step: "03",
                title: "Negotiate",
                description: "Work with our advisors to finalize terms with sellers"
              },
              {
                step: "04",
                title: "Manage",
                description: "Access your dashboard and scale your business portfolio"
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-primary/20">{item.step}</div>
                  <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 -right-3 text-primary/20">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 border-t border-border/40">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="bg-gradient-to-r from-primary to-primary-600 rounded-2xl p-12 md:p-16 text-white text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Own Your Next Business?
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Join thousands of entrepreneurs building their portfolio of profitable companies
              </p>
            </div>

            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 h-12 px-8 rounded-lg font-semibold text-base"
              asChild
            >
              <Link to="/dashboard" className="flex items-center gap-2">
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
