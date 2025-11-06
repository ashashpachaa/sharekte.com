import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  X,
  ShoppingCart,
  Edit2,
  FileText,
  Clock,
  AlertCircle,
  Download,
  CheckCircle,
  Zap,
} from "lucide-react";
import { useSearch } from "@/hooks/use-search";
import {
  getPurchasedCompanies,
  getInvoices,
  savePurchasedCompany,
  updatePurchasedCompanyStatus,
  addInvoice,
  renewCompany,
  updateCompanyRenewalStatus,
  type PurchasedCompanyData,
} from "@/lib/user-data";
import { useCurrency } from "@/lib/currency-context";
import { MyOrders } from "@/components/MyOrders";
import { CompanyTransferForm } from "@/components/CompanyTransferForm";
import { StatusHistoryTimeline } from "@/components/StatusHistoryTimeline";
import { getAPIBaseURL } from "@/lib/transfer-form";
import {
  BarChart3,
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  ArrowUpRight,
  User,
  Lock,
  CreditCard,
  LogIn,
  Edit2,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Building2,
  Download,
  FileText,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  FileUp,
  Stamp,
  Scale,
  Wallet,
  Zap,
  Package,
  DollarSign as DollarSignIcon,
} from "lucide-react";
import { toast } from "sonner";

type DashboardTab =
  | "portfolio"
  | "companies"
  | "orders"
  | "invoices"
  | "marketplace"
  | "account"
  | "payments"
  | "security";

interface Service {
  id: string;
  name: string;
  description: string;
  duration: string;
  fees: number;
  category: string;
  features: string[];
  icon: any;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  companyName: string;
  companyNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  description: string;
  status: "paid" | "unpaid" | "canceled";
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface RenewalHistoryEntry {
  id: string;
  renewalDate: string;
  renewedDate: string;
  isLate: boolean;
  daysLate: number;
  status: "on-time" | "late" | "pending";
}

interface PurchasedCompany {
  id: string;
  name: string;
  number: string;
  price: number;
  incorporationDate: string;
  incorporationYear: string;
  country: string;
  purchasedDate: string;
  renewalDate: string;
  renewalFees: number;
  status:
    | "pending-form"
    | "under-review"
    | "amend-required"
    | "pending-transfer"
    | "completed";
  statusLabel: string;
  renewalStatus: "active" | "expired" | "cancelled";
  documents: Document[];
  transferFormFilled: boolean;
  adminComments?: string;
  statusHistory?: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    changedDate: string;
    changedBy: string;
    reason?: string;
    notes?: string;
  }>;
  renewalHistory: RenewalHistoryEntry[];
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadedDate: string;
  url?: string;
}

interface UserData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  company: string;
}

interface PaymentMethod {
  id: string;
  type: "card" | "wallet" | "stripe";
  lastDigits?: string;
  brand?: string;
  expiryDate?: string;
  isDefault: boolean;
  addedDate: string;
}

interface LoginHistory {
  id: string;
  date: string;
  time: string;
  ip: string;
  device: string;
  location: string;
}

