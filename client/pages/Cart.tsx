import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { Trash2, ArrowLeft, ShoppingCart, Search, X } from "lucide-react";

export default function CartPage() {
  const { formatPrice } = useCurrency();
  const { items, removeItem, clearCart, totalPrice } = useCart();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      item.companyNumber.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center space-y-8 max-w-lg">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/50 mx-auto" />
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Your cart is empty
              </h1>
              <p className="text-muted-foreground">
                Start browsing and add companies to your cart
              </p>
            </div>

            <Button
              size="lg"
              className="bg-primary hover:bg-primary-600 text-white gap-2"
              asChild
            >
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Cart Header */}
      <section className="border-b border-border/40 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Shopping Cart
          </h1>
          <p className="text-muted-foreground mt-2">
            You have {items.length} {items.length === 1 ? "company" : "companies"} in your cart
          </p>
        </div>
      </section>

      {/* Cart Items */}
      <section className="flex-1 py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Items */}
              <div className="space-y-4">
                {filteredItems.length === 0 ? (
                  <div className="bg-card border border-border/40 rounded-lg p-8 text-center text-muted-foreground">
                    {searchQuery ? "No items match your search" : "Your cart is empty"}
                  </div>
                ) : (
                  filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border/40 rounded-lg p-6 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Company Number: {item.companyNumber}
                    </p>
                    <p className="text-lg font-semibold text-primary mt-2">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )))
              }
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-card border border-border/40 rounded-lg p-6 h-fit sticky top-20">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 border-b border-border/40 pb-6 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-lg font-bold text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary-600 text-white mb-3"
                asChild
              >
                <Link to="/checkout">
                  Proceed to Checkout
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="w-full"
                asChild
              >
                <Link to="/">Continue Shopping</Link>
              </Button>

              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="mt-4 w-full text-sm text-destructive hover:text-destructive/80 transition-colors"
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
