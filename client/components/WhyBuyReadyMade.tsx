import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Clock,
  DollarSign,
  TrendingUp,
  BarChart3,
  Users,
  Globe,
} from "lucide-react";

interface BenefitCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight: string;
  comparison: {
    startup: string;
    readyMade: string;
  };
  savings?: string;
}

export function WhyBuyReadyMade() {
  const { t } = useTranslation();

  const benefits: BenefitCard[] = [
    {
      icon: <Clock className="w-8 h-8 text-white" />,
      title: t("homepage.whyBuy.time.title") || "Time Savings",
      description:
        t("homepage.whyBuy.time.description") ||
        "Skip years of development and get to profitability fast",
      highlight: "⚡ 4+ Years Faster",
      comparison: {
        startup: "3-5 years to profitability",
        readyMade: "6-12 months to profitability",
      },
      savings: "Save 2-4 years",
    },
    {
      icon: <DollarSign className="w-8 h-8 text-white" />,
      title: t("homepage.whyBuy.capital.title") || "Capital Savings",
      description:
        t("homepage.whyBuy.capital.description") ||
        "Avoid massive startup costs and hit the ground running",
      highlight: "💰 $50k-$500k+ Saved",
      comparison: {
        startup: "$50k-$500k+ startup costs",
        readyMade: "Fraction of startup costs",
      },
      savings: "Save capital & resources",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-white" />,
      title: t("homepage.whyBuy.profitability.title") || "Day 1 Profitability",
      description:
        t("homepage.whyBuy.profitability.description") ||
        "Generate revenue from day one with established customers",
      highlight: "📈 Immediate Revenue",
      comparison: {
        startup: "0 customers on day 1",
        readyMade: "Active customers ready to pay",
      },
      savings: "Revenue from day 1",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-white" />,
      title: t("homepage.whyBuy.lowRisk.title") || "Proven Model",
      description:
        t("homepage.whyBuy.lowRisk.description") ||
        "Buy a business with a track record and established operations",
      highlight: "✅ Low Risk Entry",
      comparison: {
        startup: "70% startup failure rate",
        readyMade: "Proven business model",
      },
      savings: "De-risk your investment",
    },
    {
      icon: <Users className="w-8 h-8 text-white" />,
      title: t("homepage.whyBuy.team.title") || "Ready Operations",
      description:
        t("homepage.whyBuy.team.description") ||
        "Get an experienced team and operational systems already in place",
      highlight: "👥 Team Ready",
      comparison: {
        startup: "Months hiring & training",
        readyMade: "Professional team ready",
      },
      savings: "Hiring & training included",
    },
    {
      icon: <Globe className="w-8 h-8 text-white" />,
      title: t("homepage.whyBuy.global.title") || "Global Opportunity",
      description:
        t("homepage.whyBuy.global.description") ||
        "Acquire UK, Swedish, US companies without travel or relocation",
      highlight: "🌍 Borderless Business",
      comparison: {
        startup: "Local market only",
        readyMade: "Global companies available",
      },
      savings: "No travel or relocation",
    },
  ];

  return (
    <section className="py-20 md:py-28 border-t border-border/40 bg-gradient-to-b from-muted/20 to-background">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-block">
            <div className="text-sm font-semibold text-primary uppercase tracking-wide">
              {t("homepage.whyBuy.badge") || "Why Sharekte"}
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            {t("homepage.whyBuy.title") ||
              "Why Buy a Ready-Made Company?"}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("homepage.whyBuy.subtitle") ||
              "Skip the startup grind. Get established businesses that generate revenue from day one with proven models and experienced teams."}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative bg-card border border-border/40 rounded-2xl p-8 hover:border-primary/50 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Content */}
              <div className="relative space-y-6">
                {/* Icon Background */}
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {benefit.icon}
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {benefit.description}
                  </p>
                </div>

                {/* Highlight Badge */}
                <div className="pt-4 pb-4 border-t border-b border-border/40">
                  <p className="text-lg font-bold text-primary animate-pulse">
                    {benefit.highlight}
                  </p>
                </div>

                {/* Comparison */}
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground line-through">
                      Startup: {benefit.comparison.startup}
                    </p>
                    <p className="text-foreground font-semibold text-primary">
                      ✓ Ready-Made: {benefit.comparison.readyMade}
                    </p>
                  </div>

                  {benefit.savings && (
                    <div className="pt-2 px-3 py-2 bg-accent/10 rounded-lg">
                      <p className="text-accent font-semibold">
                        💡 {benefit.savings}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 pt-12 border-t border-border/40">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left side - Value proposition */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-foreground">
                {t("homepage.whyBuy.cta.title") ||
                  "Ready to Buy Your First Company?"}
              </h3>
              <p className="text-lg text-muted-foreground">
                {t("homepage.whyBuy.cta.description") ||
                  "Browse our curated collection of established, revenue-generating businesses. Find your next opportunity today."}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 py-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">2,500+</p>
                  <p className="text-sm text-muted-foreground">
                    {t("homepage.whyBuy.stats.companies") || "Companies"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">$4.2B</p>
                  <p className="text-sm text-muted-foreground">
                    {t("homepage.whyBuy.stats.revenue") || "Total Revenue"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">340%</p>
                  <p className="text-sm text-muted-foreground">
                    {t("homepage.whyBuy.stats.growth") || "Avg Growth"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - CTA Buttons */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border border-primary/20">
                <h4 className="font-bold text-lg text-foreground mb-6">
                  {t("homepage.whyBuy.cta.options") ||
                    "Choose Your Path:"}
                </h4>

                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full bg-primary hover:bg-primary-600 text-white h-12 rounded-lg font-semibold"
                    asChild
                  >
                    <Link to="/companies">
                      🔍 {t("homepage.whyBuy.cta.browse") || "Browse Companies"}
                    </Link>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-12 rounded-lg font-semibold"
                  >
                    📧 {t("homepage.whyBuy.cta.contact") || "Get Consultation"}
                  </Button>

                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full h-12 rounded-lg font-semibold text-primary hover:text-primary-600"
                  >
                    ▶️ {t("homepage.whyBuy.cta.watchDemo") || "Watch Demo"}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-6">
                  {t("homepage.whyBuy.cta.trusted") ||
                    "✓ Trusted by 2,500+ entrepreneurs worldwide"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
