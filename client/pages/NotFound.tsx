import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="text-center space-y-8 max-w-lg">
          <div>
            <h1 className="text-6xl md:text-7xl font-bold text-primary mb-4">
              404
            </h1>
            <p className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Page not found
            </p>
            <p className="text-lg text-muted-foreground">
              The page you're looking for doesn't exist. Let's get you back on track.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary-600 text-white"
              asChild
            >
              <Link to="/">Return to Home</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
            >
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
