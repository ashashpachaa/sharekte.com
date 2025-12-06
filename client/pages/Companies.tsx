import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSEO, getPageSEOMetadata } from "@/lib/seo";
import {
  Plus,
  Grid3x3,
  List,
  Download,
  Upload,
  Settings,
  Activity,
} from "lucide-react";
import {
  CompanyData,
  CompanyFilters,
  SortField,
  SortOrder,
  filterCompanies,
  sortCompanies,
  getCompanyStatistics,
} from "@/lib/company-management";
import { useCompanies } from "@/hooks/use-companies-query";
import { CompanyCard } from "@/components/CompanyCard";
import { CompanyFiltersComponent } from "@/components/CompanyFilters";
import { CompanyDetailsModal } from "@/components/CompanyDetailsModal";
import { CompanyTable } from "@/components/CompanyTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type ViewMode = "grid" | "table";

export default function Companies() {
  const { i18n } = useTranslation();
  const seoMetadata = getPageSEOMetadata("companies", i18n.language);
  useSEO(seoMetadata, i18n.language);

  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 10 companies per page
  const [filters, setFilters] = useState<CompanyFilters>({});
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newCompany, setNewCompany] = useState({
    companyName: "",
    companyNumber: "",
    country: "",
    type: "LTD" as const,
    incorporationDate: new Date().toISOString().split("T")[0],
    purchasePrice: 0,
    renewalFee: 0,
    currency: "USD",
    clientName: "",
    clientEmail: "",
  });

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
    checkAdminStatus();
  }, []);

  // Apply filters and sorting whenever they change
  useEffect(() => {
    let result = [...companies];

    // Apply filters
    result = filterCompanies(result, filters);

    // Apply sorting
    result = sortCompanies(result, { field: sortField, order: sortOrder });

    setFilteredCompanies(result);
  }, [companies, filters, sortField, sortOrder]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await fetchAllCompanies();
      setCompanies(data);

      // Extract unique countries for filter
      const uniqueCountries = Array.from(
        new Set(data.map((c) => c.country)),
      ).sort();
      setCountries(uniqueCountries);
    } catch (error) {
      console.error("Failed to load companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = () => {
    const adminData = localStorage.getItem("admin");
    setIsAdmin(!!adminData);
  };

  // Pagination: calculate total pages and get companies for current page
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  // Statistics
  const stats = getCompanyStatistics(companies);

  const handleFilterChange = (newFilters: CompanyFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  const handleSortChange = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1); // Reset to page 1 when sort changes
  };

  const handleViewDetails = (company: CompanyData) => {
    setSelectedCompany(company);
    setShowDetailsModal(true);
  };

  const handleEdit = (company: CompanyData) => {
    setSelectedCompany(company);
    setShowDetailsModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/companies/${id}`, { method: "DELETE" });
      setCompanies(companies.filter((c) => c.id !== id));
      toast.success("Company deleted");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete company");
    }
  };

  const handleRenew = async (id: string) => {
    try {
      const response = await fetch(`/api/companies/${id}/renew`, {
        method: "POST",
      });
      if (response.ok) {
        const updated = await response.json();
        setCompanies(companies.map((c) => (c.id === id ? updated : c)));
        toast.success("Company renewed successfully");
      }
    } catch (error) {
      console.error("Renewal failed:", error);
      toast.error("Failed to renew company");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/companies/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        const updated = await response.json();
        setCompanies(companies.map((c) => (c.id === id ? updated : c)));
        toast.success("Status updated");
      }
    } catch (error) {
      console.error("Status update failed:", error);
      toast.error("Failed to update status");
    }
  };

  const handleAddCompany = async () => {
    if (
      !newCompany.companyName ||
      !newCompany.companyNumber ||
      !newCompany.clientName ||
      !newCompany.clientEmail
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCompany,
          incorporationYear: new Date(
            newCompany.incorporationDate,
          ).getFullYear(),
        }),
      });

      if (response.ok) {
        const created = await response.json();
        setCompanies([...companies, created]);
        setShowAddModal(false);
        setNewCompany({
          companyName: "",
          companyNumber: "",
          country: "",
          type: "LTD",
          incorporationDate: new Date().toISOString().split("T")[0],
          purchasePrice: 0,
          renewalFee: 0,
          currency: "USD",
          clientName: "",
          clientEmail: "",
        });
        toast.success("Company added successfully");
      }
    } catch (error) {
      console.error("Add company failed:", error);
      toast.error("Failed to add company");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
              <p className="text-gray-600 mt-1">
                Manage and track all registered companies
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Company
            </Button>
          </div>
        </div>

        {/* Statistics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-600 font-medium">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-600 font-medium">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-600 font-medium">Expired</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.expired}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-600 font-medium">Available</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.available}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-600 font-medium">
              Renewing Soon
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.renewingSoon}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-600 font-medium">Revenue</div>
            <div className="text-lg font-bold">
              ${(stats.totalRevenue / 1000).toFixed(0)}k
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <CompanyFiltersComponent
          onFiltersChange={handleFilterChange}
          onSortChange={handleSortChange}
          countries={countries}
        />

        {/* View Controls */}
        <div className="flex justify-between items-center mt-6 mb-4">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {Math.max(1, totalPages)} (
            {filteredCompanies.length} total companies)
          </p>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Companies Display */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading companies...</p>
          </div>
        ) : paginatedCompanies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500 text-lg mb-2">No companies found</p>
            <p className="text-gray-400 text-sm">
              {filteredCompanies.length === 0
                ? "No companies match your filters. Try adjusting them."
                : "Loading companies..."}
            </p>
            {isAdmin && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="mt-4 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add First Company
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onViewDetails={handleViewDetails}
                onEdit={isAdmin ? handleEdit : undefined}
                onDelete={isAdmin ? handleDelete : undefined}
                onRenew={isAdmin ? handleRenew : undefined}
                onStatusChange={isAdmin ? handleStatusChange : undefined}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          <CompanyTable
            companies={paginatedCompanies}
            onViewDetails={handleViewDetails}
            onEdit={isAdmin ? handleEdit : undefined}
            onDelete={isAdmin ? handleDelete : undefined}
            onRenew={isAdmin ? handleRenew : undefined}
            isAdmin={isAdmin}
            disableInternalPaging={true}
          />
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
              }
              return pageNum <= totalPages ? pageNum : null;
            })
              .filter((pageNum) => pageNum !== null)
              .map((pageNum) => (
                <Button
                  key={`page-${pageNum}`}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  onClick={() => setCurrentPage(pageNum as number)}
                >
                  {pageNum}
                </Button>
              ))}

            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </main>

      {/* Add Company Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>
              Register a new company in the system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={newCompany.companyName}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      companyName: e.target.value,
                    })
                  }
                  placeholder="e.g., ABC Limited"
                />
              </div>
              <div>
                <Label htmlFor="companyNumber">Company Number *</Label>
                <Input
                  id="companyNumber"
                  value={newCompany.companyNumber}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      companyNumber: e.target.value,
                    })
                  }
                  placeholder="e.g., 12345678"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={newCompany.country}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, country: e.target.value })
                  }
                  placeholder="e.g., UK"
                />
              </div>
              <div>
                <Label htmlFor="type">Company Type</Label>
                <Select
                  value={newCompany.type}
                  onValueChange={(value: any) =>
                    setNewCompany({ ...newCompany, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LTD">Limited Company (LTD)</SelectItem>
                    <SelectItem value="LLC">
                      Limited Liability Company (LLC)
                    </SelectItem>
                    <SelectItem value="INC">Incorporated (INC)</SelectItem>
                    <SelectItem value="AB">Swedish Company (AB)</SelectItem>
                    <SelectItem value="FZCO">Free Zone (FZCO)</SelectItem>
                    <SelectItem value="GmbH">German Limited (GmbH)</SelectItem>
                    <SelectItem value="SARL">French Limited (SARL)</SelectItem>
                    <SelectItem value="BV">Dutch Limited (BV)</SelectItem>
                    <SelectItem value="OOO">Russian Limited (OOO)</SelectItem>
                    <SelectItem value="Ltd Liability Partnership">
                      Ltd Liability Partnership
                    </SelectItem>
                    <SelectItem value="Sole Proprietor">
                      Sole Proprietor
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="incorporationDate">Incorporation Date</Label>
                <Input
                  id="incorporationDate"
                  type="date"
                  value={newCompany.incorporationDate}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      incorporationDate: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  value={newCompany.purchasePrice}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      purchasePrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="renewalFee">Renewal Fee</Label>
                <Input
                  id="renewalFee"
                  type="number"
                  value={newCompany.renewalFee}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      renewalFee: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={newCompany.currency}
                  onValueChange={(value) =>
                    setNewCompany({ ...newCompany, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={newCompany.clientName}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      clientName: e.target.value,
                    })
                  }
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Client Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={newCompany.clientEmail}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      clientEmail: e.target.value,
                    })
                  }
                  placeholder="john@example.com"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCompany}>Add Company</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Company Details Modal */}
      {selectedCompany && (
        <CompanyDetailsModal
          company={selectedCompany}
          isAdmin={isAdmin}
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          onSave={(updated) => {
            setCompanies(
              companies.map((c) => (c.id === updated.id ? updated : c)),
            );
            setShowDetailsModal(false);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
