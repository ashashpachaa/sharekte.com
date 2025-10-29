import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function Header() {
  const { items } = useCart();
  const cartCount = items.length;

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
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {/* Cart Icon */}
          <Link
            to="/cart"
            className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-border/40 hover:bg-muted transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-foreground" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

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
