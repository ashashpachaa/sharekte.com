import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdmin } from "@/lib/admin-context";
import { getAllUsers, searchUsers } from "@/lib/user-management";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

export default function AdminDashboard() {
  const { adminEmail, isAdmin, logout } = useAdmin();
  const navigate = useNavigate();

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Companies Management */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Companies
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Manage registered companies and track renewals
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
              Manage orders and transfer forms
            </p>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              asChild
            >
              <Link to="/admin/orders">Manage Orders</Link>
            </Button>
          </div>

          {/* Users Management */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users Management
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Manage user accounts and account status
            </p>
            <Button
              className="w-full bg-primary hover:bg-primary/80 text-white"
              asChild
            >
              <Link to="/admin/users">Manage Users</Link>
            </Button>
          </div>

          {/* Settings */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Configure admin accounts and system preferences
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/admin/settings">Go to Settings</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
