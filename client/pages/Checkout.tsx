import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { ArrowLeft, ArrowRight, CheckCircle, Loader, Mail, Lock, User, AlertCircle, LogIn } from "lucide-react";
import { toast } from "sonner";
import {
  savePurchasedCompany,
  addInvoice,
  type PurchasedCompanyData,
  type InvoiceData,
} from "@/lib/user-data";
import { createOrder } from "@/lib/orders";

export default function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatPrice, convertPrice, currency } = useCurrency();
  const { items, clearCart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
            <p className="text-muted-foreground">{t("cart.empty")}</p>
            <Button onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t("cart.continueShopping")}
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleCompleteOrder = async () => {
    // Validate authentication
    if (!isAuthenticated) {
      if (authMode === "signin" && (!email || !password)) {
        toast.error("Please sign in to complete your order");
        return;
      }

      if (
        authMode === "signup" &&
        (!fullName || !signupEmail || !signupPassword || !company)
      ) {
        toast.error("Please create an account to complete your order");
        return;
      }
    }

    setLoading(true);
    try {
      // Get user data from localStorage
      const storedUser = localStorage.getItem("user");
      let userData: any;

      if (storedUser && isAuthenticated) {
        userData = JSON.parse(storedUser);
      } else {
        // Fallback if not authenticated (shouldn't happen with validation above)
        const userEmail = authMode === "signin" ? email : signupEmail;
        const userFullName =
          authMode === "signin" ? email.split("@")[0] : fullName;
        const userCompany = authMode === "signup" ? company : "Not specified";

        userData = {
          fullName: userFullName,
          email: userEmail,
          company: userCompany,
          accountCreated: new Date().toISOString(),
          authenticated: true,
        };
        localStorage.setItem("user", JSON.stringify(userData));
      }

      const userEmail = userData.email;

      // Create purchased company records, invoices, and orders for each item
      const today = new Date().toISOString().split("T")[0];
      const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      // Convert prices for all items upfront
      const priceConverter = (price: number) =>
        currency !== "USD" ? convertPrice(price) : price;

      const orderPromises = items.map(async (item, index) => {
        // Convert price to selected currency
        const convertedAmount = priceConverter(item.price);

        // Create purchased company record
        const purchasedCompany: PurchasedCompanyData = {
          id: item.id,
          name: item.name,
          number: item.companyNumber,
          price: convertedAmount,
          incorporationDate: item.incorporationDate || today,
          incorporationYear:
            item.incorporationYear || new Date().getFullYear().toString(),
          country: item.country || "",
          purchasedDate: today,
          renewalDate: oneYearLater,
          renewalFees: item.renewalFees || 0,
          status: "pending-form",
          statusLabel: "Pending Transfer Form",
          renewalStatus: "active",
          documents: [],
          transferFormAttachments: [],
          transferFormFilled: false,
          renewalHistory: [],
        };

        savePurchasedCompany(purchasedCompany);

        // Create invoice record
        const invoice: InvoiceData = {
          id: `inv-${Date.now()}-${index}`,
          invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
          date: today,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          companyName: item.name,
          companyNumber: item.companyNumber,
          clientName: userData.fullName,
          clientEmail: userEmail,
          amount: convertedAmount,
          currency: currency,
          description: `Company Purchase - ${item.name}`,
          status: "paid",
          items: [
            {
              description: `${item.name} - Company Purchase`,
              quantity: 1,
              unitPrice: convertedAmount,
              total: convertedAmount,
            },
          ],
          orderId: `order-${Date.now()}`,
        };

        addInvoice(invoice);

        // Create order in API
        try {
          await createOrder({
            orderId: `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
            customerName: userData.fullName,
            customerEmail: userEmail,
            customerPhone: "+1 (555) 000-0000",
            billingAddress: "Not specified",
            country: item.country || "Not specified",
            companyId: item.id,
            companyName: item.name,
            companyNumber: item.companyNumber,
            paymentMethod: "credit_card",
            paymentStatus: "completed",
            transactionId: `txn-${Date.now()}`,
            amount: convertedAmount,
            currency: currency,
            paymentDate: today,
            status: "paid",
            statusChangedDate: today,
            statusHistory: [
              {
                id: `hist-${Date.now()}`,
                fromStatus: "pending-payment",
                toStatus: "paid",
                changedDate: today,
                changedBy: "system",
                notes: "Order created through checkout",
              },
            ],
            purchaseDate: today,
            lastUpdateDate: today,
            renewalDate: oneYearLater,
            renewalFees: item.renewalFees || 0,
            refundStatus: "none",
            documents: [],
            createdAt: today,
            updatedAt: today,
          });
        } catch (error) {
          console.warn(`Failed to create order for ${item.name}:`, error);
          // Non-blocking error - order may have been saved to localStorage anyway
        }
      });

      // Wait for all order creation to complete
      await Promise.all(orderPromises);

      // Update status for each company to "sold" in Airtable
      const updatePromises = items.map(async (item) => {
        try {
          const response = await fetch(`/api/companies/${item.id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "Sold",
            }),
          });

          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ error: response.statusText }));
            const errorMessage =
              typeof errorData === "object"
                ? JSON.stringify(errorData)
                : String(errorData);
            console.error(
              `Failed to update company ${item.id} (${item.name}) status:`,
              `Status: ${response.status}`,
              `Error:`,
              errorMessage,
            );
            toast.error(`Failed to update ${item.name}: ${response.status}`);
            return false;
          }

          const responseData = await response.json().catch(() => ({}));
          console.log(
            `✓ Company ${item.id} (${item.name}) status updated to sold`,
            responseData,
          );
          return true;
        } catch (error) {
          console.error(`Error updating company ${item.id} status:`, error);
          toast.error(`Error updating ${item.name} status`);
          return false;
        }
      });

      // Wait for all updates to complete
      const results = await Promise.all(updatePromises);
      const successCount = results.filter(Boolean).length;
      const failureCount = results.filter((r) => !r).length;

      if (failureCount > 0) {
        console.warn(
          `Warning: ${failureCount} company/companies failed to update status. ${successCount} succeeded.`,
        );
        toast.warning(
          `${failureCount} company status updates failed. Check admin dashboard.`,
        );
      }

      // Log completion for debugging
      console.log(
        `Order completed: ${successCount}/${items.length} companies status updated`,
      );

      toast.success("Order completed successfully! 🎉");
      setOrderCompleted(true);
      clearCart();

      // Redirect to dashboard to see orders and purchased companies
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);

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
        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="text-center space-y-6 max-w-2xl">
            {/* Success Icon */}
            <div className="flex justify-center">
              <CheckCircle className="w-20 h-20 text-primary" />
            </div>

            {/* Main Message */}
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                🎉 Purchase Successful!
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Your company ownership transfer has been initiated. Welcome to Sharekte!
              </p>
            </div>

            {/* What's Next */}
            <div className="bg-card border border-border/40 rounded-lg p-8 my-8">
              <h2 className="text-xl font-bold text-foreground mb-6">
                What's Next?
              </h2>
              <div className="space-y-4 text-left">
                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Complete Transfer Form
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Visit your dashboard to fill out the company transfer form with ownership details
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Upload Documents
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Provide necessary documentation to complete the ownership transfer
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Finalize Transfer
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Our team will process your documents and complete the transfer
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details Summary */}
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                {items.length} {items.length === 1 ? "company" : "companies"} purchased • Order confirmation sent to your email
              </p>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="bg-primary hover:bg-primary-600 text-white font-semibold gap-2 mt-6"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>

            {/* Redirect Notice */}
            <p className="text-xs text-muted-foreground">
              Automatically redirecting to your dashboard in 3 seconds...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !fullName ||
      !signupEmail ||
      !signupPassword ||
      !confirmPassword ||
      !company
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!signupEmail.includes("@")) {
      toast.error("Please enter a valid email");
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

    // Check if user already exists
    const existingUser = localStorage.getItem("user");
    if (existingUser) {
      const user = JSON.parse(existingUser);
      if (user.email === signupEmail) {
        toast.error("An account with this email already exists");
        return;
      }
    }

    // Create account
    const userData = {
      fullName: fullName,
      email: signupEmail,
      company: company,
      accountCreated: new Date().toISOString(),
      authenticated: true,
    };
    localStorage.setItem("user", JSON.stringify(userData));

    setIsAuthenticated(true);
    toast.success("Account created successfully! 🎉");
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Simple authentication (in production, this would check against a real database)
    const userData = {
      fullName: email.split("@")[0],
      email: email,
      authenticated: true,
      lastLogin: new Date().toISOString(),
    };
    localStorage.setItem("user", JSON.stringify(userData));

    setIsAuthenticated(true);
    toast.success("Signed in successfully! 🎉");
  };

  const taxAmount = Math.round(totalPrice * 0.2);
  const finalTotal = totalPrice + taxAmount;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Checkout Header */}
      <section className="border-b border-border/40 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("checkout.title")}
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
                  {t("checkout.orderSummary")}
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
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authentication Section */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">
                  {isAuthenticated ? "✓ Account Verified" : "Create or Sign Into Your Account"}
                </h2>
                <div className="bg-card border border-border/40 rounded-lg p-6 space-y-4">
                  {isAuthenticated ? (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="font-semibold text-foreground">
                            Welcome, {authMode === "signin" ? email.split("@")[0] : fullName}! 👋
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {authMode === "signin" ? email : signupEmail}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ready to complete your purchase!
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAuthenticated(false);
                          setEmail("");
                          setPassword("");
                          setFullName("");
                          setSignupEmail("");
                          setSignupPassword("");
                          setConfirmPassword("");
                          setCompany("");
                        }}
                        className="mt-4 w-full text-xs"
                      >
                        Use Different Account
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Tabs */}
                      <div className="flex gap-4 mb-6 border-b border-border/40">
                        <button
                          onClick={() => setAuthMode("signin")}
                          className={`pb-3 px-1 font-semibold transition-colors ${
                            authMode === "signin"
                              ? "text-primary border-b-2 border-primary -mb-px"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <LogIn className="w-4 h-4 inline mr-2" />
                          {t("auth.signIn")}
                        </button>
                        <button
                          onClick={() => setAuthMode("signup")}
                          className={`pb-3 px-1 font-semibold transition-colors ${
                            authMode === "signup"
                              ? "text-primary border-b-2 border-primary -mb-px"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <User className="w-4 h-4 inline mr-2" />
                          {t("auth.signUp")}
                        </button>
                      </div>

                      {/* Sign In Form */}
                      {authMode === "signin" && (
                        <form onSubmit={handleSignIn} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Email Address
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
                            className="w-full bg-primary hover:bg-primary-600 text-white font-semibold"
                          >
                            Sign In & Continue
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                            Don't have an account?{" "}
                            <button
                              type="button"
                              onClick={() => setAuthMode("signup")}
                              className="text-primary hover:underline font-semibold"
                            >
                              Create one here
                            </button>
                          </p>
                        </form>
                      )}

                      {/* Sign Up Form */}
                      {authMode === "signup" && (
                        <form onSubmit={handleSignUp} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="John Doe"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Email Address *
                            </label>
                            <input
                              type="email"
                              value={signupEmail}
                              onChange={(e) => setSignupEmail(e.target.value)}
                              className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="john@example.com"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Company Name *
                            </label>
                            <input
                              type="text"
                              value={company}
                              onChange={(e) => setCompany(e.target.value)}
                              className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="Your Company"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Password *
                            </label>
                            <input
                              type="password"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="••••••••"
                              required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Minimum 6 characters
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Confirm Password *
                            </label>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="••••••••"
                              required
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary-600 text-white font-semibold"
                          >
                            Create Account & Continue
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                            Already have an account?{" "}
                            <button
                              type="button"
                              onClick={() => setAuthMode("signin")}
                              className="text-primary hover:underline font-semibold"
                            >
                              Sign in here
                            </button>
                          </p>
                        </form>
                      )}
                    </>
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
                {t("checkout.orderSummary")}
              </h2>

              <div className="space-y-4 border-b border-border/40 pb-6 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("checkout.subtotal")}
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("checkout.tax")}
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(taxAmount)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-lg font-bold text-foreground">
                  {t("checkout.total")}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(finalTotal)}
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
