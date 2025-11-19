import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdmin } from "@/lib/admin-context";
import { getAllUsers } from "@/lib/user-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Settings,
  LogOut,
  BarChart3,
  AlertCircle,
  Building2,
  ShoppingCart,
  FileText,
  Shield,
  Mail,
  DollarSign,
  Package,
  Share2,
  Wallet,
  MessageCircle,
  Search,
  X,
} from "lucide-react";

interface AdminCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  buttonText: string;
  buttonColor: string;
  variant?: "outline" | "default";
}

export default function AdminDashboard() {
  const { adminEmail, isAdmin, logout } = useAdmin();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
    }
  }, [isAdmin, navigate]);

  const allUsers = getAllUsers();
  const activeUsers = allUsers.filter(
    (u) => u.accountStatus === "active",
  ).length;
  const suspendedUsers = allUsers.filter(
    (u) => u.accountStatus === "suspended",
  ).length;
  const totalUsers = allUsers.length;

  const adminCards: AdminCard[] = useMemo(
    () => [
      {
        id: "companies",
        icon: <Building2 className="w-5 h-5" />,
        title: "Companies",
        description: "Manage registered companies, track renewals, and handle refunds",
        link: "/companies",
        buttonText: "Manage Companies",
        buttonColor: "bg-blue-600 hover:bg-blue-700 text-white",
      },
      {
        id: "orders",
        icon: <ShoppingCart className="w-5 h-5" />,
        title: "Orders",
        description: "Manage orders, handle refunds, and track transfer forms",
        link: "/admin/orders",
        buttonText: "Manage Orders",
        buttonColor: "bg-purple-600 hover:bg-purple-700 text-white",
      },
      {
        id: "services",
        icon: <Package className="w-5 h-5" />,
        title: "Services Marketplace",
        description: "Create and manage services with custom application forms",
        link: "/admin/services",
        buttonText: "Manage Services",
        buttonColor: "bg-amber-600 hover:bg-amber-700 text-white",
      },
      {
        id: "coupons",
        icon: <DollarSign className="w-5 h-5" />,
        title: "Discount Coupons",
        description: "Create and manage discount codes for promotions",
        link: "/admin/coupons",
        buttonText: "Manage Coupons",
        buttonColor: "bg-violet-600 hover:bg-violet-700 text-white",
      },
      {
        id: "invoices",
        icon: <FileText className="w-5 h-5" />,
        title: "Invoices",
        description: "Generate, manage, and send invoices to clients",
        link: "/admin/invoices",
        buttonText: "Manage Invoices",
        buttonColor: "bg-green-600 hover:bg-green-700 text-white",
      },
      {
        id: "users",
        icon: <Users className="w-5 h-5" />,
        title: "Users Management",
        description: "Manage user accounts, view login history, and handle suspensions",
        link: "/admin/users",
        buttonText: "Manage Users",
        buttonColor: "bg-primary hover:bg-primary-600 text-white",
      },
      {
        id: "roles",
        icon: <Shield className="w-5 h-5" />,
        title: "Roles Management",
        description: "Create custom roles and assign permissions to users",
        link: "/admin/roles",
        buttonText: "Manage Roles",
        buttonColor: "bg-indigo-600 hover:bg-indigo-700 text-white",
      },
      {
        id: "emails",
        icon: <Mail className="w-5 h-5" />,
        title: "Email Templates",
        description: "Manage and preview all system email templates",
        link: "/admin/email-templates",
        buttonText: "Manage Templates",
        buttonColor: "bg-cyan-600 hover:bg-cyan-700 text-white",
      },
      {
        id: "fees",
        icon: <DollarSign className="w-5 h-5" />,
        title: "Fees Management",
        description: "Create and manage checkout fees (taxes, service fees, etc.)",
        link: "/admin/fees",
        buttonText: "Manage Fees",
        buttonColor: "bg-amber-600 hover:bg-amber-700 text-white",
      },
      {
        id: "wallets",
        icon: <Wallet className="w-5 h-5" />,
        title: "Wallet Management",
        description: "Manage user wallet balances, view transactions, and generate reports",
        link: "/admin/wallets",
        buttonText: "Manage Wallets",
        buttonColor: "bg-purple-600 hover:bg-purple-700 text-white",
      },
      {
        id: "settings",
        icon: <Settings className="w-5 h-5" />,
        title: "Admin Settings",
        description: "Configure admin accounts and system preferences",
        link: "/admin/settings",
        buttonText: "Go to Settings",
        buttonColor: "",
        variant: "outline",
      },
      {
        id: "social",
        icon: <Share2 className="w-5 h-5" />,
        title: "Social Media Links",
        description: "Manage social media links displayed in the website footer",
        link: "/admin/social-media",
        buttonText: "Manage Social Links",
        buttonColor: "bg-pink-600 hover:bg-pink-700 text-white",
      },
      {
        id: "whatsapp",
        icon: <MessageCircle className="w-5 h-5" />,
        title: "WhatsApp Support",
        description: "Manage customer support WhatsApp numbers and initial messages",
        link: "/admin/whatsapp-support",
        buttonText: "Manage WhatsApp",
        buttonColor: "bg-green-600 hover:bg-green-700 text-white",
      },
    ],
    [],
  );

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return adminCards;

    const query = searchQuery.toLowerCase();
    return adminCards.filter(
      (card) =>
        card.title.toLowerCase().includes(query) ||
        card.description.toLowerCase().includes(query),
    );
  }, [searchQuery, adminCards]);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Sharekte Admin</h1>
            <p className="text-xs text-muted-foreground">
              {adminEmail || "Admin"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, Admin!
          </h2>
          <p className="text-muted-foreground mb-6">
            Manage users, monitor system health, and handle administrative tasks
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search options..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-2 h-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid - Hidden when searching */}
        {!searchQuery && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border/40 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {totalUsers}
                  </p>
                </div>
                <Users className="w-12 h-12 text-primary/20" />
              </div>
            </div>

            <div className="bg-card border border-border/40 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Active Users
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {activeUsers}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold">
                    {activeUsers > 0 ? "✓" : "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border/40 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Suspended</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {suspendedUsers}
                  </p>
                </div>
                <AlertCircle className="w-12 h-12 text-orange-100" />
              </div>
            </div>

            <div className="bg-card border border-border/40 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">System</p>
                  <p className="text-sm text-green-600 font-semibold">
                    Operational
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All systems running
                  </p>
                </div>
                <BarChart3 className="w-12 h-12 text-green-100" />
              </div>
            </div>
          </div>
        )}

        {/* Admin Options Grid */}
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className="bg-card border border-border/40 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  {card.icon}
                  {card.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {card.description}
                </p>
                <Button
                  variant={card.variant || "default"}
                  className={`w-full ${card.buttonColor}`}
                  asChild
                >
                  <Link to={card.link}>{card.buttonText}</Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border/40 rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-2">No options found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search query
            </p>
          </div>
        )}

        {/* Quick Stats - Hidden when searching */}
        {!searchQuery && (
          <div className="mt-8 bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Quick Stats
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border/20">
                <span className="text-muted-foreground">Total System Users</span>
                <span className="font-semibold text-foreground">
                  {totalUsers}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/20">
                <span className="text-muted-foreground">Active Accounts</span>
                <span className="font-semibold text-green-600">
                  {activeUsers}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/20">
                <span className="text-muted-foreground">Suspended Accounts</span>
                <span className="font-semibold text-orange-600">
                  {suspendedUsers}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Admin Role</span>
                <span className="font-semibold text-primary capitalize">
                  Super Admin
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
