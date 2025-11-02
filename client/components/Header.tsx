import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "./ui/button";
import { CartDropdown } from "./CartDropdown";
import { NotificationBell } from "./NotificationBell";
import LanguageSwitcher from "./LanguageSwitcher";
import { useCurrency } from "@/lib/currency-context";
import { Globe, LogOut, User } from "lucide-react";

export function Header() {
  const { t } = useTranslation();
  const { currency, setCurrency, rates } = useCurrency();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get user from localStorage
  const user = (() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem("user");
    setShowUserMenu(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-6xl items-center justify-between">
        {/* Logo and Brand */}
        <Link
          to="/"
          className="flex items-center font-bold text-xl text-primary"
        >
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F752b1abf9cc241c993361e9dcaee5153%2Fd9d4a64693d843b1a53386d5a7c2937e?format=webp&width=200"
            alt="Sharekte"
            className="w-full"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium whitespace-nowrap">
          <Link
            to="/"
            className="text-foreground hover:text-primary transition-colors truncate"
          >
            {t("header.home")}
          </Link>
          <a
            href="#features"
            className="text-foreground hover:text-primary transition-colors truncate"
          >
            Features
          </a>
          <Link
            to="/support"
            className="text-foreground hover:text-primary transition-colors truncate"
          >
            {t("header.support")}
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2">
          {/* Currency Selector */}
          <div className="relative group">
            <Button variant="outline" className="gap-2 text-xs h-9">
              <Globe className="w-4 h-4" />
              <span>{rates[currency]?.symbol || "$"}</span>
            </Button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border/40 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-2 space-y-1">
                {Object.entries(rates).map(([code, rate]) => (
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
                    <span className="ml-2 text-muted-foreground">
                      {rate.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications */}
          <NotificationBell />

          {/* Cart Dropdown */}
          <CartDropdown />

          {/* Auth Section */}
          {user && user.authenticated ? (
            <>
              {/* User Menu */}
              <div className="relative group">
                <Button
                  variant="outline"
                  className="gap-2 h-9"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <User className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">
                    {user.fullName}
                  </span>
                </Button>
                <div
                  className={`absolute right-0 top-full mt-1 w-48 bg-card border border-border/40 rounded-lg shadow-lg transition-all duration-200 z-50 ${
                    showUserMenu ? "opacity-100 visible" : "opacity-0 invisible"
                  }`}
                >
                  <div className="p-3 space-y-2">
                    <div className="text-sm">
                      <p className="font-semibold text-foreground">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <div className="border-t border-border/40 pt-2">
                      <button
                        onClick={() => {
                          navigate("/dashboard");
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        {t("header.dashboard") || "Dashboard"}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        {t("header.logout") || "Sign Out"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Login Button */}
              <Button
                variant="outline"
                className="h-9 text-xs"
                onClick={() => navigate("/login")}
              >
                {t("header.login") || "Sign In"}
              </Button>
              {/* Signup Button */}
              <Button
                variant="default"
                className="bg-primary hover:bg-primary-600 h-9 text-xs"
                onClick={() => navigate("/signup")}
              >
                {t("header.signup") || "Sign Up"}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
