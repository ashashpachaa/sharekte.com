import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { CartDropdown } from "./CartDropdown";
import { NotificationBell } from "./NotificationBell";

export function Header() {
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
          <a href="#companies" className="text-foreground hover:text-primary transition-colors">
            Browse
          </a>
          <a href="#features" className="text-foreground hover:text-primary transition-colors">
            Features
          </a>
          <Link to="/support" className="text-foreground hover:text-primary transition-colors">
            Support
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
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