function formatPriceWithCurrency(
  amount: number,
  currency: string,
  rates: Record<string, { symbol: string; rate: number }>,
): string {
  // Default to USD if currency is undefined or invalid
  const validCurrency = currency || "USD";
  const currencyInfo = rates[validCurrency as keyof typeof rates];

  // Fallback symbol map in case rates lookup fails
  const fallbackSymbols: Record<string, string> = {
    USD: "$",
    GBP: "£",
    AED: "د.إ",
    EUR: "€",
    SAR: "﷼",
  };

  const symbol = currencyInfo?.symbol || fallbackSymbols[validCurrency] || "$";

  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { formatPrice, rates, currency, convertPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<DashboardTab>("portfolio");
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Search states for different tabs
  const [companiesSearch, setCompaniesSearch] = useState("");
  const [invoicesSearch, setInvoicesSearch] = useState("");
  const [marketplaceSearch, setMarketplaceSearch] = useState("");

  // Invoice view state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // User data state
  const [userData, setUserData] = useState<UserData>(() => {
    // Try to load from new login system first
    const userEmailStored = localStorage.getItem("userEmail");
    const userName = localStorage.getItem("userName");

    if (userEmailStored && userName) {
      return {
        fullName: userName,
        email: userEmailStored,
        phone: "+1 (555) 123-4567",
        address: "123 Business Street",
        city: "New York",
        country: "United States",
        company: "",
      };
    }

    // Fallback to old "user" object format for backwards compatibility
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          fullName: parsed.fullName || "",
          email: parsed.email || "",
          phone: parsed.phone || "+1 (555) 123-4567",
          address: parsed.address || "123 Business Street",
          city: parsed.city || "New York",
          country: parsed.country || "United States",
          company: parsed.company || "",
        };
      } catch (e) {
        console.warn("Could not parse user data from localStorage");
      }
    }

    // Default values
    return {
      fullName: "User",
      email: "user@example.com",
      phone: "+1 (555) 123-4567",
      address: "123 Business Street",
      city: "New York",
      country: "United States",
      company: "",
    };
  });

  const [editedData, setEditedData] = useState<UserData>(userData);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    const saved = localStorage.getItem("paymentMethods");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            type: "card",
            brand: "Visa",
            lastDigits: "4242",
            expiryDate: "12/25",
            isDefault: true,
            addedDate: "2024-01-15",
          },
          {
            id: "2",
            type: "card",
            brand: "Mastercard",
            lastDigits: "5555",
            expiryDate: "08/26",
            isDefault: false,
            addedDate: "2024-02-20",
          },
        ];
  });

  // Login history state
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>(() => {
    const saved = localStorage.getItem("loginHistory");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            date: "2024-12-15",
            time: "14:32:00",
            ip: "192.168.1.100",
            device: "Chrome on Windows 10",
            location: "New York, US",
          },
          {
            id: "2",
            date: "2024-12-14",
            time: "09:15:00",
            ip: "192.168.1.101",
            device: "Safari on iPhone 13",
            location: "New York, US",
          },
          {
            id: "3",
            date: "2024-12-13",
            time: "18:45:00",
            ip: "192.168.1.100",
            device: "Chrome on Windows 10",
            location: "New York, US",
          },
        ];
  });

  // Utility function to calculate days remaining
  const calculateDaysRemaining = (renewalDate: string): number => {
    const renewal = new Date(renewalDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = renewal.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Purchased companies state - fetch user-specific data
  const [purchasedCompanies, setPurchasedCompanies] = useState<
    PurchasedCompany[]
  >(() => {
    const userCompanies = getPurchasedCompanies();
    return userCompanies.map((uc) => {
      // Ensure renewalStatus exists
      if (!uc.renewalStatus) {
        uc.renewalStatus = "active";
        savePurchasedCompany(uc);
      }

      // Ensure renewalHistory exists
      if (!uc.renewalHistory) {
        uc.renewalHistory = [];
      }

      // Update renewal status based on days remaining
      const daysRemaining = calculateDaysRemaining(uc.renewalDate);
      let currentRenewalStatus = uc.renewalStatus;

      if (currentRenewalStatus !== "cancelled" && daysRemaining <= -15) {
        currentRenewalStatus = "cancelled";
        updateCompanyRenewalStatus(uc.id, "cancelled");
      } else if (
        currentRenewalStatus !== "cancelled" &&
        daysRemaining <= 0 &&
        daysRemaining > -15
      ) {
        currentRenewalStatus = "expired";
        updateCompanyRenewalStatus(uc.id, "expired");
      } else if (currentRenewalStatus === "expired" && daysRemaining > 0) {
        currentRenewalStatus = "active";
        updateCompanyRenewalStatus(uc.id, "active");
      }

      return {
        id: uc.id,
        name: uc.name,
        number: uc.number,
        price: uc.price,
        incorporationDate: uc.incorporationDate,
        incorporationYear: uc.incorporationYear,
        country: uc.country,
        purchasedDate: uc.purchasedDate,
        renewalDate: uc.renewalDate,
        renewalFees: uc.renewalFees,
        status: uc.status,
        statusLabel: uc.statusLabel,
        documents: uc.documents || [], // Initialize as empty array if not present
        transferFormFilled: uc.transferFormFilled,
        adminComments: uc.adminComments,
        renewalStatus: currentRenewalStatus,
        renewalHistory: uc.renewalHistory || [],
      };
    });
  });

  // Load order documents and associate with companies
  useEffect(() => {
    const loadOrderDocuments = async () => {
      try {
        const apiBaseURL = getAPIBaseURL();
        const apiUrl = `${apiBaseURL}/api/orders`;
        console.log(`[Dashboard] Fetching orders from: ${apiUrl}`);

        const response = await fetch(apiUrl);
        if (!response.ok) {
          console.error(
            "[Dashboard] Failed to fetch orders:",
            response.status,
            response.statusText
          );
          return;
        }

        const orders = await response.json();
        console.log(`[Dashboard] Loaded ${orders.length} orders`);

        // Update companies with documents from their orders
        setPurchasedCompanies((prevCompanies) =>
          prevCompanies.map((company) => {
            // Find the order for this company
            const companyOrder = orders.find(
              (order: any) =>
                order.companyName &&
                order.companyName.toLowerCase() === company.name.toLowerCase(),
            );

            if (
              companyOrder &&
              companyOrder.documents &&
              companyOrder.documents.length > 0
            ) {
              console.log(
                `[Dashboard] Found ${companyOrder.documents.length} documents for ${company.name}`,
              );
              return {
                ...company,
                documents: companyOrder.documents.map((doc: any) => ({
                  id: doc.id,
                  name: doc.name,
                  type: doc.type,
                  uploadedDate: doc.uploadedDate,
                  url: doc.fileData ? undefined : doc.url, // Use fileData as URL if available
                })),
              };
            }

            return company;
          }),
        );
      } catch (error) {
        console.error("[Dashboard] Error loading order documents:", error);
        // Don't throw - silently fail so dashboard still works
      }
    };

    loadOrderDocuments();
  }, []); // Run once on mount

  const [showTransferForm, setShowTransferForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    directorName: "",
    directorEmail: "",
    shareholderName: "",
    shareholderEmail: "",
    companyAddress: "",
    attachments: [] as Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      uploadedDate: string;
      base64Data: string;
    }>,
  });

  // Auto-refresh transfer form status from Airtable every 10 seconds
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 3;

    const syncForms = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const apiBaseURL = getAPIBaseURL();
        const response = await fetch(`${apiBaseURL}/api/transfer-forms`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const forms = await response.json();
          retryCount = 0; // Reset retry count on success
          console.log(
            "[Dashboard Auto-Sync] Fetched forms:",
            forms.map((f) => ({
              name: f.companyName,
              status: f.status,
              orderId: f.orderId,
            })),
          );

          // Update purchasedCompanies status if any form status changed in Airtable
          setPurchasedCompanies((prevCompanies) =>
            prevCompanies.map((company) => {
              // Find corresponding form - match by company name (most reliable)
              const correspondingForm = forms.find(
                (f) =>
                  f.companyName &&
                  f.companyName.toLowerCase() === company.name.toLowerCase(),
              );

              console.log(
                `[Dashboard Auto-Sync] Looking for form for "${company.name}", found:`,
                correspondingForm?.companyName,
                "status:",
                correspondingForm?.status,
              );

              if (
                correspondingForm &&
                correspondingForm.status &&
                correspondingForm.status !== company.status
              ) {
                console.log(
                  `[Dashboard Auto-Sync] Status change detected for ${company.name}: "${company.status}" → "${correspondingForm.status}"`,
                );
                // Update local state with new status
                const updatedCompany = {
                  ...company,
                  status: correspondingForm.status,
                };
                // Persist to localStorage
                savePurchasedCompany(updatedCompany);
                return updatedCompany;
              }

              return company;
            }),
          );
        } else {
          console.warn(
            `[Dashboard Auto-Sync] Received status ${response.status}`,
          );
        }
      } catch (error) {
        retryCount++;
        if (retryCount <= maxRetries) {
          console.warn(
            `[Dashboard Auto-Sync] Attempt ${retryCount}/${maxRetries} failed:`,
            error instanceof Error ? error.message : String(error),
          );
        } else {
          console.warn(
            "[Dashboard Auto-Sync] Max retries exceeded, stopping sync",
          );
          clearInterval(refreshInterval);
        }
      }
    };

    // Start sync after a short delay to avoid immediate fetch
    const startTimer = setTimeout(() => {
      syncForms(); // Initial sync
      refreshInterval = setInterval(syncForms, 10000); // Auto-refresh every 10 seconds
    }, 1000);

    return () => {
      clearTimeout(startTimer);
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  // Services state (Marketplace)
  const [services] = useState<Service[]>([
    {
      id: "apostille",
      name: "Apostille",
      description:
        "Get your company documents certified with an apostille for international use. Apostille is a form of authentication issued to documents for use in countries that are parties to the Hague Apostille Convention.",
      duration: "2-3 business days",
      fees: 150,
      category: "Documentation",
      features: [
        "Official certification",
        "International recognition",
        "Multiple document copies",
        "Digital delivery",
      ],
      icon: Stamp,
    },
    {
      id: "poa",
      name: "Power of Attorney (POA)",
      description:
        "Establish a legal power of attorney document for your company. Allows another person to act on your behalf for business transactions and legal matters.",
      duration: "3-5 business days",
      fees: 200,
      category: "Legal Services",
      features: [
        "Legal document preparation",
        "Notarization",
        "Multiple copies",
        "Legal consultation included",
      ],
      icon: Scale,
    },
    {
      id: "wise-account",
      name: "Wise Bank Account Setup",
      description:
        "Set up a business bank account with Wise for international payments and transfers. Low fees for multi-currency transactions.",
      duration: "1-2 business days",
      fees: 100,
      category: "Banking",
      features: [
        "Account setup assistance",
        "Multi-currency support",
        "Competitive exchange rates",
        "Ongoing support",
      ],
      icon: Wallet,
    },
    {
      id: "stripe",
      name: "Stripe Account Setup",
      description:
        "Get your Stripe business account configured for online payments. Accept credit cards, digital wallets, and more with competitive processing rates.",
      duration: "1 business day",
      fees: 75,
      category: "Payment Processing",
      features: [
        "Account setup and verification",
        "Payment gateway configuration",
        "Integration support",
        "Fraud protection included",
      ],
      icon: Zap,
    },
    {
      id: "tax-registration",
      name: "VAT/Tax Registration",
      description:
        "Register your company for VAT or other tax obligations. Ensures compliance with local tax authorities and enables tax-compliant invoicing.",
      duration: "5-7 business days",
      fees: 250,
      category: "Tax & Compliance",
      features: [
        "Tax authority registration",
        "Compliance review",
        "Documentation assistance",
        "Tax guidance",
      ],
      icon: DollarSignIcon,
    },
    {
      id: "accounting-setup",
      name: "Accounting Setup",
      description:
        "Professional accounting system setup for your business. Organize your finances with proper accounting software and templates.",
      duration: "3-4 business days",
      fees: 180,
      category: "Business Services",
      features: [
        "Accounting software setup",
        "Chart of accounts creation",
        "Process documentation",
        "Training session included",
      ],
      icon: Package,
    },
  ]);

  const [cartItems, setCartItems] = useState<
    Array<{ id: string; name: string; fees: number }>
  >(() => {
    const saved = localStorage.getItem("serviceCart");
    return saved ? JSON.parse(saved) : [];
  });

  // Invoices state - fetch user-specific data
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const userInvoices = getInvoices();
    return userInvoices.map((ui) => ({
      id: ui.id,
      invoiceNumber: ui.invoiceNumber,
      date: ui.date,
      dueDate: ui.dueDate,
      companyName: ui.companyName,
      companyNumber: ui.companyNumber,
      clientName: ui.clientName,
      clientEmail: ui.clientEmail,
      amount: ui.amount,
      description: ui.description,
      status: ui.status,
      items: ui.items,
    }));
  });

  // Save edited user data
  const handleSaveProfile = () => {
    if (!editedData.fullName || !editedData.email || !editedData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUserData(editedData);
    localStorage.setItem("user", JSON.stringify(editedData));
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  // Handle password change
  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    toast.success("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Delete payment method
  const handleDeletePayment = (id: string) => {
    const filtered = paymentMethods.filter((p) => p.id !== id);
    if (filtered.length === 0) {
      toast.error("You must have at least one payment method");
      return;
    }
    setPaymentMethods(filtered);
    localStorage.setItem("paymentMethods", JSON.stringify(filtered));
    toast.success("Payment method removed");
  };

  // Set default payment method
  const handleSetDefault = (id: string) => {
    const updated = paymentMethods.map((p) => ({
      ...p,
      isDefault: p.id === id,
    }));
    setPaymentMethods(updated);
    localStorage.setItem("paymentMethods", JSON.stringify(updated));
    toast.success("Default payment method updated");
  };

  // Handle file attachment for transfer form
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = [...formData.attachments];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        newAttachments.push({
          id: `attachment-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedDate: new Date().toISOString().split("T")[0],
          base64Data: base64Data,
        });
        setFormData({
          ...formData,
          attachments: newAttachments,
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = "";
  };

  const removeAttachment = (attachmentId: string) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((a) => a.id !== attachmentId),
    });
  };

  // Submit transfer form
  const handleSubmitTransferForm = (companyId: string) => {
    if (
      !formData.directorName ||
      !formData.directorEmail ||
      !formData.shareholderName ||
      !formData.shareholderEmail
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Update in user-specific storage
    const company = purchasedCompanies.find((c) => c.id === companyId);
    if (company) {
      const updatedCompany: PurchasedCompanyData = {
        id: company.id,
        name: company.name,
        number: company.number,
        price: company.price,
        incorporationDate: company.incorporationDate,
        incorporationYear: company.incorporationYear,
        country: company.country,
        purchasedDate: company.purchasedDate,
        renewalDate: company.renewalDate,
        renewalFees: company.renewalFees,
        status: "under-review",
        statusLabel: "Under Review Transfer Form",
        renewalStatus: company.renewalStatus,
        documents: company.documents,
        transferFormAttachments: formData.attachments,
        transferFormFilled: true,
        transferFormData: {
          directorName: formData.directorName,
          directorEmail: formData.directorEmail,
          shareholderName: formData.shareholderName,
          shareholderEmail: formData.shareholderEmail,
          companyAddress: formData.companyAddress,
        },
        adminComments: company.adminComments,
        renewalHistory: company.renewalHistory,
      };
      savePurchasedCompany(updatedCompany);
    }

    updatePurchasedCompanyStatus(
      companyId,
      "under-review",
      "Under Review Transfer Form",
    );

    const updated = purchasedCompanies.map((c) =>
      c.id === companyId
        ? {
            ...c,
            status: "under-review" as const,
            statusLabel: "Under Review Transfer Form",
            transferFormFilled: true,
          }
        : c,
    );

    setPurchasedCompanies(updated);
    setShowTransferForm(null);
    setFormData({
      directorName: "",
      directorEmail: "",
      shareholderName: "",
      shareholderEmail: "",
      companyAddress: "",
      attachments: [],
    });

    toast.success("Transfer form submitted for review!");
  };

  // Generate PDF invoice (simplified)
  const handleDownloadInvoice = (invoice: Invoice) => {
    // Generate HTML content for PDF
    const invoiceHTML = `
      <html>
        <head>
          <title>${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .invoice-header { text-align: center; margin-bottom: 30px; }
            .invoice-header h1 { margin: 0; font-size: 28px; }
            .invoice-header p { margin: 5px 0; color: #666; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .row-label { color: #666; }
            .row-value { font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { text-align: left; padding: 10px; background-color: #f5f5f5; border-bottom: 2px solid #333; font-weight: bold; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .total-section { text-align: right; margin-top: 30px; }
            .total-row { font-size: 18px; font-weight: bold; margin-top: 10px; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; background-color: #4caf50; color: white; font-size: 12px; margin-top: 10px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <h1>INVOICE</h1>
            <p>Invoice Number: <strong>${invoice.invoiceNumber}</strong></p>
          </div>

          <div class="section">
            <div class="section-title">COMPANY INFORMATION</div>
            <div class="row">
              <span class="row-label">Company Name:</span>
              <span class="row-value">${invoice.companyName}</span>
            </div>
            <div class="row">
              <span class="row-label">Company Number:</span>
              <span class="row-value">${invoice.companyNumber}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">CLIENT INFORMATION</div>
            <div class="row">
              <span class="row-label">Name:</span>
              <span class="row-value">${invoice.clientName}</span>
            </div>
            <div class="row">
              <span class="row-label">Email:</span>
              <span class="row-value">${invoice.clientEmail}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">INVOICE DETAILS</div>
            <div class="row">
              <span class="row-label">Invoice Date:</span>
              <span class="row-value">${invoice.date}</span>
            </div>
            <div class="row">
              <span class="row-label">Due Date:</span>
              <span class="row-value">${invoice.dueDate}</span>
            </div>
            <div class="row">
              <span class="row-label">Status:</span>
              <span class="row-value"><span class="status-badge">${invoice.status.toUpperCase()}</span></span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">LINE ITEMS</div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${invoice.currency}${item.unitPrice.toLocaleString()}</td>
                    <td>${invoice.currency}${item.total.toLocaleString()}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="total-section">
            <div>Subtotal: ${invoice.currency}${invoice.amount.toLocaleString()}</div>
            <div class="total-row">Total: ${invoice.currency}${invoice.amount.toLocaleString()}</div>
          </div>

          <div class="footer">
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p style="margin-top: 20px;">Please save this invoice as a PDF using your browser's print function (Ctrl+P or Cmd+P) and select "Save as PDF".</p>
          </div>
        </body>
      </html>
    `;

    // Open in new window for print-to-PDF
    const printWindow = window.open("", "", "height=800,width=900");
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();

      // Trigger print dialog after content loads
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      // Fallback: create HTML blob and download
      const blob = new Blob([invoiceHTML], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoiceNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }

    toast.success(
      "Opening invoice for download... Use Ctrl+P (or Cmd+P) to save as PDF",
    );
  };

  // Print invoice
  const handlePrintInvoice = (invoice: Invoice) => {
    const printContent = `
      <html>
        <head>
          <title>${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice-header { text-align: center; margin-bottom: 20px; }
            .invoice-header h1 { margin: 0; }
            .invoice-details { margin: 20px 0; }
            .section-title { font-weight: bold; font-size: 16px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ccc; }
            .detail-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .items-table th { background-color: #f5f5f5; }
            .total-section { text-align: right; margin-top: 20px; }
            .total-amount { font-size: 18px; font-weight: bold; margin-top: 10px; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; margin-top: 10px; }
            .status-paid { background-color: #d4edda; color: #155724; }
            .status-unpaid { background-color: #fff3cd; color: #856404; }
            .status-canceled { background-color: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <h1>INVOICE</h1>
            <p>Invoice Number: ${invoice.invoiceNumber}</p>
          </div>

          <div class="invoice-details">
            <div class="detail-row">
              <span>Invoice Date:</span>
              <span>${invoice.date}</span>
            </div>
            <div class="detail-row">
              <span>Due Date:</span>
              <span>${invoice.dueDate}</span>
            </div>
          </div>

          <div class="section-title">COMPANY INFORMATION</div>
          <div class="invoice-details">
            <div class="detail-row">
              <span>Company Name:</span>
              <span>${invoice.companyName}</span>
            </div>
            <div class="detail-row">
              <span>Company Number:</span>
              <span>${invoice.companyNumber}</span>
            </div>
          </div>

          <div class="section-title">CLIENT INFORMATION</div>
          <div class="invoice-details">
            <div class="detail-row">
              <span>Name:</span>
              <span>${invoice.clientName}</span>
            </div>
            <div class="detail-row">
              <span>Email:</span>
              <span>${invoice.clientEmail}</span>
            </div>
          </div>

          <div class="section-title">INVOICE ITEMS</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>£${item.unitPrice.toLocaleString()}</td>
                  <td>£${item.total.toLocaleString()}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="total-section">
            <div class="detail-row">
              <span>Subtotal:</span>
              <span>£${invoice.amount.toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span>Tax:</span>
              <span>£0.00</span>
            </div>
            <div class="total-amount">
              Total: £${invoice.amount.toLocaleString()}
            </div>
            <div class="status-badge status-${invoice.status}">
              ${invoice.status.toUpperCase()}
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "", "height=600,width=800");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }

    toast.success("Invoice sent to printer!");
  };

  // Add service to cart
  const handleAddToCart = (service: Service) => {
    const newCartItem = {
      id: service.id,
      name: service.name,
      fees: service.fees,
    };

    const updatedCart = [...cartItems, newCartItem];
    setCartItems(updatedCart);
    localStorage.setItem("serviceCart", JSON.stringify(updatedCart));
    toast.success(`${service.name} added to cart!`);
  };

  // Remove service from cart
  const handleRemoveFromCart = (serviceId: string) => {
    const updatedCart = cartItems.filter((item) => item.id !== serviceId);
    setCartItems(updatedCart);
    localStorage.setItem("serviceCart", JSON.stringify(updatedCart));
    toast.success("Service removed from cart");
  };

  // Calculate total
  const cartTotal = cartItems.reduce((total, item) => total + item.fees, 0);

  // Checkout with services
  const handleCheckoutServices = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (paymentMethods.length === 0) {
      toast.error("Please add a payment method first");
      return;
    }

    // Create invoices for each service
    const newInvoices = cartItems.map((item, idx) => ({
      id: `service-inv-${Date.now()}-${idx}`,
      invoiceNumber: `INV-SVC-${Date.now()}-${idx}`,
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      companyName: userData.company || "N/A",
      companyNumber: "N/A",
      clientName: userData.fullName,
      clientEmail: userData.email,
      amount: item.fees,
      currency: currency,
      description: `Additional Service: ${item.name}`,
      status: "paid" as const,
      items: [
        {
          description: item.name,
          quantity: 1,
          unitPrice: item.fees,
          total: item.fees,
        },
      ],
    }));

    // Save each invoice to user-specific storage
    newInvoices.forEach((inv) => {
      addInvoice(inv);
    });

    const updatedInvoices = [...invoices, ...newInvoices];
    setInvoices(updatedInvoices);

    setCartItems([]);
    localStorage.removeItem("serviceCart");

    toast.success(
      `Order completed! ${cartItems.length} service(s) added to your account.`,
    );
  };

  // Get status color, icon, and label
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending-form":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: Clock,
          bgLight: "bg-yellow-50",
          label: "Pending Form",
        };
      case "under-review":
        return {
          color: "bg-blue-100 text-blue-800",
          icon: FileText,
          bgLight: "bg-blue-50",
          label: "Under Review",
        };
      case "amend-required":
        return {
          color: "bg-orange-100 text-orange-800",
          icon: AlertCircle,
          bgLight: "bg-orange-50",
          label: "Amend Required",
        };
      case "pending-transfer":
        return {
          color: "bg-purple-100 text-purple-800",
          icon: FileUp,
          bgLight: "bg-purple-50",
          label: "Pending Transfer",
        };
      case "completed":
        return {
          color: "bg-green-100 text-green-800",
          icon: CheckCircle,
          bgLight: "bg-green-50",
          label: "Completed",
        };
      case "complete-transfer":
        return {
          color: "bg-green-100 text-green-800",
          icon: CheckCircle,
          bgLight: "bg-green-50",
          label: "Completed Transfer",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: Clock,
          bgLight: "bg-gray-50",
          label: status || "Unknown",
        };
    }
  };

  // Get status-specific message for transfer form status alerts
  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending-form":
        return {
          icon: "📋",
          headline: "Form Pending",
          description:
            "Your transfer form is awaiting submission. Please fill out all required fields and submit to begin the review process.",
          color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700",
          textColor: "text-yellow-600",
        };
      case "under-review":
        return {
          icon: "⏳",
          headline: "Form Under Review",
          description:
            "Your transfer form has been submitted and is currently under review by our admin team. You'll be able to edit it once they request amendments.",
          color: "bg-blue-500/10 border-blue-500/30 text-blue-700",
          textColor: "text-blue-600",
        };
      case "amend-required":
        return {
          icon: "✏️",
          headline: "Amendments Required",
          description:
            "The admin team has requested amendments to your transfer form. Please review their comments and update the form accordingly.",
          color: "bg-orange-500/10 border-orange-500/30 text-orange-700",
          textColor: "text-orange-600",
        };
      case "confirm-application":
        return {
          icon: "✔️",
          headline: "Application Ready for Confirmation",
          description:
            "Your transfer application has passed the review process and is ready for final confirmation. Our team will process the confirmation and initiate the transfer within 1-2 business days.",
          color: "bg-blue-500/10 border-blue-500/30 text-blue-700",
          textColor: "text-blue-600",
        };
      case "pending-transfer":
        return {
          icon: "📤",
          headline: "Pending Transfer",
          description:
            "Your transfer form has been approved and is now pending final transfer processing. The transfer should complete within 3-5 business days.",
          color: "bg-purple-500/10 border-purple-500/30 text-purple-700",
          textColor: "text-purple-600",
        };
      case "transferring":
        return {
          icon: "🔄",
          headline: "Transfer in Progress",
          description:
            "Your company transfer is currently in progress. The process typically takes 3-5 business days. You'll receive a notification once the transfer is complete.",
          color: "bg-purple-500/10 border-purple-500/30 text-purple-700",
          textColor: "text-purple-600",
        };
      case "complete-transfer":
        return {
          icon: "✅",
          headline: "Transfer Successfully Completed",
          description:
            "The company ownership transfer has been successfully finalized. All documentation has been processed and filed with the relevant authorities. You now have full ownership and control of the company.",
          color: "bg-green-500/10 border-green-500/30 text-green-700",
          textColor: "text-green-600",
        };
      case "completed":
        return {
          icon: "✅",
          headline: "Transfer Completed",
          description:
            "The company transfer process has been completed successfully.",
          color: "bg-green-500/10 border-green-500/30 text-green-700",
          textColor: "text-green-600",
        };
      case "canceled":
        return {
          icon: "❌",
          headline: "Transfer Canceled",
          description:
            "The transfer process for this company has been canceled. Please contact support if you need further assistance.",
          color: "bg-red-500/10 border-red-500/30 text-red-700",
          textColor: "text-red-600",
        };
      default:
        return null;
    }
  };

  // Portfolio data from actual purchased companies
  const ownedCompanies = purchasedCompanies.map((company) => ({
    id: company.id,
    name: company.name,
    number: company.number,
    incorporationDate: company.incorporationDate,
    incorporationYear: company.incorporationYear,
    revenue: "$0", // Calculate or fetch from company data if available
    monthlyRevenue: "$0",
    growth: "+0%",
    employees: 0,
    status: company.status === "completed" ? "Active" : "Pending",
  }));

  // Calculate portfolio statistics from actual purchased companies
  const totalPortfolioValue = purchasedCompanies.reduce((sum) => sum + 2000, 0); // Base value per company
  const totalCompanies = purchasedCompanies.length;

  // Calculate portfolio metrics
  const pendingTransferCount = purchasedCompanies.filter(
    (c) => c.status === "pending-form" || c.status === "under-review",
  ).length;

  const expireSoonCount = purchasedCompanies.filter((c) => {
    const daysRemaining = calculateDaysRemaining(c.renewalDate);
    return daysRemaining <= 15 && daysRemaining > -15;
  }).length;

  const totalInvoices = invoices.length;

  const stats = [
    {
      label: "Companies Owned",
      value: totalCompanies.toString(),
      icon: BarChart3,
      change: `${totalCompanies} active`,
    },
    {
      label: "Pending Transfer Form",
      value: pendingTransferCount.toString(),
      icon: FileText,
      change: pendingTransferCount > 0 ? "Awaiting review" : "All completed",
    },
    {
      label: "Expire Soon",
      value: expireSoonCount.toString(),
      icon: AlertCircle,
      change: expireSoonCount > 0 ? "Action needed" : "All good",
    },
    {
      label: "Total Invoices",
      value: totalInvoices.toString(),
      icon: DollarSign,
      change: formatPrice(invoices.reduce((sum, inv) => sum + inv.amount, 0)),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Dashboard Header */}
      <section className="border-b border-border/40 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("dashboard.title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("dashboard.subtitle")}
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-b border-border/40 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`py-4 px-1 font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "portfolio"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              <BarChart3 className="w-4 h-4 flex-shrink-0" />
              {t("dashboard.portfolio")}
            </button>
            <button
              onClick={() => setActiveTab("companies")}
              className={`py-4 px-1 font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "companies"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              <Building2 className="w-4 h-4 flex-shrink-0" />
              {t("dashboard.myCompanies")}
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`py-4 px-1 font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "orders"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              <ShoppingCart className="w-4 h-4 flex-shrink-0" />
              {t("dashboard.myOrders")}
            </button>
            <button
              onClick={() => setActiveTab("invoices")}
              className={`py-4 px-1 font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "invoices"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              {t("dashboard.invoices")}
            </button>
            <button
              onClick={() => setActiveTab("marketplace")}
              className={`py-4 px-1 font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "marketplace"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              <Package className="w-4 h-4 flex-shrink-0" />
              {t("dashboard.marketplace")}
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`py-4 px-1 font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "account"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              <User className="w-4 h-4 flex-shrink-0" />
              {t("dashboard.myAccount")}
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`py-4 px-1 font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "payments"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              <CreditCard className="w-4 h-4 flex-shrink-0" />
              {t("dashboard.paymentMethods")}
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`py-4 px-1 font-semibold transition-colors whitespace-nowrap ${
                activeTab === "security"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Security
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 py-12">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Marketplace Tab */}
          {activeTab === "marketplace" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Services Marketplace
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Add additional services to your company package
                  </p>
                </div>

                {cartItems.length > 0 && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Cart Total
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        £{cartTotal.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cartItems.length}{" "}
                        {cartItems.length === 1 ? "service" : "services"}
                      </p>
                    </div>
                    <Button
                      onClick={handleCheckoutServices}
                      className="w-full bg-primary hover:bg-primary-600 text-white gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Checkout
                    </Button>
                  </div>
                )}
              </div>

              {/* Services Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => {
                  const ServiceIcon = service.icon;
                  const isInCart = cartItems.some(
                    (item) => item.id === service.id,
                  );

                  return (
                    <div
                      key={service.id}
                      className="bg-card border border-border/40 rounded-lg overflow-hidden hover:shadow-md transition-all hover:border-primary/50"
                    >
                      {/* Service Header */}
                      <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-b border-border/40">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <ServiceIcon className="w-8 h-8 text-primary flex-shrink-0" />
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-semibold rounded">
                            {service.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">
                          {service.name}
                        </h3>
                      </div>

                      {/* Service Details */}
                      <div className="p-6 space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>

                        {/* Features */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Includes
                          </p>
                          <ul className="space-y-1">
                            {service.features.map((feature, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-foreground flex items-start gap-2"
                              >
                                <span className="text-primary mt-1">✓</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {service.duration}
                        </div>

                        {/* Price and Action */}
                        <div className="pt-4 border-t border-border/40 space-y-3">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-primary">
                              £{service.fees}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              one-time
                            </span>
                          </div>

                          {isInCart ? (
                            <div className="space-y-2">
                              <div className="text-sm text-primary font-semibold text-center">
                                ✓ Added to cart
                              </div>
                              <Button
                                variant="outline"
                                className="w-full text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveFromCart(service.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleAddToCart(service)}
                              className="w-full bg-primary hover:bg-primary-600 text-white gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add to Cart
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === "invoices" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl font-bold text-foreground">Invoices</h2>
                <div className="flex-1 md:flex-initial md:w-64 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={invoicesSearch}
                    onChange={(e) => setInvoicesSearch(e.target.value)}
                    className="pl-10 pr-4"
                  />
                  {invoicesSearch && (
                    <button
                      onClick={() => setInvoicesSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {invoices.length === 0 ? (
                <div className="bg-card border border-border/40 rounded-lg p-12 text-center space-y-4">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto" />
                  <p className="text-muted-foreground">
                    You don't have any invoices yet
                  </p>
                </div>
              ) : (
                <div>
                  {(() => {
                    const filtered = invoices.filter((invoice) => {
                      const query = invoicesSearch.toLowerCase();
                      return (
                        invoice.invoiceNumber.toLowerCase().includes(query) ||
                        invoice.companyName.toLowerCase().includes(query) ||
                        invoice.description.toLowerCase().includes(query)
                      );
                    });

                    if (filtered.length === 0 && invoicesSearch) {
                      return (
                        <div className="bg-card border border-border/40 rounded-lg p-8 text-center text-muted-foreground">
                          No invoices match your search
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((invoice) => (
                          <div
                            key={invoice.id}
                            className="bg-card border border-border/40 rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
                          >
                            {/* Invoice Header */}
                            <div className="p-4 border-b border-border/40 bg-muted/30">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                    <h3 className="font-bold text-foreground text-sm truncate">
                                      {invoice.invoiceNumber}
                                    </h3>
                                  </div>
                                  <div
                                    className={`px-2 py-1 rounded-full font-semibold text-xs whitespace-nowrap flex-shrink-0 ${
                                      invoice.status === "paid"
                                        ? "bg-green-100 text-green-800"
                                        : invoice.status === "unpaid"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {invoice.status === "paid" && "�� Paid"}
                                    {invoice.status === "unpaid" && "⏳ Unpaid"}
                                    {invoice.status === "canceled" &&
                                      "✗ Canceled"}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {invoice.description}
                                </p>
                              </div>
                            </div>

                            {/* Invoice Details */}
                            <div className="p-4 space-y-3 flex-1 flex flex-col">
                              {/* Company & Client Info */}
                              <div className="space-y-2 text-xs">
                                <div>
                                  <p className="text-muted-foreground mb-0.5">
                                    Company
                                  </p>
                                  <p className="font-semibold text-foreground">
                                    {invoice.companyName}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-0.5">
                                    Client
                                  </p>
                                  <p className="font-semibold text-foreground text-xs truncate">
                                    {invoice.clientName}
                                  </p>
                                </div>
                              </div>

                              {/* Dates */}
                              <div className="space-y-2 text-xs border-t border-border/40 pt-3">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Invoice:
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {invoice.date}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Due:
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {invoice.dueDate}
                                  </span>
                                </div>
                              </div>

                              {/* Total */}
                              <div className="flex justify-end pt-3 border-t border-border/40 mt-auto">
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Amount
                                  </p>
                                  <p className="text-lg font-bold text-primary">
                                    {formatPriceWithCurrency(
                                      invoice.amount,
                                      currency,
                                      rates,
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 pt-3 border-t border-border/40">
                                <Button
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setShowInvoiceModal(true);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 flex-1 text-xs h-8"
                                >
                                  <Eye className="w-3 h-3" />
                                  View
                                </Button>
                                <Button
                                  onClick={() => handleDownloadInvoice(invoice)}
                                  size="sm"
                                  className="bg-primary hover:bg-primary-600 text-white gap-1 flex-1 text-xs h-8"
                                >
                                  <Download className="w-3 h-3" />
                                  Download
                                </Button>
                                <Button
                                  onClick={() => handlePrintInvoice(invoice)}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-1 text-xs h-8"
                                >
                                  <FileUp className="w-3 h-3" />
                                  Print
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Invoice View Modal */}
          {selectedInvoice && (
            <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Invoice {selectedInvoice.invoiceNumber}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedInvoice.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Header */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          {selectedInvoice.invoiceNumber}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedInvoice.description}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full font-semibold text-sm ${
                          selectedInvoice.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : selectedInvoice.status === "unpaid"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedInvoice.status === "paid" && "✓ Paid"}
                        {selectedInvoice.status === "unpaid" && "⏳ Unpaid"}
                        {selectedInvoice.status === "canceled" && "�� Canceled"}
                      </div>
                    </div>
                  </div>

                  {/* Company & Client Info */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Company
                      </p>
                      <p className="font-semibold text-foreground">
                        {selectedInvoice.companyName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedInvoice.companyNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Client
                      </p>
                      <p className="font-semibold text-foreground">
                        {selectedInvoice.clientName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedInvoice.clientEmail}
                      </p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid md:grid-cols-2 gap-6 border-t pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Invoice Date
                      </p>
                      <p className="font-semibold text-foreground">
                        {selectedInvoice.date}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Due Date
                      </p>
                      <p className="font-semibold text-foreground">
                        {selectedInvoice.dueDate}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold text-foreground mb-3">
                      Line Items
                    </p>
                    <div className="space-y-2">
                      {selectedInvoice.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center py-2 border-b text-sm"
                        >
                          <div className="flex-1">
                            <p className="text-foreground">
                              {item.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity} ×{" "}
                              {formatPriceWithCurrency(
                                item.unitPrice,
                                selectedInvoice.currency,
                                rates,
                              )}
                            </p>
                          </div>
                          <p className="font-semibold text-foreground">
                            {formatPriceWithCurrency(
                              item.total,
                              selectedInvoice.currency,
                              rates,
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-end">
                      <div className="w-48">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-muted-foreground">
                            Subtotal
                          </span>
                          <span className="text-sm font-medium">
                            {formatPriceWithCurrency(
                              selectedInvoice.amount,
                              currency,
                              rates,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="font-semibold text-foreground">
                            Total
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {formatPriceWithCurrency(
                              selectedInvoice.amount,
                              currency,
                              rates,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 border-t pt-4">
                    <Button
                      onClick={() => handleDownloadInvoice(selectedInvoice)}
                      className="bg-primary hover:bg-primary-600 text-white gap-1 flex-1"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                    <Button
                      onClick={() => handlePrintInvoice(selectedInvoice)}
                      variant="outline"
                      className="gap-1 flex-1"
                    >
                      <FileUp className="w-4 h-4" />
                      Print
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* My Companies Tab */}
          {activeTab === "companies" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl font-bold text-foreground">
                  My Companies
                </h2>
                <div className="flex-1 md:flex-initial md:w-64 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    value={companiesSearch}
                    onChange={(e) => setCompaniesSearch(e.target.value)}
                    className="pl-10 pr-4"
                  />
                  {companiesSearch && (
                    <button
                      onClick={() => setCompaniesSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {purchasedCompanies.length === 0 ? (
                <div className="bg-card border border-border/40 rounded-lg p-12 text-center space-y-4">
                  <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto" />
                  <p className="text-muted-foreground">
                    You haven't purchased any companies yet
                  </p>
                  <Button
                    className="bg-accent hover:bg-accent/80 text-white"
                    asChild
                  >
                    <Link to="/">Browse Marketplace</Link>
                  </Button>
                </div>
              ) : (
                <div>
                  {(() => {
                    const filtered = purchasedCompanies.filter((company) => {
                      const query = companiesSearch.toLowerCase();
                      return (
                        company.name.toLowerCase().includes(query) ||
                        company.number.toLowerCase().includes(query)
                      );
                    });

                    if (filtered.length === 0 && companiesSearch) {
                      return (
                        <div className="bg-card border border-border/40 rounded-lg p-8 text-center text-muted-foreground">
                          No companies match your search
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((company) => {
                          const statusConfig = getStatusConfig(company.status);
                          const StatusIcon = statusConfig.icon;
                          const daysRemaining = calculateDaysRemaining(
                            company.renewalDate,
                          );

                          return (
                            <div
                              key={company.id}
                              className="bg-card border border-border/40 rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
                            >
                              {/* Company Header */}
                              <div
                                className={`${statusConfig.bgLight} p-4 border-b border-border/40`}
                              >
                                <div className="space-y-3">
                                  <h3 className="text-lg font-bold text-foreground">
                                    {company.name}
                                  </h3>
                                  <p className="text-xs text-muted-foreground">
                                    {company.number}
                                  </p>
                                  <div
                                    className={`${statusConfig.color} inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold text-xs`}
                                  >
                                    <StatusIcon className="w-3 h-3" />
                                    {statusConfig.label}
                                  </div>
                                </div>
                              </div>

                              {/* Company Details */}
                              <div className="p-4 space-y-4 flex-1">
                                {/* Incorporation & Renewal Info */}
                                <div className="space-y-3 border-b border-border/40 pb-3">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Incorporated
                                      </p>
                                      <p className="font-semibold text-foreground text-sm">
                                        {company.incorporationDate}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Year
                                      </p>
                                      <p className="font-semibold text-foreground text-sm">
                                        {company.incorporationYear}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Country
                                    </p>
                                    <p className="font-semibold text-foreground text-sm">
                                      {company.country || "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Purchased
                                    </p>
                                    <p className="font-semibold text-foreground text-sm">
                                      {company.purchasedDate}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Renewal Date
                                    </p>
                                    <p className="font-semibold text-foreground text-sm">
                                      {company.renewalDate}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Annual Renewal Fees
                                    </p>
                                    <p className="font-semibold text-foreground text-sm">
                                      {/* Renewal fees are already in user's selected currency - just format with symbol */}
                                      {formatPriceWithCurrency(
                                        company.renewalFees,
                                        currency,
                                        rates,
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {/* Renewal History */}
                                {company.renewalHistory &&
                                  company.renewalHistory.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold text-foreground">
                                        Renewal History
                                      </p>
                                      <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {company.renewalHistory.map(
                                          (renewal) => (
                                            <div
                                              key={renewal.id}
                                              className="text-xs p-2 bg-muted/30 rounded border border-border/40"
                                            >
                                              <div className="flex justify-between mb-1">
                                                <span className="text-muted-foreground">
                                                  {renewal.renewalDate}
                                                </span>
                                                <span
                                                  className={`font-semibold ${
                                                    renewal.status === "on-time"
                                                      ? "text-green-600"
                                                      : "text-amber-600"
                                                  }`}
                                                >
                                                  {renewal.status === "on-time"
                                                    ? "✓ On Time"
                                                    : `⚠ ${renewal.daysLate}d Late`}
                                                </span>
                                              </div>
                                              <p className="text-muted-foreground text-xs">
                                                Renewed: {renewal.renewedDate}
                                              </p>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Renewal Countdown Section */}
                                {(() => {
                                  const daysRemaining = calculateDaysRemaining(
                                    company.renewalDate,
                                  );
                                  const isRenewalNeeded =
                                    daysRemaining <= 15 &&
                                    daysRemaining > -15 &&
                                    company.renewalStatus === "active";
                                  const isExpired =
                                    daysRemaining <= 0 && daysRemaining > -15;
                                  const isCancelled = daysRemaining <= -15;

                                  return (
                                    <>
                                      {/* Renewal Alert - 15 days before */}
                                      {isRenewalNeeded && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                                          <div className="flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                              <p className="text-xs font-semibold text-red-900 mb-1">
                                                {daysRemaining} days to renew
                                              </p>
                                              <p className="text-xs text-red-800 leading-tight">
                                                Renew now to prevent
                                                cancellation
                                              </p>
                                            </div>
                                          </div>
                                          <Button
                                            onClick={() => {
                                              renewCompany(company.id);
                                              setPurchasedCompanies((prev) =>
                                                prev.map((c) =>
                                                  c.id === company.id
                                                    ? {
                                                        ...c,
                                                        renewalDate: new Date(
                                                          Date.now() +
                                                            365 *
                                                              24 *
                                                              60 *
                                                              60 *
                                                              1000,
                                                        )
                                                          .toISOString()
                                                          .split("T")[0],
                                                        renewalStatus: "active",
                                                      }
                                                    : c,
                                                ),
                                              );
                                              toast.success(
                                                `Company renewed! New renewal date set to 1 year from today`,
                                              );
                                            }}
                                            className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
                                          >
                                            <Zap className="w-4 h-4" />
                                            Renew Now
                                          </Button>
                                        </div>
                                      )}

                                      {/* Expired Status */}
                                      {isExpired && (
                                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                                          <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                              <p className="text-sm font-semibold text-orange-900 mb-1">
                                                Expired -{" "}
                                                {Math.abs(daysRemaining)} days
                                                overdue
                                              </p>
                                              <p className="text-sm text-orange-800">
                                                Your company ownership has
                                                expired. Renew immediately to
                                                prevent cancellation.
                                              </p>
                                            </div>
                                          </div>
                                          <Button
                                            onClick={() => {
                                              renewCompany(company.id);
                                              setPurchasedCompanies((prev) =>
                                                prev.map((c) =>
                                                  c.id === company.id
                                                    ? {
                                                        ...c,
                                                        renewalDate: new Date(
                                                          Date.now() +
                                                            365 *
                                                              24 *
                                                              60 *
                                                              60 *
                                                              1000,
                                                        )
                                                          .toISOString()
                                                          .split("T")[0],
                                                        renewalStatus: "active",
                                                      }
                                                    : c,
                                                ),
                                              );
                                              toast.success(
                                                `Company renewed! New renewal date set to 1 year from today`,
                                              );
                                            }}
                                            className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2"
                                          >
                                            <Zap className="w-4 h-4" />
                                            Renew Now
                                          </Button>
                                        </div>
                                      )}

                                      {/* Cancelled Status */}
                                      {isCancelled && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                          <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                              <p className="text-sm font-semibold text-red-900 mb-1">
                                                Ownership Cancelled
                                              </p>
                                              <p className="text-sm text-red-800">
                                                Your company ownership has been
                                                cancelled due to renewal
                                                expiration. Unfortunately,
                                                renewal is no longer available
                                                for this company.
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Active Status - Show Days Remaining */}
                                      {daysRemaining > 15 &&
                                        company.renewalStatus === "active" && (
                                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-start gap-3">
                                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                              <div className="flex-1">
                                                <p className="text-sm font-semibold text-green-900">
                                                  Active - {daysRemaining} days
                                                  until renewal required
                                                </p>
                                                <p className="text-sm text-green-800">
                                                  Your company is active and in
                                                  good standing
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                    </>
                                  );
                                })()}

                                {/* Transfer Workflow Status */}
                                <div>
                                  <h4 className="font-semibold text-foreground mb-4">
                                    Transfer Workflow
                                  </h4>
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="flex-1 h-2 bg-border/40 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-primary transition-all"
                                        style={{
                                          width: `${
                                            {
                                              "pending-form": "20%",
                                              "under-review": "40%",
                                              "amend-required": "40%",
                                              "pending-transfer": "80%",
                                              completed: "100%",
                                            }[company.status] || "0%"
                                          }`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    <p>
                                      {company.status === "pending-form" &&
                                        "⏳ Waiting for you to complete the transfer form"}
                                      {company.status === "under-review" &&
                                        "👀 Admin is reviewing your submitted form"}
                                      {company.status === "amend-required" &&
                                        "✏️ Please review admin comments and make amendments"}
                                      {company.status === "pending-transfer" &&
                                        "🔄 Form approved! Ownership transfer is in progress"}
                                      {company.status === "completed" &&
                                        "✅ Ownership transfer completed successfully"}
                                    </p>
                                  </div>

                                  {/* Quick Action Buttons */}
                                  <div className="flex gap-2 flex-wrap mt-4">
                                    {company.adminComments && (
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                          >
                                            <AlertCircle className="w-4 h-4 text-orange-600" />
                                            View Admin Comments
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>
                                              Admin Comments
                                            </DialogTitle>
                                          </DialogHeader>
                                          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                            <p className="text-sm text-orange-800 whitespace-pre-wrap">
                                              {company.adminComments}
                                            </p>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    )}
                                    {company.statusHistory &&
                                      company.statusHistory.length > 0 && (
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="gap-2"
                                            >
                                              <Clock className="w-4 h-4" />
                                              View Status History (
                                              {company.statusHistory.length})
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                              <DialogTitle>
                                                Status History
                                              </DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                              {company.statusHistory
                                                ?.slice()
                                                .reverse()
                                                .map((entry, idx) => (
                                                  <div
                                                    key={entry.id}
                                                    className="p-3 border border-border rounded-lg"
                                                  >
                                                    <div className="flex items-start gap-3">
                                                      <div className="flex-1">
                                                        <p className="text-sm font-semibold">
                                                          Status Change #
                                                          {idx + 1}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                          {entry.fromStatus} →{" "}
                                                          {entry.toStatus}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                          {new Date(
                                                            entry.changedDate,
                                                          ).toLocaleString()}
                                                        </p>
                                                        {entry.notes && (
                                                          <p className="text-xs mt-2 text-foreground">
                                                            {entry.notes}
                                                          </p>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      )}
                                  </div>
                                </div>

                                {/* Admin Comments */}
                                {company.adminComments && (
                                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                    <p className="text-sm font-semibold text-orange-900 mb-2">
                                      Admin Comments
                                    </p>
                                    <p className="text-sm text-orange-800">
                                      {company.adminComments}
                                    </p>
                                  </div>
                                )}

                                {/* Status History */}
                                {company.statusHistory &&
                                  company.statusHistory.length > 0 && (
                                    <div className="p-4 bg-background border border-border rounded-lg">
                                      <StatusHistoryTimeline
                                        statusHistory={company.statusHistory}
                                      />
                                    </div>
                                  )}

                                {/* Transfer Form Action Buttons */}
                                <div className="flex gap-2 flex-wrap pt-2">
                                  {company.status === "amend-required" && (
                                    <Button
                                      className="gap-2 bg-accent hover:bg-accent/80 text-white flex-1"
                                      size="sm"
                                      onClick={() =>
                                        setShowTransferForm(company.id)
                                      }
                                    >
                                      <Edit2 className="w-4 h-4" />
                                      Make Amendments
                                    </Button>
                                  )}
                                  {company.status === "pending-form" && (
                                    <Button
                                      className="gap-2 bg-accent hover:bg-accent/80 text-white flex-1"
                                      size="sm"
                                      onClick={() =>
                                        setShowTransferForm(company.id)
                                      }
                                    >
                                      <FileText className="w-4 h-4" />
                                      Complete Form
                                    </Button>
                                  )}
                                  {company.status === "under-review" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      disabled
                                    >
                                      <Clock className="w-4 h-4 mr-2" />
                                      Under Review
                                    </Button>
                                  )}
                                  {company.status === "pending-transfer" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      disabled
                                    >
                                      <Zap className="w-4 h-4 mr-2" />
                                      Transfer in Progress
                                    </Button>
                                  )}
                                  {company.status === "completed" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 text-green-600"
                                      disabled
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Completed
                                    </Button>
                                  )}
                                </div>

                                {/* Documents Section */}
                                <div>
                                  <h4 className="font-semibold text-foreground mb-4">
                                    Documents
                                  </h4>
                                  {company.documents.length > 0 ? (
                                    <div className="space-y-3">
                                      {company.documents.map((doc) => (
                                        <div
                                          key={doc.id}
                                          className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/40"
                                        >
                                          <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-primary" />
                                            <div>
                                              <p className="font-semibold text-foreground">
                                                {doc.name}
                                              </p>
                                              <p className="text-sm text-muted-foreground">
                                                Uploaded {doc.uploadedDate}
                                              </p>
                                            </div>
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => {
                                              if (doc.url) {
                                                const a =
                                                  document.createElement("a");
                                                a.href = doc.url;
                                                a.download = doc.name;
                                                a.click();
                                              }
                                            }}
                                          >
                                            <Download className="w-4 h-4" />
                                            Download
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="p-4 bg-muted/30 rounded-lg border border-border/40 text-center">
                                      <p className="text-sm text-muted-foreground">
                                        No documents uploaded yet. Admin will
                                        upload your company documents here.
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Transfer Form */}
                                {company.status !== "completed" && (
                                  <div>
                                    {getStatusMessage(company.status) && (
                                      <div
                                        className={`border rounded-lg p-4 mb-4 ${getStatusMessage(company.status)?.color}`}
                                      >
                                        <p className="font-medium text-sm">
                                          {
                                            getStatusMessage(company.status)
                                              ?.icon
                                          }{" "}
                                          {
                                            getStatusMessage(company.status)
                                              ?.headline
                                          }
                                        </p>
                                        <p
                                          className={`text-xs mt-1 ${getStatusMessage(company.status)?.textColor}`}
                                        >
                                          {
                                            getStatusMessage(company.status)
                                              ?.description
                                          }
                                        </p>
                                      </div>
                                    )}
                                    <Button
                                      onClick={() =>
                                        setShowTransferForm(company.id)
                                      }
                                      disabled={
                                        (company.transferFormFilled &&
                                          company.status !==
                                            "amend-required") ||
                                        company.status ===
                                          "complete-transfer" ||
                                        company.status === "completed"
                                      }
                                      className="w-full bg-primary hover:bg-primary-600 text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <FileUp className="w-4 h-4" />
                                      {company.status === "amend-required"
                                        ? "Edit Transfer Form (Amendments Required)"
                                        : company.status === "under-review"
                                          ? "Form Under Review - Cannot Edit"
                                          : company.status ===
                                              "pending-transfer"
                                            ? "Transfer in Progress - Cannot Edit"
                                            : company.status ===
                                                  "complete-transfer" ||
                                                company.status === "completed"
                                              ? "Transfer Completed - View Form"
                                              : company.transferFormFilled
                                                ? "Edit Transfer Form"
                                                : "Fill Transfer Form"}
                                    </Button>
                                  </div>
                                )}

                                {/* Transfer Form Modal */}
                                <Dialog
                                  open={showTransferForm === company.id}
                                  onOpenChange={(open) =>
                                    !open && setShowTransferForm(null)
                                  }
                                >
                                  <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto w-[95vw] p-0">
                                    <DialogHeader className="sticky top-0 bg-background border-b p-6 z-10">
                                      <DialogTitle>
                                        Company Transfer Form
                                      </DialogTitle>
                                      <DialogDescription>
                                        Fill out the comprehensive transfer form
                                        for {company.name}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="px-6 pb-6">
                                      <CompanyTransferForm
                                        orderId={company.id}
                                        companyId={company.id}
                                        companyName={company.name}
                                        companyNumber={company.number || ""}
                                        country={company.country || ""}
                                        incorporationDate={
                                          company.incorporationDate || ""
                                        }
                                        incorporationYear={
                                          parseInt(company.incorporationYear) ||
                                          new Date().getFullYear()
                                        }
                                        isEditing={
                                          company.status === "amend-required"
                                        }
                                        onSuccess={() => {
                                          toast.success(
                                            "Transfer form submitted successfully and is now under review!",
                                          );
                                          // Update company object with new status and form filled flag
                                          const updatedCompany = {
                                            ...company,
                                            status: "under-review" as const,
                                            transferFormFilled: true,
                                            statusLabel:
                                              "Under Review - Transfer Form",
                                          };

                                          // Save the updated company to localStorage to persist both status and transferFormFilled
                                          savePurchasedCompany(updatedCompany);

                                          // Update local state to reflect the status change immediately
                                          const updatedCompanies =
                                            purchasedCompanies.map((c) =>
                                              c.id === company.id
                                                ? updatedCompany
                                                : c,
                                            );
                                          // Force component to re-render with updated companies
                                          setPurchasedCompanies(
                                            updatedCompanies,
                                          );
                                          setShowTransferForm(null);
                                        }}
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* My Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <MyOrders userEmail={userData.email || "user@example.com"} />
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === "portfolio" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="bg-card border border-border/40 rounded-lg p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-sm font-semibold text-primary/60">
                          {stat.change}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Companies */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Your Companies
                </h2>
                {ownedCompanies.length > 0 ? (
                  <div className="space-y-4">
                    {ownedCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="bg-card border border-border/40 rounded-lg p-6 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex-shrink-0"></div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-foreground">
                                  {company.name}
                                </h3>
                                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                                  {company.status}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {company.employees} employees
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-6">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                Annual Revenue
                              </p>
                              <p className="text-xl font-bold text-foreground mt-1">
                                {company.revenue}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                Monthly
                              </p>
                              <p className="text-xl font-bold text-foreground mt-1">
                                {company.monthlyRevenue}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                Growth
                              </p>
                              <p className="text-xl font-bold text-primary mt-1 flex items-center gap-1">
                                <ArrowUpRight className="w-4 h-4" />
                                {company.growth}
                              </p>
                            </div>
                          </div>

                          <Button variant="outline">View Details</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card border border-border/40 rounded-lg p-12 text-center space-y-4">
                    <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto" />
                    <p className="text-muted-foreground">
                      You haven't purchased any companies yet
                    </p>
                    <Button
                      className="bg-accent hover:bg-accent/80 text-white"
                      asChild
                    >
                      <Link to="/">Browse Marketplace</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Account Tab */}
          {activeTab === "account" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-card border border-border/40 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    Profile Information
                  </h2>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(true);
                        setEditedData(userData);
                      }}
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <form className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={editedData.fullName}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              fullName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={editedData.email}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              email: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          value={editedData.phone}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              phone: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          value={editedData.company}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              company: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={editedData.address}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            address: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={editedData.city}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              city: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          value={editedData.country}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              country: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleSaveProfile}
                        className="bg-primary hover:bg-primary-600 text-white gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Full Name
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {userData.fullName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="text-lg font-semibold text-foreground">
                          {userData.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="text-lg font-semibold text-foreground">
                          {userData.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p className="text-lg font-semibold text-foreground">
                          {userData.company}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="text-lg font-semibold text-foreground">
                        {userData.address}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">City</p>
                        <p className="text-lg font-semibold text-foreground">
                          {userData.city}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Country</p>
                        <p className="text-lg font-semibold text-foreground">
                          {userData.country}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === "payments" && (
            <div className="max-w-3xl space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {t("dashboard.paymentMethods")}
                </h2>
                <Button className="bg-primary hover:bg-primary-600 text-white gap-2">
                  <Plus className="w-4 h-4" />
                  Add Payment Method
                </Button>
              </div>

              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="bg-card border border-border/40 rounded-lg p-6 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <p className="font-semibold text-foreground">
                          {method.brand} •••• {method.lastDigits}
                        </p>
                        {method.isDefault && (
                          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex gap-6 text-sm text-muted-foreground">
                        <span>Expires {method.expiryDate}</span>
                        <span>Added {method.addedDate}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {!method.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeletePayment(method.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Change Password */}
              <div className="max-w-2xl bg-card border border-border/40 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Change Password
                </h2>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    className="bg-primary hover:bg-primary-600 text-white gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Change Password
                  </Button>
                </form>
              </div>

              {/* Login History */}
              <div className="bg-card border border-border/40 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Login History
                </h2>

                <div className="space-y-4">
                  {loginHistory.map((login) => (
                    <div
                      key={login.id}
                      className="flex items-start justify-between pb-4 border-b border-border/40 last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <LogIn className="w-5 h-5 text-primary flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-foreground">
                              {login.device}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {login.location}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{login.date}</p>
                        <p>{login.time}</p>
                        <p className="text-xs">IP: {login.ip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
