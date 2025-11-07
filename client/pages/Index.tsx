import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhyBuyReadyMade } from "@/components/WhyBuyReadyMade";
import { CompanyTable } from "@/components/CompanyTable";
import { useMemo, useState, useEffect } from "react";
import { useSEO, getPageSEOMetadata } from "@/lib/seo";
import { TrendingUp, Zap, BarChart3, Globe, Play } from "lucide-react";
import { fetchAllCompanies } from "@/lib/company-management";

// Sales Statistics Section - Motivation
function SalesStatisticsSection({ t }: { t: (key: string) => string }) {
  const stats = useMemo(() => {
    const today = Math.floor(Math.random() * 45) + 5; // 5-50
    const month = Math.floor(Math.random() * 450) + 50; // 50-500
    const year = Math.floor(Math.random() * 2500) + 500; // 500-3000

    return {
      today: today,
      month: month,
      year: year,
    };
  }, []);

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-background to-muted/20">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            {t("homepage.salesSection.title") ||
              "Become an Entrepreneur Right Now"}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("homepage.salesSection.motivationText") ||
              "Join our community of successful entrepreneurs"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stat Card 1: Today */}
          <div className="text-center p-6 bg-card border border-border/40 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="text-primary mb-4">
              <TrendingUp className="w-10 h-10 mx-auto text-green-500" />
            </div>
            <p className="text-4xl font-bold text-green-500">{stats.today}+</p>
            <p className="text-sm text-muted-foreground uppercase font-semibold mt-2">
              {t("homepage.salesSection.soldToday") || "Companies sold today"}
            </p>
          </div>

          {/* Stat Card 2: Month */}
          <div className="text-center p-6 bg-card border border-border/40 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="text-primary mb-4">
              <BarChart3 className="w-10 h-10 mx-auto text-blue-500" />
            </div>
            <p className="text-4xl font-bold text-blue-500">{stats.month}+</p>
            <p className="text-sm text-muted-foreground uppercase font-semibold mt-2">
              {t("homepage.salesSection.soldThisMonth") ||
                "Companies sold this month"}
            </p>
          </div>

          {/* Stat Card 3: Year */}
          <div className="text-center p-6 bg-card border border-border/40 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="text-primary mb-4">
              <Globe className="w-10 h-10 mx-auto text-purple-500" />
            </div>
            <p className="text-4xl font-bold text-purple-500">{stats.year}+</p>
            <p className="text-sm text-muted-foreground uppercase font-semibold mt-2">
              {t("homepage.salesSection.soldThisYear") ||
                "Companies sold this year"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Featured Companies Section
function FeaturedCompaniesSection({ t }: { t: (key: string) => string }) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const data = await fetchAllCompanies();
        // Filter to show only active companies, limit to top companies
        const activeCompanies = data.filter((c: any) => c.status === "active").slice(0, 10);
        setCompanies(activeCompanies);
      } catch (error) {
        console.error("Error loading companies:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  if (loading) {
    return (
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              {t("homepage.featured.title") || "Featured Companies"}
            </h2>
            <p className="text-xl text-muted-foreground">
              Loading available companies...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            {t("homepage.featured.title") || "Featured Companies"}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t("homepage.featured.description") || "Browse established businesses ready for acquisition"}
          </p>
        </div>

        {companies.length > 0 ? (
          <div className="rounded-lg border border-border/40 bg-card overflow-hidden">
            <CompanyTable
              companies={companies}
              onViewDetails={() => {}}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {t("homepage.featured.noCompanies") || "No companies available at this time"}
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button size="lg" asChild className="bg-primary hover:bg-primary-600">
            <Link to="/companies">
              {t("homepage.featured.browseAll") || "Browse All Companies"}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  const { t, i18n } = useTranslation();
  const seoMetadata = getPageSEOMetadata("home", i18n.language);
  useSEO(seoMetadata, i18n.language);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-70"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/20 opacity-70"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-background to-primary/5 opacity-70"></div>
          </div>

          <div className="text-center px-4 max-w-4xl mx-auto">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight"
              data-loc="client/pages/Index.tsx:137:17"
            >
              {t("homepage.hero.title1") || "Discover & Buy"}{" "}
              <span
                className="text-primary"
                data-loc="client/pages/Index.tsx:139:19"
              >
                {t("homepage.hero.title2") || "Established Businesses Today"}
              </span>
            </h1>
            <p
              className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto"
              data-loc="client/pages/Index.tsx:143:17"
            >
              {t("homepage.hero.description") ||
                "Welcome to Sharekte - Your marketplace for buying and selling established, revenue-generating companies globally. Skip the startup phase and step into profitability."}
            </p>
            <div
              className="flex flex-col sm:flex-row justify-center gap-4"
              data-loc="client/pages/Index.tsx:148:15"
            >
              <Button
                size="lg"
                className="h-14 px-8 text-lg font-bold rounded-lg bg-primary hover:bg-primary-600 text-white"
                asChild
                data-loc="client/pages/Index.tsx:154:19"
              >
                <Link to="/companies">
                  <Zap className="mr-2 h-5 w-5" />
                  {t("homepage.hero.browseButton") || "Start Browsing"}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg font-bold rounded-lg border-primary text-primary hover:bg-primary/10 hover:text-primary-600"
              >
                <Play className="mr-2 h-5 w-5" />
                {t("homepage.hero.watchDemo") || "Watch Demo"}
              </Button>
            </div>
          </div>
        </section>

        {/* Why Buy Ready Made Company Section */}
        <WhyBuyReadyMade />

        {/* Sales Statistics Section - Motivation */}
        <SalesStatisticsSection t={t} />
      </main>
      <Footer />
    </div>
  );
}
