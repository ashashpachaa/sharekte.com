import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdmin } from "@/lib/admin-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Bell } from "lucide-react";

export default function AdminSettings() {
  const { isAdmin, adminEmail } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/dashboard")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Account Settings */}
        <div className="bg-card border border-border/40 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Your Account
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-foreground mt-1">{adminEmail || "Admin"}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <p className="text-foreground mt-1 capitalize">
                Super Admin
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <p className="text-foreground mt-1 capitalize">
                Active
              </p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-card border border-border/40 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your admin password</p>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Login History</p>
                <p className="text-sm text-muted-foreground">View your recent login activity</p>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-card border border-border/40 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive email alerts for important events</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium text-foreground">User Management Alerts</p>
                <p className="text-sm text-muted-foreground">Alerts for new users and suspicious activity</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium text-foreground">System Alerts</p>
                <p className="text-sm text-muted-foreground">Alerts for system errors and maintenance</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-card border border-border/40 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">System Information</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border/20">
              <span className="text-muted-foreground">System Version</span>
              <span className="font-semibold text-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/20">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-semibold text-foreground">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Environment</span>
              <span className="font-semibold text-foreground">Production</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
