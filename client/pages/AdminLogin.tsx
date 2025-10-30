import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdmin, type AdminRole } from "@/lib/admin-context";
import { trackLogin } from "@/lib/login-history";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setCurrentAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Demo admin accounts
  const DEMO_ADMINS: Record<string, { password: string; role: AdminRole; name: string }> = {
    "admin@example.com": { password: "admin123", role: "super-admin", name: "Super Admin" },
    "moderator@example.com": { password: "mod123", role: "moderator", name: "Moderator" },
    "support@example.com": { password: "support123", role: "support", name: "Support Team" },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const admin = DEMO_ADMINS[email];

      if (!admin) {
        toast.error("Admin account not found");
        setLoading(false);
        return;
      }

      if (admin.password !== password) {
        toast.error("Invalid password");
        setLoading(false);
        return;
      }

      const adminId = `admin-${Date.now()}`;
      const adminUser = {
        id: adminId,
        email,
        name: admin.name,
        role: admin.role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      // Track login
      await trackLogin(adminId);

      setCurrentAdmin(adminUser);
      toast.success(`Welcome ${admin.name}!`);
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-foreground mb-2">
            Admin Login
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Access the admin dashboard
          </p>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-600 text-white"
              disabled={loading || !email || !password}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-900 mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-xs text-blue-800">
              <p><span className="font-mono">admin@example.com</span> / admin123</p>
              <p><span className="font-mono">moderator@example.com</span> / mod123</p>
              <p><span className="font-mono">support@example.com</span> / support123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
