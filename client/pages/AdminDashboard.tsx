import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdmin } from "@/lib/admin-context";
import { getAllUsers, searchUsers } from "@/lib/user-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
} from "lucide-react";

interface AdminCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  buttonText: string;
  buttonColor: string;
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
        buttonColor: "bg-blue-600 hover:bg-blue-700",
      },
      {
        id: "orders",
        icon: <ShoppingCart className="w-5 h-5" />,
        title: "Orders",
        description: "Manage orders, handle refunds, and track transfer forms",
        link: "/admin/orders",
        buttonText: "Manage Orders",
        buttonColor: "bg-purple-600 hover:bg-purple-700",
      },
      {
        id: "services",
        icon: <Package className="w-5 h-5" />,
        title: "Services Marketplace",
        description: "Create and manage services with custom application forms",
        link: "/admin/services",
        buttonText: "Manage Services",
        buttonColor: "bg-amber-600 hover:bg-amber-700",
      },
      {
        id: "coupons",
        icon: <DollarSign className="w-5 h-5" />,
        title: "Discount Coupons",
        description: "Create and manage discount codes for promotions",
        link: "/admin/coupons",
        buttonText: "Manage Coupons",
        buttonColor: "bg-violet-600 hover:bg-violet-700",
      },
      {
        id: "invoices",
        icon: <FileText className="w-5 h-5" />,
        title: "Invoices",
        description: "Generate, manage, and send invoices to clients",
        link: "/admin/invoices",
        buttonText: "Manage Invoices",
        buttonColor: "bg-green-600 hover:bg-green-700",
      },
      {
        id: "users",
        icon: <Users className="w-5 h-5" />,
        title: "Users Management",
        description: "Manage user accounts, view login history, and handle suspensions",
        link: "/admin/users",
        buttonText: "Manage Users",
        buttonColor: "bg-primary hover:bg-primary-600",
      },
      {
        id: "roles",
        icon: <Shield className="w-5 h-5" />,
        title: "Roles Management",
        description: "Create custom roles and assign permissions to users",
        link: "/admin/roles",
        buttonText: "Manage Roles",
        buttonColor: "bg-indigo-600 hover:bg-indigo-700",
      },
      {
        id: "emails",
        icon: <Mail className="w-5 h-5" />,
        title: "Email Templates",
        description: "Manage and preview all system email templates",
        link: "/admin/email-templates",
        buttonText: "Manage Templates",
        buttonColor: "bg-cyan-600 hover:bg-cyan-700",
      },
      {
        id: "fees",
        icon: <DollarSign className="w-5 h-5" />,
        title: "Fees Management",
        description: "Create and manage checkout fees (taxes, service fees, etc.)",
        link: "/admin/fees",
        buttonText: "Manage Fees",
        buttonColor: "bg-amber-600 hover:bg-amber-700",
      },
      {
        id: "wallets",
        icon: <Wallet className="w-5 h-5" />,
        title: "Wallet Management",
        description: "Manage user wallet balances, view transactions, and generate reports",
        link: "/admin/wallets",
        buttonText: "Manage Wallets",
        buttonColor: "bg-purple-600 hover:bg-purple-700",
      },
      {
        id: "settings",
        icon: <Settings className="w-5 h-5" />,
        title: "Admin Settings",
        description: "Configure admin accounts and system preferences",
        link: "/admin/settings",
        buttonText: "Go to Settings",
        buttonColor: "border-2 border-border",
      },
      {
        id: "social",
        icon: <Share2 className="w-5 h-5" />,
        title: "Social Media Links",
        description: "Manage social media links displayed in the website footer",
        link: "/admin/social-media",
        buttonText: "Manage Social Links",
        buttonColor: "bg-pink-600 hover:bg-pink-700",
      },
      {
        id: "whatsapp",
        icon: <MessageCircle className="w-5 h-5" />,
        title: "WhatsApp Support",
        description: "Manage customer support WhatsApp numbers and initial messages",
        link: "/admin/whatsapp-support",
        buttonText: "Manage WhatsApp",
        buttonColor: "bg-green-600 hover:bg-green-700",
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
          <p className="text-muted-foreground">
            Manage users, monitor system health, and handle administrative tasks
          </p>
        </div>

        {/* Stats Grid */}
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Companies Management */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Companies
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Manage registered companies, track renewals, and handle refunds
            </p>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              asChild
            >
              <Link to="/companies">Manage Companies</Link>
            </Button>
          </div>

          {/* Orders Management */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Orders
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Manage orders, handle refunds, and track transfer forms
            </p>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              asChild
            >
              <Link to="/admin/orders">Manage Orders</Link>
            </Button>
          </div>

          {/* Services Management */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Services Marketplace
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create and manage services with custom application forms
            </p>
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              asChild
            >
              <Link to="/admin/services">Manage Services</Link>
            </Button>
          </div>

          {/* Coupons Management */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Discount Coupons
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create and manage discount codes for promotions
            </p>
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              asChild
            >
              <Link to="/admin/coupons">Manage Coupons</Link>
            </Button>
          </div>

          {/* Invoices Management */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoices
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Generate, manage, and send invoices to clients
            </p>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              asChild
            >
              <Link to="/admin/invoices">Manage Invoices</Link>
            </Button>
          </div>

          {/* Users Management */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users Management
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Manage user accounts, view login history, and handle suspensions
            </p>
            <Button
              className="w-full bg-primary hover:bg-primary-600 text-white"
              asChild
            >
              <Link to="/admin/users">Manage Users</Link>
            </Button>
          </div>

          {/* Roles Management */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Roles Management
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create custom roles and assign permissions to users
            </p>
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              asChild
            >
              <Link to="/admin/roles">Manage Roles</Link>
            </Button>
          </div>

          {/* Email Templates */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Templates
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Manage and preview all system email templates
            </p>
            <Button
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              asChild
            >
              <Link to="/admin/email-templates">Manage Templates</Link>
            </Button>
          </div>

          {/* Fees Management */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Fees Management
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create and manage checkout fees (taxes, service fees, etc.)
            </p>
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              asChild
            >
              <Link to="/admin/fees">Manage Fees</Link>
            </Button>
          </div>

          {/* Wallet Management */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Management
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Manage user wallet balances, view transactions, and generate
              reports
            </p>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              asChild
            >
              <Link to="/admin/wallets">Manage Wallets</Link>
            </Button>
          </div>

          {/* System Settings */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Admin Settings
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Configure admin accounts and system preferences
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/admin/settings">Go to Settings</Link>
            </Button>
          </div>

          {/* Social Media Links */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Social Media Links
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Manage social media links displayed in the website footer
            </p>
            <Button
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              asChild
            >
              <Link to="/admin/social-media">Manage Social Links</Link>
            </Button>
          </div>

          {/* WhatsApp Support */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              WhatsApp Support
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Manage customer support WhatsApp numbers and initial messages
            </p>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              asChild
            >
              <Link to="/admin/whatsapp-support">Manage WhatsApp</Link>
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
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
      </main>
    </div>
  );
}
