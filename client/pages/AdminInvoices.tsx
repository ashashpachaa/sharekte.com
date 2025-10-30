import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/lib/admin-context";
import {
  getAllInvoices,
  updateInvoiceStatus,
  deleteInvoice,
  sendInvoiceEmail,
  downloadInvoicePDF,
  getInvoiceStatistics,
  exportInvoicesToCSV,
  bulkSendEmails,
  bulkUpdateInvoiceStatus,
  type Invoice,
  type InvoiceStatus,
  type InvoiceFilter,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  formatInvoiceDate,
  formatInvoiceAmount,
  isInvoiceOverdue,
  getInvoiceDisplayStatus,
} from "@/lib/invoices";
import { InvoiceForm } from "@/components/InvoiceForm";
import { InvoiceDetailsModal } from "@/components/InvoiceDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Plus,
  Download,
  Mail,
  Filter,
  Eye,
  Trash2,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FilterStatus = InvoiceStatus | "all";

interface Statistics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  byStatus: Record<InvoiceStatus, number>;
  byPaymentMethod: Record<string, number>;
}

export default function AdminInvoices() {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Statistics>({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    byStatus: { pending: 0, paid: 0, overdue: 0, refunded: 0, partial: 0 },
    byPaymentMethod: { stripe: 0, wise: 0, manual: 0, bank_transfer: 0, paypal: 0 },
  });

  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkStatusAction, setBulkStatusAction] = useState<InvoiceStatus | "none">(
    "none"
  );

  // Sorting
  const [sortField, setSortField] = useState<"invoiceNumber" | "invoiceDate" | "dueDate" | "amount" | "status">(
    "invoiceDate"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
    } else {
      loadData();
    }
  }, [isAdmin, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoiceData, statsData] = await Promise.all([
        getAllInvoices(),
        getInvoiceStatistics(),
      ]);
      setInvoices(invoiceData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const filters: InvoiceFilter = {
    status: filterStatus === "all" ? undefined : filterStatus,
    paymentMethod: filterPaymentMethod || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    clientName: clientSearch || undefined,
    companyName: companySearch || undefined,
    invoiceNumber: searchQuery || undefined,
  };

  const filteredInvoices = useMemo(() => {
    let result = invoices;

    // Search filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((inv) =>
        inv.invoiceNumber.toLowerCase().includes(query)
      );
    }

    if (clientSearch) {
      const query = clientSearch.toLowerCase();
      result = result.filter((inv) =>
        inv.clientName.toLowerCase().includes(query) ||
        inv.clientEmail.toLowerCase().includes(query)
      );
    }

    if (companySearch) {
      const query = companySearch.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.companyName.toLowerCase().includes(query) ||
          inv.companyNumber.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((inv) => {
        const displayStatus = getInvoiceDisplayStatus(inv);
        return displayStatus === filterStatus;
      });
    }

    // Payment method filter
    if (filterPaymentMethod && filterPaymentMethod !== "all") {
      result = result.filter((inv) => inv.paymentMethod === filterPaymentMethod);
    }

    // Date range filter
    if (dateFrom) {
      result = result.filter(
        (inv) => new Date(inv.invoiceDate) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      result = result.filter(
        (inv) => new Date(inv.invoiceDate) <= new Date(dateTo)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "invoiceNumber":
          aValue = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case "invoiceDate":
          aValue = new Date(a.invoiceDate).getTime();
          bValue = new Date(b.invoiceDate).getTime();
          break;
        case "dueDate":
          aValue = new Date(a.dueDate).getTime();
          bValue = new Date(b.dueDate).getTime();
          break;
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "status":
          aValue = a.status.localeCompare(b.status);
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });

    return result;
  }, [
    invoices,
    searchQuery,
    clientSearch,
    companySearch,
    filterStatus,
    filterPaymentMethod,
    dateFrom,
    dateTo,
    sortField,
    sortDirection,
  ]);

  const handleSelectInvoice = (invoiceId: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(filteredInvoices.map((inv) => inv.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleStatusChange = async (
    invoiceId: string,
    status: InvoiceStatus,
    reason?: string
  ) => {
    try {
      const updated = await updateInvoiceStatus(invoiceId, status, reason);
      if (updated) {
        setInvoices(
          invoices.map((inv) => (inv.id === invoiceId ? updated : inv))
        );
        setSelectedInvoice(updated);
        toast.success("Invoice status updated");
        await loadData();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update invoice status");
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    try {
      const success = await deleteInvoice(invoiceId);
      if (success) {
        setInvoices(invoices.filter((inv) => inv.id !== invoiceId));
        setDetailsOpen(false);
        toast.success("Invoice deleted");
        await loadData();
      }
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      toast.error("Failed to delete invoice");
    }
  };

  const handleSendEmail = async (invoiceId: string) => {
    try {
      const success = await sendInvoiceEmail(invoiceId);
      if (success) {
        toast.success("Invoice sent via email");
        await loadData();
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email");
    }
  };

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const blob = await downloadInvoicePDF(invoiceId);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await exportInvoicesToCSV(filters);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoices-export-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Invoices exported");
      }
    } catch (error) {
      console.error("Failed to export:", error);
      toast.error("Failed to export invoices");
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatusAction || bulkStatusAction === "none" || selectedIds.size === 0) return;

    try {
      const success = await bulkUpdateInvoiceStatus(
        Array.from(selectedIds),
        bulkStatusAction
      );
      if (success) {
        setSelectedIds(new Set());
        setBulkStatusAction("");
        toast.success("Invoices updated");
        await loadData();
      }
    } catch (error) {
      console.error("Failed to bulk update:", error);
      toast.error("Failed to update invoices");
    }
  };

  const handleBulkSendEmails = async () => {
    if (selectedIds.size === 0) return;

    try {
      const success = await bulkSendEmails(Array.from(selectedIds));
      if (success) {
        toast.success("Emails sent to selected invoices");
        await loadData();
      }
    } catch (error) {
      console.error("Failed to send emails:", error);
      toast.error("Failed to send emails");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/40 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
            </div>
            <Button onClick={() => setFormOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Invoice
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-card p-4 rounded-lg border border-border/40">
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalInvoices}
              </p>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border/40">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-foreground">
                {formatInvoiceAmount(stats.totalAmount)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-900">Paid</p>
              <p className="text-2xl font-bold text-green-700">
                {formatInvoiceAmount(stats.paidAmount)}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-900">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">
                {formatInvoiceAmount(stats.pendingAmount)}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-900">Overdue</p>
              <p className="text-2xl font-bold text-red-700">
                {formatInvoiceAmount(stats.overdueAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>

          {/* Filter Rows */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filterStatus}
                onValueChange={(value) =>
                  setFilterStatus(value as FilterStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Payment Method
              </label>
              <Select
                value={filterPaymentMethod}
                onValueChange={setFilterPaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="wise">Wise</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                From Date
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Client Name / Email
              </label>
              <Input
                placeholder="Search by client..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Company Name / Number
              </label>
              <Input
                placeholder="Search by company..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-blue-900">
                  {selectedIds.size} invoice{selectedIds.size !== 1 ? "s" : ""} selected
                </p>
              </div>
              <div className="flex gap-2">
                <Select
                  value={bulkStatusAction}
                  onValueChange={(value) =>
                    setBulkStatusAction(value as InvoiceStatus)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Change status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select status...</SelectItem>
                    <SelectItem value="pending">Mark Pending</SelectItem>
                    <SelectItem value="paid">Mark Paid</SelectItem>
                    <SelectItem value="partial">Mark Partial</SelectItem>
                    <SelectItem value="refunded">Mark Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleBulkStatusUpdate}
                  disabled={bulkStatusAction === "none" || !bulkStatusAction}
                >
                  Update
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkSendEmails}
                  className="gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Emails
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border border-border/40">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-40" />
            <p className="text-lg font-semibold text-foreground mb-2">
              No invoices found
            </p>
            <p className="text-muted-foreground">
              {invoices.length === 0
                ? "Create your first invoice to get started"
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border/40">
                  <tr>
                    <th className="p-4 text-left">
                      <Checkbox
                        checked={
                          selectedIds.size > 0 &&
                          selectedIds.size === filteredInvoices.length
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="p-4 text-left font-semibold">
                      <button
                        onClick={() => {
                          setSortField("invoiceNumber");
                          setSortDirection(
                            sortDirection === "asc" ? "desc" : "asc"
                          );
                        }}
                        className="flex items-center gap-2 hover:text-foreground"
                      >
                        Invoice Number
                        {sortField === "invoiceNumber" && (
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              sortDirection === "asc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </button>
                    </th>
                    <th className="p-4 text-left font-semibold">Client</th>
                    <th className="p-4 text-left font-semibold">Company</th>
                    <th className="p-4 text-left font-semibold">
                      <button
                        onClick={() => {
                          setSortField("invoiceDate");
                          setSortDirection(
                            sortDirection === "asc" ? "desc" : "asc"
                          );
                        }}
                        className="flex items-center gap-2 hover:text-foreground"
                      >
                        Invoice Date
                        {sortField === "invoiceDate" && (
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              sortDirection === "asc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </button>
                    </th>
                    <th className="p-4 text-left font-semibold">
                      <button
                        onClick={() => {
                          setSortField("dueDate");
                          setSortDirection(
                            sortDirection === "asc" ? "desc" : "asc"
                          );
                        }}
                        className="flex items-center gap-2 hover:text-foreground"
                      >
                        Due Date
                        {sortField === "dueDate" && (
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              sortDirection === "asc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </button>
                    </th>
                    <th className="p-4 text-right font-semibold">
                      <button
                        onClick={() => {
                          setSortField("amount");
                          setSortDirection(
                            sortDirection === "asc" ? "desc" : "asc"
                          );
                        }}
                        className="flex items-center justify-end gap-2 hover:text-foreground ml-auto"
                      >
                        Amount
                        {sortField === "amount" && (
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              sortDirection === "asc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </button>
                    </th>
                    <th className="p-4 text-left font-semibold">Status</th>
                    <th className="p-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => {
                    const displayStatus = getInvoiceDisplayStatus(invoice);
                    return (
                      <tr
                        key={invoice.id}
                        className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-4">
                          <Checkbox
                            checked={selectedIds.has(invoice.id)}
                            onChange={(e) =>
                              handleSelectInvoice(invoice.id, e.target.checked)
                            }
                          />
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-sm font-medium">
                            {invoice.invoiceNumber}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <p className="font-medium">{invoice.clientName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {invoice.clientEmail}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <p className="font-medium">{invoice.companyName}</p>
                            <p className="text-xs text-muted-foreground">
                              {invoice.companyNumber}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          {formatInvoiceDate(invoice.invoiceDate)}
                        </td>
                        <td className="p-4 text-sm">
                          {formatInvoiceDate(invoice.dueDate)}
                        </td>
                        <td className="p-4 text-right text-sm font-semibold">
                          {formatInvoiceAmount(invoice.amount, invoice.currency)}
                        </td>
                        <td className="p-4">
                          <Badge className={INVOICE_STATUS_COLORS[displayStatus]}>
                            {INVOICE_STATUS_LABELS[displayStatus]}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setDetailsOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Info */}
            <div className="p-4 border-t border-border/40 text-sm text-muted-foreground">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <InvoiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={async (invoice) => {
          try {
            await loadData();
            toast.success("Invoice created successfully");
          } catch (error) {
            toast.error("Failed to create invoice");
          }
        }}
      />

      <InvoiceDetailsModal
        invoice={selectedInvoice}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={() => {
          setEditingInvoice(selectedInvoice);
          setDetailsOpen(false);
          // TODO: Implement edit mode
        }}
        onStatusChange={handleStatusChange}
        onSendEmail={() => {
          if (selectedInvoice) handleSendEmail(selectedInvoice.id);
        }}
        onDownloadPDF={() => {
          if (selectedInvoice) handleDownloadPDF(selectedInvoice.id);
        }}
        onDelete={() => {
          if (selectedInvoice) handleDeleteInvoice(selectedInvoice.id);
        }}
      />
    </div>
  );
}
