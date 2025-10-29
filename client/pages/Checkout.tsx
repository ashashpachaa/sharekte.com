import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { ArrowLeft, CheckCircle, Loader, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { savePurchasedCompany, addInvoice, type PurchasedCompanyData, type InvoiceData } from "@/lib/user-data";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, clearCart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Sign In form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign Up form
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [company, setCompany] = useState("");

  if (items.length === 0 && !orderCompleted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center space-y-8 max-w-lg">
            <p className="text-muted-foreground">Your cart is empty</p>
            <Button
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Shopping
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleCompleteOrder = async () => {
    // Validate authentication
    if (authMode === "signin" && (!email || !password)) {
      toast.error("Please sign in to complete your order");
      return;
    }

    if (authMode === "signup" && (!fullName || !signupEmail || !signupPassword || !company)) {
      toast.error("Please create an account to complete your order");
      return;
    }

    setLoading(true);
    try {
      // Update status for each company to "Sold"
      const updatePromises = items.map((item) =>
        fetch(`/api/companies/${item.id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "Sold",
          }),
        })
      );

      // Wait for all updates to complete
      const results = await Promise.all(updatePromises);
      const allSuccess = results.every((res) => res.ok);

      if (!allSuccess) {
        throw new Error("Failed to update some companies");
      }

      // Store user info in localStorage (simple auth)
      if (authMode === "signin") {
        localStorage.setItem("user", JSON.stringify({ email, authenticated: true }));
      } else if (authMode === "signup") {
        const userData = {
          fullName,
          email: signupEmail,
          company,
          accountCreated: new Date().toISOString(),
          authenticated: true,
        };
        localStorage.setItem("user", JSON.stringify(userData));
      }

      toast.success("Order completed successfully! 🎉");
      setOrderCompleted(true);
      clearCart();

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error) {
      console.error("Error completing order:", error);
      toast.error("Failed to complete order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (orderCompleted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center space-y-8 max-w-lg">
            <CheckCircle className="w-24 h-24 text-primary mx-auto" />
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Order Completed!
              </h1>
              <p className="text-muted-foreground">
                Thank you for your purchase. Your companies have been marked as sold and removed from the marketplace.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Redirecting you to your dashboard...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !signupEmail || !signupPassword || !confirmPassword || !company) {
      toast.error("Please fill in all fields");
      return;
    }

    if (signupPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    toast.success("Account created successfully! Ready to checkout.");
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    // Simple validation for demo
    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    toast.success("Signed in successfully! Ready to checkout.");
    setEmail("");
    setPassword("");
  }

  const taxAmount = Math.round(totalPrice * 0.2);
  const finalTotal = totalPrice + taxAmount;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Checkout Header */}
      <section className="border-b border-border/40 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Checkout
          </h1>
        </div>
      </section>

      {/* Checkout Content */}
      <section className="flex-1 py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Order Summary
                </h2>
                <div className="space-y-3 bg-card border border-border/40 rounded-lg p-6">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between pb-3 border-b border-border/40 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {item.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          #{item.companyNumber}
                        </p>
                      </div>
                      <p className="font-semibold text-foreground">
                        £{item.price.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authentication Section */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Account
                </h2>
                <div className="bg-card border border-border/40 rounded-lg p-6 space-y-4">
                  {/* Tabs */}
                  <div className="flex gap-4 mb-6">
                    <button
                      onClick={() => setAuthMode("signin")}
                      className={`pb-2 px-1 font-semibold transition-colors ${
                        authMode === "signin"
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                      }`}
                    >
                      <Mail className="w-4 h-4 inline mr-2" />
                      Sign In
                    </button>
                    <button
                      onClick={() => setAuthMode("signup")}
                      className={`pb-2 px-1 font-semibold transition-colors ${
                        authMode === "signup"
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                      }`}
                    >
                      <User className="w-4 h-4 inline mr-2" />
                      Create Account
                    </button>
                  </div>

                  {/* Sign In Form */}
                  {authMode === "signin" && (
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="••••••••"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-600 text-white"
                      >
                        Sign In
                      </Button>
                    </form>
                  )}

                  {/* Sign Up Form */}
                  {authMode === "signup" && (
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="Your Company"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="••••••••"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-600 text-white"
                      >
                        Create Account
                      </Button>
                    </form>
                  )}
                </div>
              </div>

              {/* Billing Information */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Billing Information
                </h2>
                <div className="space-y-4 bg-card border border-border/40 rounded-lg p-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="4532 1234 5678 9010"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="bg-card border border-border/40 rounded-lg p-6 h-fit sticky top-20">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Order Total
              </h2>

              <div className="space-y-4 border-b border-border/40 pb-6 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">
                    £{totalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (20%)</span>
                  <span className="font-semibold text-foreground">
                    £{taxAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-lg font-bold text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">
                  £{finalTotal.toLocaleString()}
                </span>
              </div>

              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary-600 text-white gap-2 mb-3"
                onClick={handleCompleteOrder}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Complete Purchase"
                )}
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/cart")}
                disabled={loading}
              >
                Back to Cart
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
