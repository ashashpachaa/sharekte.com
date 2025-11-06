import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/lib/admin-context";
import {
  getAllOrders,
  updateOrder,
  updateOrderStatus,
  getStatusColor,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { RefundManagement } from "@/components/RefundManagement";
import { DocumentManagement } from "@/components/DocumentManagement";
import { TransferFormManagement } from "@/components/TransferFormManagement";
import { StatusHistoryTimeline } from "@/components/StatusHistoryTimeline";
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
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/lib/notifications-context";
import { getAPIBaseURL } from "@/lib/transfer-form";
import { useCurrency } from "@/lib/currency-context";
import type { CompanyData } from "@/lib/company-management";

type FilterStatus = "all" | OrderStatus;

export default function AdminOrders() {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { currency, rates, convertPrice } = useCurrency();
  const [notifiedOrderIds, setNotifiedOrderIds] = useState<Set<string>>(
    new Set(),
  );
  const [viewedOrderIds, setViewedOrderIds] = useState<Set<string>>(new Set());
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
  const [previousOrderStates, setPreviousOrderStates] = useState<
    Map<string, string>
  >(new Map());
  const [companies, setCompanies] = useState<CompanyData[]>([]);

  // Fetch companies from API
  const loadCompanies = async () => {
    try {
      const apiBaseURL = getAPIBaseURL();
      const response = await fetch(`${apiBaseURL}/api/companies`);
      if (!response.ok) {
        console.error("Failed to fetch companies");
        return;
      }
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error("Error loading companies:", error);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
    } else {
      loadOrders();
      loadCompanies();
      // Auto-refresh orders every 5 seconds to sync with Airtable (increased from 1s to avoid request stacking)
      const refreshInterval = setInterval(() => {
        loadOrders();
      }, 5000);
      return () => clearInterval(refreshInterval);
    }
  }, [isAdmin, navigate]);

  // Refresh when tab changes and reset badge counts
  useEffect(() => {
    loadOrders();
    // Reset badge when switching to that tab
    if (activeTab === "orders") {
      setNewOrdersCount(0);
    } else if (activeTab === "forms") {
      setNewFormsCount(0);
    }
  }, [activeTab]);

  const isOrderNew = (orderId: string) => {
    return notifiedOrderIds.has(orderId);
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.purchaseDate).getTime() -
          new Date(a.purchaseDate).getTime(),
      );
      setOrders(sortedData);

      // Check for new orders and status changes
      const newOrders = sortedData.filter((o) => {
        const orderDate = new Date(o.purchaseDate);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return orderDate > fiveMinutesAgo;
      });

      if (newOrders.length > 0) {
        setNewOrdersCount(newOrders.length);
        // Create notifications for new orders that haven't been notified or viewed yet
        newOrders.forEach((order) => {
          if (
            !notifiedOrderIds.has(order.id) &&
            !viewedOrderIds.has(order.id)
          ) {
            addNotification({
              id: `order-${order.id}`,
              title: "New Order",
              message: `New order ${order.orderId} from ${order.customerName} for ${order.companyName}`,
              type: "success",
              read: false,
              timestamp: new Date(),
            });
            setNotifiedOrderIds((prev) => new Set([...prev, order.id]));
          }
        });
        const message =
          newOrders.length === 1
            ? `New order: ${newOrders[0].orderId} from ${newOrders[0].customerName}`
            : `${newOrders.length} new orders received`;

        // Only show toast notification if not already shown
        const lastNotificationTime = localStorage.getItem(
          "lastOrderNotification",
        );
        const now = Date.now();
        if (
          !lastNotificationTime ||
          now - parseInt(lastNotificationTime) > 30000
        ) {
          toast.success(message);
          localStorage.setItem("lastOrderNotification", now.toString());
        }
      } else {
        setNewOrdersCount(0);
      }

      // Check for status changes from Airtable
      sortedData.forEach((order) => {
        const previousStatus = previousOrderStates.get(
          order.id || order.orderId,
        );
        if (previousStatus && previousStatus !== order.status) {
          // Status changed - show notification
          toast.info(
            `Order ${order.orderId}: Status changed to ${order.status}`,
          );
        }
      });

      // Update previous order states
      const newStates = new Map(previousOrderStates);
      sortedData.forEach((order) => {
        newStates.set(order.id || order.orderId, order.status);
      });
      setPreviousOrderStates(newStates);
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
          o.companyName.toLowerCase().includes(query),
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
      result = result.filter(
        (o) => new Date(o.purchaseDate) >= new Date(dateFrom),
      );
    }
    if (dateTo) {
      result = result.filter(
        (o) => new Date(o.purchaseDate) <= new Date(dateTo),
      );
    }

    return result.sort(
      (a, b) =>
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
    );
  }, [orders, searchQuery, filterStatus, filterCountry, dateFrom, dateTo]);

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
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
    paid: orders.filter((o) => o.status === "paid" || o.status === "completed")
      .length,
    pending: orders.filter(
      (o) =>
        o.status === "pending-payment" || o.status === "transfer-form-pending",
    ).length,
    completed: orders.filter((o) => o.status === "completed").length,
    refunded: orders.filter((o) => o.status === "refunded").length,
  };

  const uniqueCountries = Array.from(
    new Set(orders.map((o) => o.country)),
  ).sort();

  const statuses: OrderStatus[] = [
    "pending-payment",
    "paid",
    "transfer-form-pending",
    "under-review",
    "amend-required",
    "pending-transfer",
    "completed",
    "complete-transfer",
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/dashboard")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Orders Management
            </h1>
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
            <TabsTrigger value="orders" className="gap-2 relative">
              <DollarSign className="w-4 h-4" />
              Orders
              {newOrdersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {newOrdersCount > 9 ? "9+" : newOrdersCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="forms" className="gap-2 relative">
              <FileText className="w-4 h-4" />
              Transfer Forms
              {newFormsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {newFormsCount > 9 ? "9+" : newFormsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-card border border-border/40 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {orderStats.total}
                </p>
              </div>
              <div className="bg-card border border-border/40 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Paid/Completed
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {orderStats.paid}
                </p>
              </div>
              <div className="bg-card border border-border/40 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orderStats.pending}
                </p>
              </div>
              <div className="bg-card border border-border/40 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Refunded</p>
                <p className="text-2xl font-bold text-blue-600">
                  {orderStats.refunded}
                </p>
              </div>
              <div className="bg-card border border-border/40 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-primary">
                  {rates[currency as keyof typeof rates]?.symbol || "$"}
                  {orders
                    .reduce((sum, o) => sum + convertPrice(o.amount), 0)
                    .toLocaleString()}
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
                    onChange={(e) =>
                      setFilterStatus(e.target.value as FilterStatus)
                    }
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
                {(searchQuery ||
                  filterStatus !== "all" ||
                  filterCountry ||
                  dateFrom ||
                  dateTo) && (
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
                <div className="p-12 text-center text-muted-foreground">
                  No orders found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border/40">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          Order
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          Customer
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          Company
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          Date
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className={`hover:bg-muted/50 transition-colors ${isOrderNew(order.id) ? "bg-blue-50/50 border-l-4 border-l-blue-500" : ""}`}
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-foreground">
                                  {order.orderId}
                                </p>
                                {isOrderNew(order.id) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {order.id}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="font-medium text-foreground">
                                {order.customerName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.customerEmail}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {order.companyName}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-foreground">
                            {rates[currency as keyof typeof rates]?.symbol ||
                              "$"}
                            {order.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}
                            >
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
                                // Hide notification badge and mark as viewed when viewing order
                                setNotifiedOrderIds((prev) => {
                                  const updated = new Set(prev);
                                  updated.delete(order.id);
                                  return updated;
                                });
                                // Track as viewed so it won't be notified again
                                setViewedOrderIds(
                                  (prev) => new Set([...prev, order.id]),
                                );
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
      {showRefundModal &&
        selectedOrder &&
        selectedOrder.refundStatus !== "none" && (
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

function OrderDetailsModal({
  order,
  onClose,
  onStatusChange,
}: OrderDetailsModalProps) {
  const [editedOrder, setEditedOrder] = useState<Order>({
    ...order,
    amount:
      typeof order.amount === "number" && !isNaN(order.amount)
        ? order.amount
        : 0,
    renewalFees:
      typeof order.renewalFees === "number" && !isNaN(order.renewalFees)
        ? order.renewalFees
        : 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const statuses: OrderStatus[] = [
    "pending-payment",
    "paid",
    "transfer-form-pending",
    "under-review",
    "amend-required",
    "pending-transfer",
    "completed",
    "complete-transfer",
    "cancelled",
    "refunded",
    "disputed",
  ];

  const handleFieldChange = (field: keyof Order, value: any) => {
    setEditedOrder((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const changes: Partial<Order> = {};

      // Check if status has changed
      const statusChanged = editedOrder.status !== order.status;
      let updatedStatusHistory = [...(editedOrder.statusHistory || [])];

      // Only include changed fields
      Object.keys(editedOrder).forEach((key) => {
        if (editedOrder[key as keyof Order] !== order[key as keyof Order]) {
          changes[key as keyof Order] = editedOrder[key as keyof Order];
        }
      });

      if (Object.keys(changes).length === 0) {
        toast.info("No changes to save");
        return;
      }

      // If status changed, add to history
      if (statusChanged) {
        const today = new Date().toISOString().split("T")[0];
        const newHistoryEntry = {
          id: `hist-${Date.now()}`,
          fromStatus: order.status,
          toStatus: editedOrder.status,
          changedDate: today,
          changedBy: "admin",
          notes: editedOrder.adminNotes
            ? `Status updated to ${editedOrder.status}. Notes: ${editedOrder.adminNotes}`
            : `Status updated to ${editedOrder.status}`,
        };
        updatedStatusHistory.push(newHistoryEntry);
        changes.statusHistory = updatedStatusHistory;
        changes.statusChangedDate = today;
      }

      await updateOrder(order.id, changes);
      toast.success("Order updated and synced to Airtable");
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error("Failed to save order:", error);
      toast.error("Failed to update order");
    } finally {
      setIsSaving(false);
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
              <p className="text-xs text-muted-foreground font-semibold mb-1">
                Order ID
              </p>
              <p className="text-foreground font-mono">{editedOrder.orderId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-1">
                Order Date
              </p>
              <input
                type="date"
                value={editedOrder.purchaseDate.split("T")[0]}
                onChange={(e) =>
                  handleFieldChange("purchaseDate", e.target.value)
                }
                className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-1">
                Last Updated
              </p>
              <p className="text-foreground text-sm py-2">
                {new Date(editedOrder.lastUpdateDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-1">
                Payment Status
              </p>
              <select
                value={editedOrder.paymentStatus}
                onChange={(e) =>
                  handleFieldChange("paymentStatus", e.target.value)
                }
                className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t border-border/40 pt-6">
            <h3 className="font-semibold text-foreground mb-4">
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Name
                </p>
                <input
                  type="text"
                  value={editedOrder.customerName}
                  onChange={(e) =>
                    handleFieldChange("customerName", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Email
                </p>
                <input
                  type="email"
                  value={editedOrder.customerEmail}
                  onChange={(e) =>
                    handleFieldChange("customerEmail", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Phone
                </p>
                <input
                  type="tel"
                  value={editedOrder.customerPhone || ""}
                  onChange={(e) =>
                    handleFieldChange("customerPhone", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Country
                </p>
                <input
                  type="text"
                  value={editedOrder.country}
                  onChange={(e) => handleFieldChange("country", e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                />
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Billing Address
                </p>
                <input
                  type="text"
                  value={editedOrder.billingAddress || ""}
                  onChange={(e) =>
                    handleFieldChange("billingAddress", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="border-t border-border/40 pt-6">
            <h3 className="font-semibold text-foreground mb-4">
              Company Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Name
                </p>
                <input
                  type="text"
                  value={editedOrder.companyName}
                  onChange={(e) =>
                    handleFieldChange("companyName", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Company Number
                </p>
                <input
                  type="text"
                  value={editedOrder.companyNumber}
                  onChange={(e) =>
                    handleFieldChange("companyNumber", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border-t border-border/40 pt-6">
            <h3 className="font-semibold text-foreground mb-4">
              Payment Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Amount
                </p>
                <input
                  type="number"
                  value={editedOrder.amount}
                  onChange={(e) =>
                    handleFieldChange("amount", parseFloat(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Currency
                </p>
                <select
                  value={editedOrder.currency}
                  onChange={(e) =>
                    handleFieldChange("currency", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                >
                  <option value="USD">USD</option>
                  <option value="AED">AED</option>
                  <option value="SAR">SAR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Method
                </p>
                <select
                  value={editedOrder.paymentMethod}
                  onChange={(e) =>
                    handleFieldChange("paymentMethod", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Transaction ID
                </p>
                <input
                  type="text"
                  value={editedOrder.transactionId || ""}
                  onChange={(e) =>
                    handleFieldChange("transactionId", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Renewal Info */}
          <div className="border-t border-border/40 pt-6">
            <h3 className="font-semibold text-foreground mb-4">
              Renewal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Renewal Date
                </p>
                <input
                  type="date"
                  value={editedOrder.renewalDate.split("T")[0]}
                  onChange={(e) =>
                    handleFieldChange("renewalDate", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Renewal Fees ({editedOrder.currency})
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {editedOrder.currency === "AED" && "د.إ"}
                    {editedOrder.currency === "USD" && "$"}
                    {editedOrder.currency === "GBP" && "£"}
                    {editedOrder.currency === "EUR" && "€"}
                    {editedOrder.currency === "SAR" && "﷼"}
                  </span>
                  <input
                    type="number"
                    value={editedOrder.renewalFees}
                    onChange={(e) =>
                      handleFieldChange(
                        "renewalFees",
                        parseFloat(e.target.value),
                      )
                    }
                    className="flex-1 px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
                  />
                  <button
                    onClick={() => {
                      // Auto-calculate renewal fees based on company's standard renewal fee
                      // Get the linked company to check its renewal fee
                      if (!companies || companies.length === 0) {
                        toast.error(
                          "Companies data not loaded yet. Please try again.",
                        );
                        return;
                      }

                      const linkedCompany = companies.find(
                        (c) =>
                          (c.companyName || c.name || "").toLowerCase() ===
                          editedOrder.companyName.toLowerCase(),
                      );

                      if (linkedCompany && linkedCompany.renewalFee) {
                        // Convert company renewal fee to selected currency
                        const baseRenewalUSD = linkedCompany.renewalFee;
                        const rates: Record<string, number> = {
                          USD: 1,
                          AED: 3.67,
                          SAR: 3.75,
                          GBP: 0.79,
                          EUR: 0.92,
                        };
                        const rate = rates[editedOrder.currency] || 1;
                        const convertedFee = Math.round(baseRenewalUSD * rate);
                        handleFieldChange("renewalFees", convertedFee);
                        toast.success(
                          `Renewal fees auto-calculated to ${editedOrder.currency} ${convertedFee}`,
                        );
                      } else {
                        // Fallback: use 10% of purchase amount
                        const calculatedFee = Math.round(
                          editedOrder.amount * 0.1,
                        );
                        handleFieldChange("renewalFees", calculatedFee);
                        toast.success(
                          `Renewal fees calculated as 10% of purchase amount: ${editedOrder.currency} ${calculatedFee}`,
                        );
                      }
                    }}
                    className="px-3 py-2 bg-primary/10 text-primary rounded-md text-xs font-medium hover:bg-primary/20 transition"
                    title="Auto-calculate renewal fees based on company renewal fee"
                  >
                    Auto-Calculate
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="border-t border-border/40 pt-6">
            <h3 className="font-semibold text-foreground mb-4">Admin Notes</h3>
            <textarea
              value={editedOrder.adminNotes || ""}
              onChange={(e) => handleFieldChange("adminNotes", e.target.value)}
              placeholder="Internal admin notes..."
              className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground min-h-24"
            />
          </div>

          {/* Status Update */}
          <div className="border-t border-border/40 pt-6">
            <h3 className="font-semibold text-foreground mb-4">Order Status</h3>
            <select
              value={editedOrder.status}
              onChange={(e) =>
                handleFieldChange("status", e.target.value as OrderStatus)
              }
              className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/-/g, " ").toUpperCase()}
                </option>
              ))}
            </select>

            {/* Status History */}
            {editedOrder.statusHistory &&
              editedOrder.statusHistory.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border/40">
                  <StatusHistoryTimeline
                    statusHistory={editedOrder.statusHistory}
                    compact={false}
                  />
                </div>
              )}
          </div>

          {/* Refund Management */}
          {editedOrder.refundStatus !== "none" && (
            <div className="border-t border-border/40 pt-6">
              <h3 className="font-semibold text-foreground mb-4">
                Refund Management
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 font-medium">
                  Refund Status:{" "}
                  <span className="capitalize">{editedOrder.refundStatus}</span>
                </p>
                {editedOrder.refundRequest && (
                  <p className="text-sm text-blue-800 mt-1">
                    Amount Requested: {editedOrder.currency}{" "}
                    {editedOrder.refundRequest.requestedAmount.toLocaleString()}
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
            order={editedOrder}
            onDocumentsUpdated={(updatedOrder) => {
              setEditedOrder(updatedOrder);
              setHasChanges(true);
            }}
            isAdmin={true}
          />

          {/* Action Buttons */}
          <div className="border-t border-border/40 pt-6 flex gap-3 sticky bottom-0 bg-background">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving
                ? "Saving..."
                : hasChanges
                  ? "Save Changes"
                  : "No Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
