import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
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
  X,
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
} from "lucide-react";
import { toast } from "sonner";

type DashboardTab = "portfolio" | "companies" | "account" | "payments" | "security";

interface PurchasedCompany {
  id: string;
  name: string;
  number: string;
  incorporationDate: string;
  incorporationYear: string;
  renewalDate: string;
  renewalFees: number;
  status: "pending-form" | "under-review" | "amend-required" | "pending-transfer" | "completed";
  statusLabel: string;
  documents: Document[];
  transferFormFilled: boolean;
  adminComments?: string;
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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("portfolio");
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // User data state
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
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
    }
    return {
      fullName: "John Doe",
      email: "john@example.com",
      phone: "+1 (555) 123-4567",
      address: "123 Business Street",
      city: "New York",
      country: "United States",
      company: "My Business Corp",
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

  // Purchased companies state
  const [purchasedCompanies, setPurchasedCompanies] = useState<PurchasedCompany[]>(() => {
    const saved = localStorage.getItem("purchasedCompanies");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            name: "TechFlow Solutions",
            number: "16662272",
            incorporationDate: "2025-10-22",
            incorporationYear: "2025",
            renewalDate: "2026-10-22",
            renewalFees: 299,
            status: "pending-form",
            statusLabel: "Pending Transfer Form",
            documents: [
              {
                id: "d1",
                name: "Articles of Association",
                type: "pdf",
                uploadedDate: "2024-12-10",
              },
            ],
            transferFormFilled: false,
          },
          {
            id: "2",
            name: "GreenLeaf Organic",
            number: "16656680",
            incorporationDate: "2025-10-22",
            incorporationYear: "2025",
            renewalDate: "2026-10-22",
            renewalFees: 299,
            status: "under-review",
            statusLabel: "Under Review Transfer Form",
            documents: [
              {
                id: "d2",
                name: "Transfer Form",
                type: "pdf",
                uploadedDate: "2024-12-12",
              },
              {
                id: "d3",
                name: "Shareholder Information",
                type: "pdf",
                uploadedDate: "2024-12-12",
              },
            ],
            transferFormFilled: true,
          },
        ];
  });

  const [showTransferForm, setShowTransferForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    directorName: "",
    directorEmail: "",
    shareholderName: "",
    shareholderEmail: "",
    companyAddress: "",
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

    const updated = purchasedCompanies.map((c) =>
      c.id === companyId
        ? {
            ...c,
            status: "under-review" as const,
            statusLabel: "Under Review Transfer Form",
            transferFormFilled: true,
          }
        : c
    );

    setPurchasedCompanies(updated);
    localStorage.setItem("purchasedCompanies", JSON.stringify(updated));
    setShowTransferForm(null);
    setFormData({
      directorName: "",
      directorEmail: "",
      shareholderName: "",
      shareholderEmail: "",
      companyAddress: "",
    });

    toast.success("Transfer form submitted for review!");
  };

  // Get status color and icon
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending-form":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: Clock,
          bgLight: "bg-yellow-50",
        };
      case "under-review":
        return {
          color: "bg-blue-100 text-blue-800",
          icon: FileText,
          bgLight: "bg-blue-50",
        };
      case "amend-required":
        return {
          color: "bg-orange-100 text-orange-800",
          icon: AlertCircle,
          bgLight: "bg-orange-50",
        };
      case "pending-transfer":
        return {
          color: "bg-purple-100 text-purple-800",
          icon: FileUp,
          bgLight: "bg-purple-50",
        };
      case "completed":
        return {
          color: "bg-green-100 text-green-800",
          icon: CheckCircle,
          bgLight: "bg-green-50",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: Clock,
          bgLight: "bg-gray-50",
        };
    }
  };

  const ownedCompanies = [
    {
      id: 1,
      name: "TechFlow Solutions",
      revenue: "$2.5M",
      monthlyRevenue: "$210K",
      growth: "+12%",
      employees: 12,
      status: "Active",
    },
    {
      id: 2,
      name: "GreenLeaf Organic",
      revenue: "$1.8M",
      monthlyRevenue: "$150K",
      growth: "+8%",
      employees: 18,
      status: "Active",
    },
  ];

  const stats = [
    {
      label: "Total Portfolio Value",
      value: "$4.3M",
      icon: DollarSign,
      change: "+18%",
    },
    {
      label: "Monthly Revenue",
      value: "$360K",
      icon: TrendingUp,
      change: "+12%",
    },
    {
      label: "Total Employees",
      value: "30",
      icon: Users,
      change: "+5",
    },
    {
      label: "Companies Owned",
      value: "2",
      icon: BarChart3,
      change: "In Portfolio",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Dashboard Header */}
      <section className="border-b border-border/40 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and portfolio
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-b border-border/40 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`py-4 px-1 font-semibold transition-colors ${
                activeTab === "portfolio"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`py-4 px-1 font-semibold transition-colors ${
                activeTab === "account"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              My Account
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`py-4 px-1 font-semibold transition-colors ${
                activeTab === "payments"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Payment Methods
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`py-4 px-1 font-semibold transition-colors ${
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
                      className="bg-primary hover:bg-primary-600 text-white"
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
                  Payment Methods
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
