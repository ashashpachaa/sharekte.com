import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/lib/admin-context";
import { AdminSocialLinks } from "@/components/AdminSocialLinks";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminSocialMedia() {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
    }
  }, [isAdmin, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2"
            >
              <Link to="/admin/dashboard">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-primary">Social Media Links</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <AdminSocialLinks />
      </main>
    </div>
  );
}
