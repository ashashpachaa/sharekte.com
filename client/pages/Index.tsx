import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompanyTable } from "@/components/CompanyTable";
import { useMemo } from "react";
import {
  ArrowRight,
  TrendingUp,
  Users,
  Zap,
  Shield,
  BarChart3,
  Globe,
  CheckCircle2,
  TrendingDown,
} from "lucide-react";

export default function Index() {
  const { t } = useTranslation();

  const featuredCompanies = [
    {
      id: 1,
      name: "TechFlow Solutions",
      revenue: "$2.5M",
      industry: "SaaS",
      yearsInBusiness: 5,
      employees: 12,
      image: "bg-gradient-to-br from-primary to-primary-600",
      description: "Cloud-based project management platform",
      roi: "45%",
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
      roi: "38%",
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
      roi: "52%",
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
      roi: "41%",
    },
  ];

  const features = [
    {
      icon: Globe,
      title: t("homepage.featuresSection.feature1Title"),
      description: t("homepage.featuresSection.feature1Desc"),
    },
    {
      icon: TrendingUp,
      title: t("homepage.featuresSection.feature2Title"),
      description: t("homepage.featuresSection.feature2Desc"),
    },
    {
      icon: Shield,
      title: t("homepage.featuresSection.feature3Title"),
      description: t("homepage.featuresSection.feature3Desc"),
    },
    {
      icon: Users,
      title: t("homepage.featuresSection.feature4Title"),
      description: t("homepage.featuresSection.feature4Desc"),
    },
    {
      icon: BarChart3,
      title: t("homepage.featuresSection.feature5Title"),
      description: t("homepage.featuresSection.feature5Desc"),
    },
    {
      icon: Zap,
      title: t("homepage.featuresSection.feature6Title"),
      description: t("homepage.featuresSection.feature6Desc"),
    },
  ];

  const steps = [
    {
      step: "01",
      title: t("homepage.howitworks.step1"),
      description: t("homepage.howitworks.step1Desc"),
    },
    {
      step: "02",
      title: t("homepage.howitworks.step2"),
      description: t("homepage.howitworks.step2Desc"),
    },
    {
      step: "03",
      title: t("homepage.howitworks.step3"),
      description: t("homepage.howitworks.step3Desc"),
    },
    {
      step: "04",
      title: t("homepage.howitworks.step4"),
      description: t("homepage.howitworks.step4Desc"),
    },
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
                  {t("homepage.hero.title1")}
                  <span className="block text-primary">
                    {t("homepage.hero.title2")}
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                  {t("homepage.hero.description")}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary-600 text-white h-12 px-8 rounded-lg font-semibold text-base"
                  asChild
                >
                  <Link to="/dashboard" className="flex items-center gap-2">
                    {t("homepage.hero.browseButton")}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 rounded-lg font-semibold text-base"
                >
                  {t("homepage.hero.watchDemo")}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/40">
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-primary">
                    2500+
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("homepage.hero.businessesListed")}
                  </p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-primary">
                    $4.2B
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("homepage.hero.gmv")}
                  </p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-primary">
                    85%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("homepage.hero.buyerSatisfaction")}
                  </p>
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
                        <p className="font-semibold">
                          {t("homepage.hero.annualRevenue")}
                        </p>
                        <p className="text-2xl font-bold">$2.5M+</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {t("homepage.hero.teamSize")}
                        </p>
                        <p className="text-2xl font-bold">15+ Employees</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {t("homepage.hero.averageRoi")}
                        </p>
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
              {t("homepage.browseSection.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("homepage.browseSection.description")}
            </p>
          </div>
          <CompanyTable />
        </div>
      </section>

      {/* Featured Companies Section */}
      <section
        id="companies"
        className="py-20 md:py-28 border-t border-border/40"
      >
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("homepage.featuredSection.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("homepage.featuredSection.description")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCompanies.map((company) => (
              <div
                key={company.id}
                className="group border border-border/40 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50"
              >
                <div
                  className={`${company.image} h-32 relative overflow-hidden`}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity"></div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {company.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {company.description}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("homepage.featuredSection.revenue")}
                      </span>
                      <span className="font-semibold text-foreground">
                        {company.revenue}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("homepage.featuredSection.industry")}
                      </span>
                      <span className="font-semibold text-foreground">
                        {company.industry}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("homepage.featuredSection.roi")}
                      </span>
                      <span className="font-semibold text-primary">
                        {company.roi}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-primary hover:bg-primary-600 text-white"
                    asChild
                  >
                    <Link to="/dashboard">
                      {t("homepage.featuredSection.viewDetails")}
                    </Link>
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
                {t("homepage.featuredSection.browseAll")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Sales Statistics Section - Motivation */}
      <SalesStatisticsSection t={t} />

      {/* Features Section */}
      <section
        id="features"
        className="py-20 md:py-28 bg-muted/30 border-t border-border/40"
      >
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("homepage.featuresSection.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("homepage.featuresSection.description")}
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
                  <h3 className="text-xl font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
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
              {t("homepage.howitworks.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("homepage.howitworks.description")}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((item, index) => (
              <div key={index} className="relative">
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-primary/20">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {item.title}
                  </h3>
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
                {t("homepage.cta.title")}
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                {t("homepage.cta.description")}
              </p>
            </div>

            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 h-12 px-8 rounded-lg font-semibold text-base"
              asChild
            >
              <Link to="/dashboard" className="flex items-center gap-2">
                {t("homepage.cta.button")}
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

function SalesStatisticsSection({ t }: { t: any }) {
  const salesStats = useMemo(() => {
    // Load or initialize sales counters from localStorage
    const storedStats = localStorage.getItem('shareket_sales_stats');
    let stats = {
      today: 8,
      month: 142,
      year: 1247,
      lastUpdateDate: new Date().toDateString(),
    };

    if (storedStats) {
      try {
        const parsed = JSON.parse(storedStats);
        const today = new Date().toDateString();

        // Check if it's a new day to reset the "today" counter
        if (parsed.lastUpdateDate === today) {
          stats = parsed;
        } else {
          // New day - increment "today" counter and carry over to month/year
          const prevToday = parsed.today || 8;
          stats.today = prevToday + Math.floor(Math.random() * 4) + 1; // Increase by 1-4 companies
          stats.month = (parsed.month || 142) + stats.today; // Add new sales to monthly
          stats.year = (parsed.year || 1247) + stats.today; // Add new sales to yearly
          stats.lastUpdateDate = today;
        }
      } catch (e) {
        // If parsing fails, use defaults
      }
    }

    // Save updated stats to localStorage
    localStorage.setItem('shareket_sales_stats', JSON.stringify(stats));

    return {
      today: stats.today,
      month: stats.month,
      year: stats.year,
    };
  }, []);

  return (
    <section className="py-20 md:py-28 border-t border-border/40 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("homepage.salesSection.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("homepage.salesSection.motivationText")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="group relative bg-white dark:bg-slate-950 border border-border/40 rounded-2xl p-8 hover:shadow-lg hover:border-primary/50 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-transparent to-transparent group-hover:from-green-500/10 transition-all duration-300"></div>
            <div className="relative space-y-6">
              <div className="w-14 h-14 bg-green-500/10 group-hover:bg-green-500/20 rounded-xl flex items-center justify-center transition-colors">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("homepage.salesSection.soldToday")}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl md:text-6xl font-bold text-green-600">
                    {salesStats.today}
                  </p>
                  <p className="text-lg text-muted-foreground">
                    {t("homepage.salesSection.companies")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative bg-white dark:bg-slate-950 border border-border/40 rounded-2xl p-8 hover:shadow-lg hover:border-primary/50 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-transparent group-hover:from-blue-500/10 transition-all duration-300"></div>
            <div className="relative space-y-6">
              <div className="w-14 h-14 bg-blue-500/10 group-hover:bg-blue-500/20 rounded-xl flex items-center justify-center transition-colors">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("homepage.salesSection.soldThisMonth")}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl md:text-6xl font-bold text-primary">
                    {salesStats.month}
                  </p>
                  <p className="text-lg text-muted-foreground">
                    {t("homepage.salesSection.companies")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative bg-white dark:bg-slate-950 border border-border/40 rounded-2xl p-8 hover:shadow-lg hover:border-primary/50 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-transparent to-transparent group-hover:from-purple-500/10 transition-all duration-300"></div>
            <div className="relative space-y-6">
              <div className="w-14 h-14 bg-purple-500/10 group-hover:bg-purple-500/20 rounded-xl flex items-center justify-center transition-colors">
                <TrendingDown className="w-7 h-7 text-purple-600" style={{ transform: 'scaleY(-1)' }} />
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("homepage.salesSection.soldThisYear")}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl md:text-6xl font-bold text-purple-600">
                    {salesStats.year}
                  </p>
                  <p className="text-lg text-muted-foreground">
                    {t("homepage.salesSection.companies")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-600 text-white h-12 px-8 rounded-lg font-semibold"
            asChild
          >
            <Link to="/dashboard" className="flex items-center gap-2">
              Become an Entrepreneur
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
