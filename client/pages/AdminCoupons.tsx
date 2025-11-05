import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CouponManagement } from "@/components/CouponManagement";
import { ArrowLeft } from "lucide-react";

export default function AdminCoupons() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Content */}
      <div className="flex-1 py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Coupon Management
            </h1>
          </div>

          <CouponManagement />
        </div>
      </div>

      <Footer />
    </div>
  );
}
