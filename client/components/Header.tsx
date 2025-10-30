import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { CartDropdown } from "./CartDropdown";
import { NotificationBell } from "./NotificationBell";
import { useCurrency } from "@/lib/currency-context";
import { Globe } from "lucide-react";

export function Header() {
  const { currency, setCurrency, rates } = useCurrency();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-6xl items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            BC
          </div>
          <span className="hidden sm:inline">BusinessCorp</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/companies" className="text-foreground hover:text-primary transition-colors">
            Companies
          </Link>
          <a href="#features" className="text-foreground hover:text-primary transition-colors">
            Features
          </a>
          <Link to="/support" className="text-foreground hover:text-primary transition-colors">
            Support
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2">
          {/* Currency Selector */}
          <div className="relative group">
            <Button
              variant="outline"
              className="gap-2 text-xs h-9"
            >
              <Globe className="w-4 h-4" />
              <span>{CURRENCY_RATES[currency].symbol}</span>
            </Button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border/40 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-2 space-y-1">
                {Object.entries(CURRENCY_RATES).map(([code, rate]) => (
                  <button
                    key={code}
                    onClick={() => setCurrency(code as any)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      currency === code
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium">{rate.symbol}</span>
                    <span className="ml-2 text-muted-foreground">{rate.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* Cart Dropdown */}
          <CartDropdown />

          <Button
            variant="default"
            className="bg-primary hover:bg-primary-600"
            asChild
          >
            <Link to="/dashboard">
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
