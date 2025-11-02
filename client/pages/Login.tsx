import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!email || !password) {
      toast.error("Please fill in all fields");
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

    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Store user data in localStorage (simple auth)
      const userData = {
        fullName: email.split("@")[0],
        email: email,
        accountCreated: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        authenticated: true,
      };

      localStorage.setItem("user", JSON.stringify(userData));

      // Show success message
      toast.success(`Welcome back, ${userData.fullName}!`);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      toast.error("Login failed. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo/Title */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Sign In
            </h1>
            <p className="text-muted-foreground">
              Access your account to manage orders and companies
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                {t("auth.email") || "Email Address"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder") || "you@example.com"}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                {t("auth.password") || "Password"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    t("auth.passwordPlaceholder") || "Enter your password"
                  }
                  className="w-full pl-10 pr-10 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("auth.passwordHint") || "Minimum 6 characters"}
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("auth.signingIn") || "Signing in..."}
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {t("auth.login.button") || "Sign In"}
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                {t("auth.noAccount") || "Don't have an account?"}
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-input"
            onClick={() => navigate("/signup")}
            disabled={loading}
          >
            {t("auth.createAccount") || "Create an Account"}
          </Button>

          {/* Demo Credentials */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-xs font-medium text-foreground">
              {t("auth.demoTitle") || "Demo Credentials"}
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>{t("auth.demoEmail") || "Email"}: demo@example.com</p>
              <p>{t("auth.demoPassword") || "Password"}: password123</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
