import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/lib/admin-context";
import { fetchServices, type ServiceData } from "@/lib/services";
import { ServiceTable } from "@/components/ServiceTable";
import { Button } from "@/components/ui/button";
import {
  Search,
  ArrowLeft,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getAPIBaseURL } from "@/lib/transfer-form";

export default function AdminServices() {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
    } else {
      loadServices();
    }
  }, [isAdmin, navigate]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await fetchServices();
      setServices(data);
    } catch (error) {
      console.error("Failed to load services:", error);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const query = searchQuery.toLowerCase();
    return (
      service.name.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query) ||
      service.category.toLowerCase().includes(query)
    );
  });

  const serviceStats = {
    total: services.length,
    active: services.filter((s) => s.status === "active").length,
    inactive: services.filter((s) => s.status === "inactive").length,
  };

  if (!isAdmin) return null;

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
            <h1 className="text-2xl font-bold text-foreground">
              Services Management
            </h1>
          </div>
          <Button variant="outline" onClick={loadServices} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Services
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {serviceStats.total}
                </p>
              </div>
              <Package className="w-12 h-12 text-primary/20" />
            </div>
          </div>

          <div className="bg-card border border-border/40 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Active Services
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {serviceStats.active}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/40 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Inactive Services
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {serviceStats.inactive}
                </p>
              </div>
              <Package className="w-12 h-12 text-orange-100" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-card border border-border/40 rounded-lg p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search services by name, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-3">
              Found {filteredServices.length} service
              {filteredServices.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Services Table */}
        <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
          <ServiceTable />
        </div>
      </main>
    </div>
  );
}
