import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useState, useCallback, memo } from "react";
import { Button } from "./ui/button";
import { CartDropdown } from "./CartDropdown";
import { NotificationBell } from "./NotificationBell";
import LanguageSwitcher from "./LanguageSwitcher";
import { useCurrency } from "@/lib/currency-context";
import { useUser } from "@/lib/user-context";
import { Globe, LogOut, User, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Memoized currency selector component
const CurrencySelector = memo(function CurrencySelector() {
  const { currency, setCurrency, rates } = useCurrency();
  const handleCurrencyChange = useCallback((code: string) => {
    setCurrency(code as any);
  }, [setCurrency]);

  return (
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
              onClick={() => handleCurrencyChange(code)}
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
  );
});

// Memoized user menu component
const UserMenu = memo(function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isUser, userName, userEmail, logout } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    setShowUserMenu(false);
    navigate("/");
  }, [logout, navigate]);

  const handleDashboardClick = useCallback(() => {
    navigate("/dashboard");
    setShowUserMenu(false);
  }, [navigate]);

  if (!isUser || !userName) {
    return (
      <Button
        variant="outline"
        className="h-9 text-xs"
        onClick={() => navigate("/login")}
      >
        {t("header.login") || "Sign In"}
      </Button>
    );
  }

  return (
    <div className="relative group">
      <Button
        variant="outline"
        className="gap-2 h-9"
        onClick={() => setShowUserMenu(!showUserMenu)}
      >
        <User className="w-4 h-4" />
        <span className="text-xs hidden sm:inline">{userName}</span>
      </Button>
      <div
        className={`absolute right-0 top-full mt-1 w-48 bg-card border border-border/40 rounded-lg shadow-lg transition-all duration-200 z-50 ${
          showUserMenu ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div className="p-3 space-y-2">
          <div className="text-sm">
            <p className="font-semibold text-foreground">
              {userName}
            </p>
            <p className="text-xs text-muted-foreground">
              {userEmail}
            </p>
          </div>
          <div className="border-t border-border/40 pt-2">
            <button
              onClick={handleDashboardClick}
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
  );
});

// Memoized mobile menu component
const MobileMenu = memo(function MobileMenu() {
  const { t } = useTranslation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <nav className="flex flex-col gap-4 mt-8">
          <Link
            to="/"
            className="text-foreground hover:text-primary transition-colors py-2"
          >
            {t("header.home")}
          </Link>
          <a
            href="#features"
            className="text-foreground hover:text-primary transition-colors py-2"
          >
            Features
          </a>
          <Link
            to="/about"
            className="text-foreground hover:text-primary transition-colors py-2"
          >
            About Us
          </Link>
          <Link
            to="/support"
            className="text-foreground hover:text-primary transition-colors py-2"
          >
            {t("header.support")}
          </Link>
          <Link
            to="/companies"
            className="text-foreground hover:text-primary transition-colors py-2"
          >
            {t("header.companies") || "Companies"}
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
});

export const Header = memo(function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-6xl items-center justify-between">
        {/* Logo and Brand */}
        <Link
          to="/"
          className="flex items-center font-bold text-lg text-primary h-10"
        >
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F752b1abf9cc241c993361e9dcaee5153%2F708a794c15c645db8aef3926ec307c64?format=webp&width=800"
            alt="Sharekte"
            className="h-full object-contain"
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
            to="/about"
            className="text-foreground hover:text-primary transition-colors truncate"
          >
            About Us
          </Link>
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
          <CurrencySelector />

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications */}
          <NotificationBell />

          {/* Cart Dropdown */}
          <CartDropdown />

          {/* User Menu */}
          <UserMenu />

          {/* Mobile Menu */}
          <MobileMenu />
        </div>
      </div>
    </header>
  );
});
