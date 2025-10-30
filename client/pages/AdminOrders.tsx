import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/lib/admin-context";
import { getAllOrders, updateOrderStatus, getStatusColor, type Order, type OrderStatus } from "@/lib/orders";
import { RefundManagement } from "@/components/RefundManagement";
import { DocumentManagement } from "@/components/DocumentManagement";
import { TransferFormManagement } from "@/components/TransferFormManagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  Eye,
  Download,
  ArrowLeft,
  DollarSign,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FilterStatus = "all" | OrderStatus;

export default function AdminOrders() {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newFormsCount, setNewFormsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterCountry, setFilterCountry] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
    } else {
      loadOrders();
      // Auto-refresh orders every 10 seconds to catch new orders
      const refreshInterval = setInterval(() => {
        loadOrders();
      }, 10000);
      return () => clearInterval(refreshInterval);
    }
  }, [isAdmin, navigate]);

  // Refresh when tab changes
  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      const sortedData = data.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
      setOrders(sortedData);

      // Check for new orders and show notification
      const newOrders = sortedData.filter((o) => {
        const orderDate = new Date(o.purchaseDate);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return orderDate > fiveMinutesAgo;
      });

      if (newOrders.length > 0) {
        setNewOrdersCount(newOrders.length);
        const message = newOrders.length === 1
          ? `New order: ${newOrders[0].orderId} from ${newOrders[0].customerName}`
          : `${newOrders.length} new orders received`;

        // Only show toast notification if not already shown
        const lastNotificationTime = localStorage.getItem("lastOrderNotification");
        const now = Date.now();
        if (!lastNotificationTime || now - parseInt(lastNotificationTime) > 30000) {
          toast.success(message);
          localStorage.setItem("lastOrderNotification", now.toString());
        }
      } else {
        setNewOrdersCount(0);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
      // Don't show error toast on auto-refresh
      if (!loading) {
        toast.error("Failed to load orders");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderId.toLowerCase().includes(query) ||
          o.customerName.toLowerCase().includes(query) ||
          o.customerEmail.toLowerCase().includes(query) ||
          o.companyName.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((o) => o.status === filterStatus);
    }

    // Country filter
    if (filterCountry) {
      result = result.filter((o) => o.country === filterCountry);
    }

    // Date range filter
    if (dateFrom) {
      result = result.filter((o) => new Date(o.purchaseDate) >= new Date(dateFrom));
    }
    if (dateTo) {
      result = result.filter((o) => new Date(o.purchaseDate) <= new Date(dateTo));
    }

    return result.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }, [orders, searchQuery, filterStatus, filterCountry, dateFrom, dateTo]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadOrders();
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update order status");
    }
  };

  const orderStats = {
    total: orders.length,
    paid: orders.filter((o) => o.status === "paid" || o.status === "completed").length,
    pending: orders.filter((o) => o.status === "pending-payment" || o.status === "transfer-form-pending").length,
    completed: orders.filter((o) => o.status === "completed").length,
    refunded: orders.filter((o) => o.status === "refunded").length,
  };

  const uniqueCountries = Array.from(new Set(orders.map((o) => o.country))).sort();

  const statuses: OrderStatus[] = [
    "pending-payment",
    "paid",
    "transfer-form-pending",
    "under-review",
    "amend-required",
    "pending-transfer",
    "completed",
    "cancelled",
    "refunded",
    "disputed",
  ];

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Orders Management</h1>
          </div>
          <Button variant="outline" onClick={loadOrders} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="orders" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="forms" className="gap-2">
              <FileText className="w-4 h-4" />
              Transfer Forms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-card border border-border/40 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-foreground">{orderStats.total}</p>
              </div>
              <div className="bg-card border border-border/40 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Paid/Completed</p>
                <p className="text-2xl font-bold text-green-600">{orderStats.paid}</p>
              </div>
              <div className="bg-card border border-border/40 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{orderStats.pending}</p>
              </div>
              <div className="bg-card border border-border/40 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Refunded</p>
                <p className="text-2xl font-bold text-blue-600">{orderStats.refunded}</p>
              </div>
              <div className="bg-card border border-border/40 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">
                  £{orders.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border/40 rounded-lg p-4 mb-6">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order ID, customer name, email, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filter Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                    className="px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                  >
                    <option value="all">All Statuses</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/-/g, " ").toUpperCase()}
                      </option>
                    ))}
                  </select>

                  {/* Country Filter */}
                  <select
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className="px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                  >
                    <option value="">All Countries</option>
                    {uniqueCountries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>

                  {/* Date From */}
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                  />

                  {/* Date To */}
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                  />
                </div>

                {/* Clear Filters */}
                {(searchQuery || filterStatus !== "all" || filterCountry || dateFrom || dateTo) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterStatus("all");
                      setFilterCountry("");
                      setDateFrom("");
                      setDateTo("");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No orders found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border/40">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Order</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Customer</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Company</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Amount</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-foreground">{order.orderId}</p>
                              <p className="text-xs text-muted-foreground">{order.id}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="font-medium text-foreground">{order.customerName}</p>
                              <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">{order.companyName}</td>
                          <td className="px-6 py-4 text-right font-semibold text-foreground">
                            {order.currency} {order.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                              {order.status.replace(/-/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(order.purchaseDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowDetailsModal(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination info */}
            <p className="text-sm text-muted-foreground mt-4">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
          </TabsContent>

          <TabsContent value="forms" className="space-y-8">
            <TransferFormManagement />
          </TabsContent>
        </Tabs>
      </main>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
          onStatusChange={(status) => {
            handleStatusChange(selectedOrder.id, status);
            setShowDetailsModal(false);
          }}
          onRefundClick={() => setShowRefundModal(true)}
        />
      )}

      {/* Refund Management Modal */}
      {showRefundModal && selectedOrder && selectedOrder.refundStatus !== "none" && (
        <RefundManagement
          order={selectedOrder}
          onClose={() => setShowRefundModal(false)}
          onRefundProcessed={(updatedOrder) => {
            setSelectedOrder(updatedOrder);
            loadOrders();
            setShowRefundModal(false);
          }}
        />
      )}
    </div>
  );
}

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onStatusChange: (status: OrderStatus) => void;
  onRefundClick?: () => void;
}

function OrderDetailsModal({ order, onClose, onStatusChange }: OrderDetailsModalProps) {
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);
  const { toast } = useToast();

  const statuses: OrderStatus[] = [
    "pending-payment",
    "paid",
    "transfer-form-pending",
    "under-review",
    "amend-required",
    "pending-transfer",
    "completed",
    "cancelled",
    "refunded",
    "disputed",
  ];

  const handleChangeStatus = () => {
    if (newStatus !== order.status) {
      onStatusChange(newStatus);
      toast.success("Status updated successfully");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border/40 sticky top-0 bg-background">
          <h2 className="text-xl font-bold text-foreground">Order Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-1">Order ID</p>
              <p className="text-foreground font-mono">{order.orderId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-1">Order Date</p>
              <p className="text-foreground">{new Date(order.purchaseDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-1">Last Updated</p>
              <p className="text-foreground">{new Date(order.lastUpdateDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-1">Payment Status</p>
              <p className="text-foreground capitalize">{order.paymentStatus}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t border-border/40 pt-6">
            <h3 className="font-semibold text-foreground mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-foreground font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-foreground font-medium">{order.customerEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-foreground font-medium">{order.customerPhone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Country</p>
                <p className="text-foreground font-medium">{order.country}</p>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="border-t border-border/40 pt-6">
            <h3 className="font-semibold text-foreground mb-4">Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-foreground font-medium">{order.companyName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Company Number</p>
                <p className="text-foreground font-mono">{order.companyNumber}</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border-t border-border/40 pt-6">
            <h3 className="font-semibold text-foreground mb-4">Payment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="text-lg font-bold text-foreground">
                  {order.currency} {order.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Method</p>
                <p className="text-foreground capitalize">{order.paymentMethod.replace(/_/g, " ")}</p>
              </div>
              {order.transactionId && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Transaction ID</p>
                  <p className="text-foreground font-mono text-sm">{order.transactionId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Update */}
          <div className="border-t border-border/40 pt-6">
            <h3 className="font-semibold text-foreground mb-4">Update Status</h3>
            <div className="flex gap-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="flex-1 px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/-/g, " ").toUpperCase()}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleChangeStatus}
                disabled={newStatus === order.status}
                className="bg-primary hover:bg-primary-600 text-white"
              >
                Update
              </Button>
            </div>
          </div>

          {/* Refund Management */}
          {order.refundStatus !== "none" && (
            <div className="border-t border-border/40 pt-6">
              <h3 className="font-semibold text-foreground mb-4">Refund Management</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 font-medium">
                  Refund Status: <span className="capitalize">{order.refundStatus}</span>
                </p>
                {order.refundRequest && (
                  <p className="text-sm text-blue-800 mt-1">
                    Amount Requested: {order.currency} {order.refundRequest.requestedAmount.toLocaleString()}
                  </p>
                )}
              </div>
              <Button
                onClick={() => {
                  if (onRefundClick) onRefundClick();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Manage Refund
              </Button>
            </div>
          )}

          {/* Documents Management */}
          <DocumentManagement
            order={order}
            onDocumentsUpdated={(updatedOrder) => {
              // Refresh orders list
            }}
            isAdmin={true}
          />
        </div>
      </div>
    </div>
  );
}
