// About Us Page - Professional company information and mission
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Target,
  Users,
  Lightbulb,
  Award,
  TrendingUp,
  Shield,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { useSEO } from "@/lib/seo";
import { useEffect } from "react";

export default function About() {
  const { t } = useTranslation();
  useSEO({
    title: "About Us - Shareket",
    description:
      "Learn about Shareket, the world's first marketplace for buying and selling established businesses. Our mission, vision, and commitment to professional service.",
    keywords: "about shareket, business marketplace, company transfers",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                About <span className="text-primary">Shareket</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                The world's first professional marketplace for buying and
                selling established, revenue-generating businesses globally
              </p>
            </div>
          </div>
        </section>

        {/* Mission, Vision, Values Section */}
        <section className="py-20 md:py-28 border-b border-border/40">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Mission */}
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  Our Mission
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  To democratize business ownership by providing a secure,
                  transparent, and professional platform where entrepreneurs can
                  confidently buy and sell established businesses worldwide.
                </p>
              </div>

              {/* Vision */}
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl">
                  <Lightbulb className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  Our Vision
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  To become the global standard for business transactions,
                  making business ownership accessible to entrepreneurs
                  everywhere, eliminating barriers and simplifying the process.
                </p>
              </div>

              {/* Values */}
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  Our Values
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  We are committed to transparency, security, professionalism,
                  and customer success. Every decision we make prioritizes the
                  trust and satisfaction of our community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why We Started Section */}
        <section className="py-20 md:py-28 bg-muted/30 border-b border-border/40">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                  Why We Started Shareket
                </h2>
                <div className="space-y-4">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Buying an established business is a significant financial
                    decision, but it's filled with unnecessary complexity,
                    hidden risks, and lack of transparency. Traditional methods
                    involve:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex gap-3 text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>
                        Months of negotiations and paperwork without clear
                        direction
                      </span>
                    </li>
                    <li className="flex gap-3 text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>
                        Limited access to verified business opportunities
                      </span>
                    </li>
                    <li className="flex gap-3 text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>No escrow protection or fraud prevention</span>
                    </li>
                    <li className="flex gap-3 text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>
                        Expensive legal consultants with conflicting interests
                      </span>
                    </li>
                  </ul>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Shareket was built to solve these problems. We created a
                    platform where buying and selling businesses is simple,
                    safe, and achievable for everyone.
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 border border-primary/20">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop"
                  alt="Team collaboration"
                  className="w-full rounded-lg object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        {/* What We Offer Section */}
        <section className="py-20 md:py-28 border-b border-border/40">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center space-y-6 mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                What Makes Us Different
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We combine professional service, cutting-edge technology, and
                genuine commitment to your success
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: <Shield className="w-6 h-6" />,
                  title: "Complete Security",
                  description:
                    "Escrow protection, buyer-seller verification, and encrypted document handling",
                },
                {
                  icon: <Globe className="w-6 h-6" />,
                  title: "Global Marketplace",
                  description:
                    "Access verified businesses from across the world with multi-currency support",
                },
                {
                  icon: <Users className="w-6 h-6" />,
                  title: "Expert Support",
                  description:
                    "24/7 professional support via WhatsApp, email, and phone from real experts",
                },
                {
                  icon: <TrendingUp className="w-6 h-6" />,
                  title: "Transparent Analytics",
                  description:
                    "Real financial data, verified revenue streams, and performance metrics",
                },
                {
                  icon: <Award className="w-6 h-6" />,
                  title: "Quality Assurance",
                  description:
                    "Every business is manually verified for authenticity and revenue generation",
                },
                {
                  icon: <Lightbulb className="w-6 h-6" />,
                  title: "Legal Expertise",
                  description:
                    "Automated legal documents, transfer forms, and compliance support included",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="border border-border/40 rounded-xl p-8 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4 text-primary">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Impact Section */}
        <section className="py-20 md:py-28 bg-muted/30 border-b border-border/40">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center space-y-6 mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Our Impact
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { number: "2,500+", label: "Successful Transactions" },
                { number: "190+", label: "Countries Served" },
                { number: "$500M+", label: "Total Deal Value" },
                { number: "98%", label: "Customer Satisfaction" },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    {stat.number}
                  </div>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team/Culture Section */}
        <section className="py-20 md:py-28">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 border border-primary/20">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop"
                  alt="Team building"
                  className="w-full rounded-lg object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                  Our Team
                </h2>
                <div className="space-y-4">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Shareket's team consists of experienced business
                    professionals, legal experts, technology specialists, and
                    customer service champions from around the world.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We share a common passion: making business ownership
                    accessible and stress-free. Our diverse backgrounds and
                    experiences allow us to understand the unique needs of
                    entrepreneurs across different markets.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Every team member is dedicated to ensuring that every
                    transaction on our platform is secure, transparent, and
                    successful. Your success is our success.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Commitment Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-background to-primary/5 border-t border-border/40">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Our Commitment to You
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                We're not just a marketplace—we're your partner in building
                wealth through smart business acquisitions. We invest in
                technology, expertise, and support systems to ensure your
                journey is smooth from day one.
              </p>
              <div className="pt-8">
                <a
                  href="/companies"
                  className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors duration-200"
                >
                  Explore Businesses Now
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
