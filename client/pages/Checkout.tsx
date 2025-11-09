import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { useUser } from "@/lib/user-context";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader,
  Mail,
  Lock,
  User,
  AlertCircle,
  LogIn,
  CreditCard,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  savePurchasedCompany,
  addInvoice,
  saveBillingInformation,
  getBillingInformation,
  type PurchasedCompanyData,
  type InvoiceData,
  type BillingInformation,
} from "@/lib/user-data";
import { createOrder } from "@/lib/orders";
import { getEnabledFees, calculateFeeAmount } from "@/lib/fees";
import { validateCoupon, applyCoupon } from "@/lib/coupons";
import type { CouponValidationResponse } from "@/lib/coupons";
import { getAPIBaseURL } from "@/lib/transfer-form";
import { deductFromWallet, getUserWallet } from "@/lib/wallet";

export default function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatPrice, convertPrice, currency } = useCurrency();
  const { items, clearCart, totalPrice } = useCart();
  const { isUser, userName, userEmail, loading: authLoading } = useUser();
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
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Billing Information form
  const [billingFullName, setBillingFullName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhoneNumber, setBillingPhoneNumber] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidationResponse | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<"card" | "wallet">("card");
  const [walletBalance, setWalletBalance] = useState(0);

  // Check if user is already logged in on component mount and when UserContext changes
  useEffect(() => {
    // Wait for UserContext to complete its session verification
    if (authLoading) {
      console.log(
        "[Checkout] Waiting for UserContext session verification to complete...",
      );
      return;
    }

    console.log("[Checkout] Checking for existing user session...");
    console.log("[Checkout] UserContext isUser:", isUser);
    console.log("[Checkout] UserContext userEmail:", userEmail ? "✓" : "✗");
    console.log("[Checkout] UserContext userName:", userName ? "✓" : "✗");

    // First, check if user is authenticated via UserContext
    if (isUser && userEmail && userName) {
      console.log(
        "[Checkout] ✓ User is authenticated via UserContext, skipping sign-in form",
      );
      setIsAuthenticated(true);
      setEmail(userEmail);
      setFullName(userName);
      setSignupEmail(userEmail);
    } else {
      // Fallback: Check localStorage for UserContext keys
      const userToken = localStorage.getItem("userToken");
      const storedUserEmail = localStorage.getItem("userEmail");
      const storedUserName = localStorage.getItem("userName");

      console.log("[Checkout] Checking localStorage...");
      console.log("[Checkout] Found userToken:", userToken ? "✓" : "✗");
      console.log("[Checkout] Found userEmail:", storedUserEmail ? "✓" : "✗");
      console.log("[Checkout] Found userName:", storedUserName ? "✓" : "✗");

      if (userToken && storedUserEmail && storedUserName) {
        console.log(
          "[Checkout] ✓ User is authenticated via localStorage, skipping sign-in form",
        );
        setIsAuthenticated(true);
        setEmail(storedUserEmail);
        setFullName(storedUserName);
        setSignupEmail(storedUserEmail);
      }
    }

    // Load saved billing information
    const savedBilling = getBillingInformation();
    if (savedBilling) {
      setBillingFullName(savedBilling.fullName);
      setBillingEmail(savedBilling.email);
      setBillingPhoneNumber(savedBilling.phoneNumber);
      setBillingAddress(savedBilling.billingAddress);
      setBillingCountry(savedBilling.country);
      setCardNumber(savedBilling.cardNumber);
      setExpiryDate(savedBilling.expiryDate);
      setCvv(savedBilling.cvv);
    }
  }, [authLoading, isUser, userEmail, userName]);

  // Fetch wallet balance when user is authenticated
  useEffect(() => {
    const fetchWallet = async () => {
      if (isAuthenticated && email) {
        try {
          // Use email as userId for wallet lookup
          const wallet = await getUserWallet(email);
          setWalletBalance(wallet?.balance || 0);
          console.log("[Checkout] ✓ Wallet balance loaded:", wallet?.balance);
        } catch (error) {
          console.warn("[Checkout] Failed to fetch wallet:", error);
          setWalletBalance(0);
        }
      }
    };
    fetchWallet();
  }, [isAuthenticated, email]);

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    // Calculate the total including fees
    const feesDetails = getEnabledFees().map((fee) => ({
      ...fee,
      calculatedAmount: calculateFeeAmount(fee, totalPrice),
    }));
    const totalFees = feesDetails.reduce(
      (sum, fee) => sum + fee.calculatedAmount,
      0,
    );
    const currentTotal = totalPrice + totalFees;

    try {
      const result = await validateCoupon(couponCode, currentTotal);
      if (result.valid) {
        setAppliedCoupon(result);
        setCouponCode("");
        toast.success("Coupon applied successfully!");
      } else {
        setCouponError(result.message || "Invalid coupon code");
      }
    } catch (error) {
      setCouponError("Error validating coupon");
      console.error(error);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    // Validate authentication
    if (!isAuthenticated) {
      if (authMode === "signin" && (!email || !password)) {
        toast.error("Please sign in to complete your order");
        return;
      }

      if (
        authMode === "signup" &&
        (!fullName ||
          !signupEmail ||
          !signupPassword ||
          !company ||
          !whatsappNumber)
      ) {
        toast.error("Please fill in all required fields");
        return;
      }
    }

    // Validate billing information
    if (
      !billingFullName ||
      !billingEmail ||
      !billingPhoneNumber ||
      !billingAddress ||
      !billingCountry
    ) {
      toast.error("Please fill in all billing information fields");
      return;
    }

    // Validate payment method
    if (paymentMethod === "wallet") {
      const amountToPay = appliedCoupon?.valid
        ? appliedCoupon.discountedTotal
        : finalTotal;
      if (walletBalance < amountToPay) {
        toast.error(
          `Insufficient wallet balance. You need ${formatPrice(amountToPay - walletBalance)} more.`
        );
        return;
      }
    } else if (paymentMethod === "card") {
      // Validate card information
      if (!cardNumber || !expiryDate || !cvv) {
        toast.error("Please fill in all card details");
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
        const fallbackEmail = authMode === "signin" ? email : signupEmail;
        const userFullName =
          authMode === "signin" ? email.split("@")[0] : fullName;
        const userCompany = authMode === "signup" ? company : "Not specified";

        userData = {
          fullName: userFullName,
          email: fallbackEmail,
          company: userCompany,
          accountCreated: new Date().toISOString(),
          authenticated: true,
        };
        localStorage.setItem("user", JSON.stringify(userData));
      }

      const userEmail = userData.email;

      // Save billing information
      const billingInfo: BillingInformation = {
        fullName: billingFullName,
        email: billingEmail,
        phoneNumber: billingPhoneNumber,
        billingAddress: billingAddress,
        country: billingCountry,
        cardNumber: cardNumber,
        expiryDate: expiryDate,
        cvv: cvv,
        savedAt: new Date().toISOString(),
      };
      saveBillingInformation(billingInfo);

      // Create purchased company records, invoices, and orders for each item
      const today = new Date().toISOString().split("T")[0];
      const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const orderPromises = items.map(async (item, index) => {
        // Prices in cart are already converted to selected currency (from CompanyTable)
        // Convert purchase price to selected currency (item.price is in USD from Airtable)
        const convertedAmount =
          currency !== "USD" ? convertPrice(item.price) : item.price;
        // Renewal fees are stored in USD in Airtable, so convert them to selected currency
        const convertedRenewalFees =
          currency !== "USD"
            ? convertPrice(item.renewalFees || 0)
            : item.renewalFees || 0;

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
          renewalFees: convertedRenewalFees,
          status: "pending-form",
          statusLabel: "Pending Transfer Form",
          renewalStatus: "active",
          documents: [],
          transferFormAttachments: [],
          transferFormFilled: false,
          renewalHistory: [],
        };

        savePurchasedCompany(purchasedCompany);

        // Calculate final total with coupon and fees
        const invoiceSubtotal = convertedAmount;
        const invoiceTotalFees = feesDetails.reduce(
          (sum, fee) => sum + fee.calculatedAmount,
          0,
        );
        const invoiceDiscount = appliedCoupon?.valid
          ? appliedCoupon.discount
          : 0;
        const invoiceFinalTotal =
          invoiceSubtotal + invoiceTotalFees - invoiceDiscount;

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
          clientEmail: billingEmail,
          amount: invoiceFinalTotal,
          currency: currency,
          description: `Company Purchase - ${item.name}`,
          status: "paid",
          items: [
            {
              description: `${item.name} - Company Purchase`,
              quantity: 1,
              unitPrice: invoiceSubtotal,
              total: invoiceSubtotal,
            },
            ...feesDetails.map((fee) => ({
              description: `${fee.name}${fee.type === "percentage" ? ` (${fee.amount}%)` : ""}`,
              quantity: 1,
              unitPrice: fee.calculatedAmount,
              total: fee.calculatedAmount,
            })),
            ...(invoiceDiscount > 0
              ? [
                  {
                    description: `Discount (${appliedCoupon?.coupon?.code || "COUPON"})`,
                    quantity: 1,
                    unitPrice: -invoiceDiscount,
                    total: -invoiceDiscount,
                  },
                ]
              : []),
          ],
          orderId: `order-${Date.now()}`,
          couponCode: appliedCoupon?.coupon?.code,
          couponDiscount: invoiceDiscount,
        };

        addInvoice(invoice);

        // Save invoice to API for admin dashboard
        try {
          const baseURL = getAPIBaseURL();
          await fetch(`${baseURL}/api/invoices`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(invoice),
          });
        } catch (error) {
          console.error("Failed to save invoice to API:", error);
          // Don't fail checkout if invoice API sync fails
        }

        // Create order in API
        const orderSubtotal = convertedAmount;
        const orderTotalFees = feesDetails.reduce(
          (sum, fee) => sum + fee.calculatedAmount,
          0,
        );
        const orderDiscount = appliedCoupon?.valid ? appliedCoupon.discount : 0;
        const orderFinalTotal = orderSubtotal + orderTotalFees - orderDiscount;

        const newOrder = {
          id: `ord-${Date.now()}`,
          orderId: `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
          customerName: billingFullName,
          customerEmail: billingEmail,
          customerPhone: billingPhoneNumber,
          billingAddress: billingAddress,
          country: billingCountry,
          companyId: item.id,
          companyName: item.name,
          companyNumber: item.companyNumber,
          paymentMethod: paymentMethod === "wallet" ? "wallet" : "credit_card",
          paymentStatus: "completed",
          transactionId: `txn-${Date.now()}`,
          amount: orderFinalTotal,
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
          renewalFees: convertedRenewalFees,
          appliedFees: feesDetails,
          totalFees: orderTotalFees,
          couponCode: appliedCoupon?.coupon?.code,
          couponDiscount: orderDiscount,
          discountedTotal: orderFinalTotal,
          refundStatus: "none",
          documents: [],
          createdAt: today,
          updatedAt: today,
        };

        try {
          await createOrder(newOrder);
          console.log(`[Checkout] Order created for ${item.name}`);
        } catch (error) {
          console.warn(`Failed to create order for ${item.name}:`, error);
        }

        // Save order to localStorage for persistence across page refreshes
        try {
          const existingOrders = JSON.parse(
            localStorage.getItem("userOrders") || "[]",
          );
          existingOrders.push(newOrder);
          localStorage.setItem("userOrders", JSON.stringify(existingOrders));
          console.log("[Checkout] Order saved to localStorage");
        } catch (error) {
          console.warn(
            "[Checkout] Failed to save order to localStorage:",
            error,
          );
        }
      });

      // Wait for all order creation to complete
      await Promise.all(orderPromises);

      // Deduct from wallet if payment method is wallet
      if (paymentMethod === "wallet") {
        try {
          const walletId = userData.id || billingEmail.split("@")[0];
          const amountToPay = appliedCoupon?.valid
            ? appliedCoupon.discountedTotal
            : finalTotal;

          const walletDeductResult = await deductFromWallet(
            walletId,
            amountToPay,
            `Payment for ${items.map((i) => i.name).join(", ")}`,
            "",
          );

          if (!walletDeductResult.success) {
            console.warn(
              "[Checkout] Wallet deduction failed (insufficient balance or wallet frozen)",
            );
            toast.error("Wallet payment failed. Please try again or use a different payment method.");
          } else {
            console.log(
              `[Checkout] ✓ Deducted ${formatPrice(amountToPay)} from wallet`,
            );
            toast.success(`Payment of ${formatPrice(amountToPay)} deducted from your wallet`);
          }
        } catch (walletError) {
          console.warn(
            "[Checkout] Wallet deduction error:",
            walletError,
          );
          toast.error("Wallet payment error. Please try again.");
        }
      }

      // Auto-create customer account if they don't have one
      try {
        const baseURL = getAPIBaseURL();
        const autoPassword = Math.random().toString(36).slice(-12); // Generate random password

        console.log(`[Checkout] Creating user account for ${billingEmail}`);

        await fetch(`${baseURL}/api/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: billingEmail,
            password: autoPassword,
            name: billingFullName || userData.fullName || "Customer",
          }),
        }).then(async (response) => {
          if (response.ok) {
            const result = await response.json();
            console.log(
              `[Checkout] ✓ User account created successfully for ${billingEmail}`,
            );
            // Store the credentials for the success page to show to user
            localStorage.setItem(
              `checkout_password_${billingEmail}`,
              autoPassword,
            );
            localStorage.setItem(`checkout_password_email`, billingEmail);
            toast.info(`Account created! Login with email: ${billingEmail}`);
          } else if (response.status === 409) {
            console.log(
              `[Checkout] User account already exists for ${billingEmail}`,
            );
          } else {
            console.warn(
              `[Checkout] Failed to create user account:`,
              response.status,
            );
          }
        });
      } catch (error) {
        console.warn(`[Checkout] Failed to create user account:`, error);
        // Don't fail checkout if user account creation fails
      }

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
                Your company ownership transfer has been initiated. Welcome to
                Sharekte!
              </p>
            </div>

            {/* Account Created Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 my-6">
              <div className="flex gap-3 items-start">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold text-green-900">
                    Account Created! ✓
                  </p>
                  <p className="text-sm text-green-800 mt-1">
                    We've automatically created your account with email:{" "}
                    <strong>{billingEmail}</strong>
                  </p>
                  <p className="text-sm text-green-800 mt-2">
                    You can now sign in to your dashboard to view your purchases
                    and complete the transfer form.
                  </p>
                </div>
              </div>
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
                      Sign In to Your Account
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Log in with your email address to access your dashboard
                      (we'll send you a password reset link shortly)
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Complete Transfer Form
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Visit your dashboard to fill out the company transfer form
                      with ownership details
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Upload Documents
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Provide necessary documentation to complete the ownership
                      transfer
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex-shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Finalize Transfer
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Our team will process your documents and complete the
                      transfer
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details Summary */}
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                {items.length} {items.length === 1 ? "company" : "companies"}{" "}
                purchased • Order confirmation sent to your email
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
      !company ||
      !whatsappNumber
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

    if (
      !whatsappNumber.replace(/\D/g, "") ||
      whatsappNumber.replace(/\D/g, "").length < 10
    ) {
      toast.error("Please enter a valid WhatsApp number");
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
      whatsappNumber: whatsappNumber,
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

  // Calculate fees dynamically
  const enabledFees = getEnabledFees();
  const feesDetails = enabledFees.map((fee) => ({
    ...fee,
    calculatedAmount: calculateFeeAmount(fee, totalPrice),
  }));
  const totalFees = feesDetails.reduce(
    (sum, fee) => sum + fee.calculatedAmount,
    0,
  );
  const finalTotal = totalPrice + totalFees;

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
                  {authLoading
                    ? "Verifying Account..."
                    : isAuthenticated
                      ? "✓ Account Verified"
                      : "Create or Sign Into Your Account"}
                </h2>
                <div className="bg-card border border-border/40 rounded-lg p-6 space-y-4">
                  {authLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center space-y-3">
                        <Loader className="w-8 h-8 text-primary animate-spin mx-auto" />
                        <p className="text-muted-foreground">
                          Checking your session...
                        </p>
                      </div>
                    </div>
                  ) : isAuthenticated ? (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="font-semibold text-foreground">
                            Welcome back, {fullName || email.split("@")[0]}! 👋
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {email || signupEmail}
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
                          setWhatsappNumber("");
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
                              WhatsApp Number *
                            </label>
                            <input
                              type="tel"
                              value={whatsappNumber}
                              onChange={(e) =>
                                setWhatsappNumber(e.target.value)
                              }
                              className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="+1 (555) 000-0000"
                              required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              We'll use this for important updates
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Password *
                            </label>
                            <input
                              type="password"
                              value={signupPassword}
                              onChange={(e) =>
                                setSignupPassword(e.target.value)
                              }
                              className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="•��••��•••"
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
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
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
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={billingFullName}
                        onChange={(e) => setBillingFullName(e.target.value)}
                        className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={billingEmail}
                        onChange={(e) => setBillingEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={billingPhoneNumber}
                        onChange={(e) => setBillingPhoneNumber(e.target.value)}
                        className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="+1 (555) 000-0000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        value={billingCountry}
                        onChange={(e) => setBillingCountry(e.target.value)}
                        className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="United Kingdom"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Billing Address *
                    </label>
                    <input
                      type="text"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="123 Main Street, London, UK"
                      required
                    />
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Payment Method
                    </label>
                    <div className="grid md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`p-4 border-2 rounded-lg flex items-center gap-3 transition ${
                          paymentMethod === "card"
                            ? "border-primary bg-primary/10"
                            : "border-border/40 hover:border-primary/50"
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        <div className="text-left">
                          <p className="font-semibold text-foreground">
                            Debit/Credit Card
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Visa, Mastercard, etc.
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("wallet")}
                        className={`p-4 border-2 rounded-lg flex items-center gap-3 transition ${
                          paymentMethod === "wallet"
                            ? "border-primary bg-primary/10"
                            : "border-border/40 hover:border-primary/50"
                        }`}
                      >
                        <WalletIcon className="w-5 h-5" />
                        <div className="text-left">
                          <p className="font-semibold text-foreground">
                            Wallet Balance
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(walletBalance)} available
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Payment Section */}
              {paymentMethod === "card" && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Card Details
                </h2>
                <div className="space-y-4 bg-card border border-border/40 rounded-lg p-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
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
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
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
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Wallet Payment Section */}
              {paymentMethod === "wallet" && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Wallet Payment
                </h2>
                <div className="space-y-4 bg-card border border-border/40 rounded-lg p-6">
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(walletBalance)}
                    </p>
                  </div>
                  <div className="p-4 bg-card border border-border/40 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Amount to Pay</p>
                    <p className="text-3xl font-bold text-foreground">
                      {formatPrice(
                        appliedCoupon?.valid
                          ? appliedCoupon.discountedTotal
                          : finalTotal,
                      )}
                    </p>
                  </div>
                  {walletBalance <
                    (appliedCoupon?.valid
                      ? appliedCoupon.discountedTotal
                      : finalTotal) && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-destructive">Insufficient Balance</p>
                        <p className="text-xs text-destructive/80">
                          You need {formatPrice(
                            (appliedCoupon?.valid
                              ? appliedCoupon.discountedTotal
                              : finalTotal) - walletBalance,
                          )} more to complete this purchase.
                        </p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    Your payment will be deducted from your wallet balance.
                  </p>
                </div>
              </div>
              )}
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
                {feesDetails.map((fee) => (
                  <div key={fee.id} className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      {fee.name}
                      {fee.type === "percentage" && (
                        <span className="text-xs"> ({fee.amount}%)</span>
                      )}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(fee.calculatedAmount)}
                    </span>
                  </div>
                ))}
                {appliedCoupon && appliedCoupon.valid && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm font-medium">
                      Discount ({appliedCoupon.coupon?.code})
                    </span>
                    <span className="font-semibold">
                      -{formatPrice(appliedCoupon.discount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Coupon Input */}
              <div className="mb-6">
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    disabled={couponLoading || (appliedCoupon?.valid ?? false)}
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || (appliedCoupon?.valid ?? false)}
                    variant="outline"
                    size="sm"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </Button>
                </div>
                {couponError && (
                  <p className="text-xs text-destructive">{couponError}</p>
                )}
                {appliedCoupon?.valid && (
                  <p className="text-xs text-green-600">
                    ✓ {appliedCoupon.coupon?.description || "Coupon applied"}
                  </p>
                )}
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-lg font-bold text-foreground">
                  {t("checkout.total")}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(
                    appliedCoupon?.valid
                      ? appliedCoupon.discountedTotal
                      : finalTotal,
                  )}
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
