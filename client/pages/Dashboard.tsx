import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart3, Plus, TrendingUp, Users, DollarSign, ArrowUpRight } from "lucide-react";

export default function Dashboard() {
  const ownedCompanies = [
    {
      id: 1,
      name: "TechFlow Solutions",
      revenue: "$2.5M",
      monthlyRevenue: "$210K",
      growth: "+12%",
      employees: 12,
      status: "Active"
    },
    {
      id: 2,
      name: "GreenLeaf Organic",
      revenue: "$1.8M",
      monthlyRevenue: "$150K",
      growth: "+8%",
      employees: 18,
      status: "Active"
    }
  ];

  const stats = [
    {
      label: "Total Portfolio Value",
      value: "$4.3M",
      icon: DollarSign,
      change: "+18%"
    },
    {
      label: "Monthly Revenue",
      value: "$360K",
      icon: TrendingUp,
      change: "+12%"
    },
    {
      label: "Total Employees",
      value: "30",
      icon: Users,
      change: "+5"
    },
    {
      label: "Companies Owned",
      value: "2",
      icon: BarChart3,
      change: "In Portfolio"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Dashboard Header */}
      <section className="border-b border-border/40 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your business portfolio and track performance
              </p>
            </div>
            <Button
              className="bg-primary hover:bg-primary-600 text-white flex items-center gap-2"
              asChild
            >
              <Link to="/">
                <Plus className="w-5 h-5" />
                Browse More Companies
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 border-b border-border/40">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-card border border-border/40 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-sm font-semibold text-primary/60">
                      {stat.change}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="py-12 flex-1">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Your Portfolio</h2>

            {ownedCompanies.length > 0 ? (
              <div className="space-y-4">
                {ownedCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="bg-card border border-border/40 rounded-lg p-6 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex-shrink-0"></div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-foreground">
                                {company.name}
                              </h3>
                              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                                {company.status}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {company.employees} employees
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Annual Revenue
                          </p>
                          <p className="text-xl font-bold text-foreground mt-1">
                            {company.revenue}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Monthly
                          </p>
                          <p className="text-xl font-bold text-foreground mt-1">
                            {company.monthlyRevenue}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Growth
                          </p>
                          <p className="text-xl font-bold text-primary mt-1 flex items-center gap-1">
                            <ArrowUpRight className="w-4 h-4" />
                            {company.growth}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="whitespace-nowrap"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border/40 rounded-lg p-12 text-center space-y-4">
                <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto" />
                <p className="text-muted-foreground">
                  You haven't purchased any companies yet
                </p>
                <Button
                  className="bg-primary hover:bg-primary-600 text-white"
                  asChild
                >
                  <Link to="/">Browse Marketplace</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
