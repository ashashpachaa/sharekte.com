import { useTranslation } from "react-i18next";
import {
  Shield,
  Globe,
  Users,
  Zap,
  Lock,
  Headphones,
  FileCheck,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  Briefcase,
} from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeaturesSection() {
  const { t } = useTranslation();

  const features: Feature[] = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: t("features.verified.title") || "Verified Sellers & Buyers",
      description:
        t("features.verified.description") ||
        "All participants are thoroughly verified to ensure trust and credibility in every transaction",
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: t("features.secure.title") || "Secure Transactions",
      description:
        t("features.secure.description") ||
        "Advanced encryption and escrow services protect your investment and ensure safe transactions",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: t("features.global.title") || "Global Marketplace",
      description:
        t("features.global.description") ||
        "Buy and sell established businesses worldwide with support for multiple currencies and payment methods",
    },
    {
      icon: <Headphones className="w-8 h-8" />,
      title: t("features.support.title") || "24/7 Professional Support",
      description:
        t("features.support.description") ||
        "Direct WhatsApp support, expert consultations, and dedicated account managers for every deal",
    },
    {
      icon: <FileCheck className="w-8 h-8" />,
      title: t("features.legal.title") || "Legal Documentation",
      description:
        t("features.legal.description") ||
        "Automated transfer forms, legal compliance, and professional documentation for all transactions",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: t("features.fast.title") || "Fast & Efficient Process",
      description:
        t("features.fast.description") ||
        "Complete business transfers in days, not months, with streamlined workflows and automated processes",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: t("features.analytics.title") || "Advanced Analytics",
      description:
        t("features.analytics.description") ||
        "Real-time dashboards, performance metrics, and business insights for informed decisions",
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: t("features.trusted.title") || "Industry Trusted",
      description:
        t("features.trusted.description") ||
        "Thousands of successful transactions with verified businesses generating real revenue",
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: t("features.escrow.title") || "Transparent Escrow Service",
      description:
        t("features.escrow.description") ||
        "Protected fund handling ensures both parties feel secure throughout the transaction",
    },
    {
      icon: <CheckCircle2 className="w-8 h-8" />,
      title:
        t("features.verified_business.title") || "Revenue-Verified Businesses",
      description:
        t("features.verified_business.description") ||
        "All businesses are verified for active operations and genuine revenue streams",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t("features.consultation.title") || "Expert Consultation",
      description:
        t("features.consultation.description") ||
        "Free consultations with business experts to guide you through the entire acquisition process",
    },
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: t("features.handover.title") || "Complete Handover Support",
      description:
        t("features.handover.description") ||
        "Full transition support from purchase to operational handover ensures business continuity",
    },
  ];

  return (
    <section
      id="features"
      className="py-24 md:py-32 bg-gradient-to-b from-background via-primary/2 to-background"
    >
      <div className="container max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-20">
          <div className="inline-block">
            <p className="text-sm md:text-base font-semibold text-primary uppercase tracking-widest">
              {t("features.badge") || "Why Choose Us"}
            </p>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            {t("features.title") || "Professional Features Built for Success"}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("features.subtitle") ||
              "We provide everything you need to buy or sell established businesses with confidence, security, and professional support at every step"}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 bg-card border border-border/40 rounded-2xl hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon Container */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                <div className="text-primary">{feature.icon}</div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Accent Line */}
              <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div className="text-center pt-12 border-t border-border/20">
          <p className="text-muted-foreground text-lg mb-6">
            {t("features.cta.text") ||
              "Join thousands of successful entrepreneurs who have found their ideal business"}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/browse"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors duration-200"
            >
              {t("features.cta.browse") || "Start Browsing Businesses"}
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors duration-200"
            >
              {t("features.cta.contact") || "Get Professional Consultation"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
