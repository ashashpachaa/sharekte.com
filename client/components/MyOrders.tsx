import { useState, useEffect, useMemo } from "react";
import {
  Order,
  getAllOrders,
  getStatusColor,
  formatOrderId,
  updateOrderStatus,
  type OrderStatus,
} from "@/lib/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Eye,
  Download,
  RefreshCw,
  FileText,
  Calendar,
  DollarSign,
  ChevronDown,
  Edit2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompanyTransferForm } from "./CompanyTransferForm";

interface MyOrdersProps {
  userEmail: string;
}

export function MyOrders({ userEmail }: MyOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | OrderStatus>("all");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTransferFormModal, setShowTransferFormModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, [userEmail]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log(`[MyOrders] Loading orders for user email: ${userEmail}`);

      // First try API, with timeout and fallback
      let allOrders: Order[] = [];
      try {
        // Simple fetch without complex options that might fail
        const response = await fetch("/api/orders");
        if (response.ok) {
          allOrders = await response.json();
          console.log(`[MyOrders] Loaded ${allOrders.length} orders from API`);
        } else {
          console.warn(`[MyOrders] API returned status ${response.status}`);
        }
      } catch (apiError) {
        console.warn("[MyOrders] API fetch failed, checking localStorage...", apiError);

        // Fallback to localStorage orders
        const savedOrders = localStorage.getItem("userOrders");
        if (savedOrders) {
          try {
            allOrders = JSON.parse(savedOrders);
            console.log(`[MyOrders] Loaded ${allOrders.length} orders from localStorage`);
          } catch (e) {
            console.warn("[MyOrders] Failed to parse localStorage orders");
          }
        }
      }

      // Filter orders for current user
      const userOrders = allOrders.filter(
        (order) =>
          order.customerEmail.toLowerCase() === userEmail.toLowerCase(),
      );

      console.log(
        `[MyOrders] Found ${userOrders.length} orders for ${userEmail}`,
      );

      setOrders(userOrders);

      // Save to localStorage for future access
      if (allOrders.length > 0) {
        try {
          localStorage.setItem("userOrders", JSON.stringify(allOrders));
        } catch (e) {
          console.warn("[MyOrders] Failed to save orders to localStorage");
        }
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderId.toLowerCase().includes(query) ||
          o.companyName.toLowerCase().includes(query) ||
          o.companyNumber.toLowerCase().includes(query),
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((o) => o.status === filterStatus);
    }

    return result.sort(
      (a, b) =>
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
    );
  }, [orders, searchQuery, filterStatus]);

  const orderStats = {
    total: orders.length,
    active: orders.filter(
      (o) => o.status === "completed" || o.status === "paid",
    ).length,
    pending: orders.filter(
      (o) =>
        o.status === "pending-payment" ||
        o.status === "transfer-form-pending" ||
        o.status === "under-review" ||
        o.status === "amend-required",
    ).length,
    refunded: orders.filter((o) => o.status === "refunded").length,
  };

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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted/30 rounded-lg animate-pulse"></div>
        <div className="h-64 bg-muted/30 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">My Orders</h2>
        <p className="text-muted-foreground">
          View and manage all your company orders
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border/40 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-foreground">
            {orderStats.total}
          </p>
        </div>
        <div className="bg-card border border-border/40 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {orderStats.active}
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
      </div>

      {/* Filters */}
      <div className="bg-card border border-border/40 rounded-lg p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID or company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            All
          </Button>
          {[
            "pending-payment",
            "transfer-form-pending",
            "completed",
            "refunded",
          ].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status as OrderStatus)}
            >
              {status.replace(/-/g, " ").toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-card border border-border/40 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {orders.length === 0
              ? "No orders yet"
              : "No orders match your filters"}
          </p>
          {orders.length === 0 && (
            <Button
              className="bg-primary hover:bg-primary-600 text-white"
              asChild
            >
              <a href="/">Browse Companies</a>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={() => {
                setSelectedOrder(order);
                setShowDetailsModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={loadOrders}
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
          onOpenTransferForm={() => {
            setShowDetailsModal(false);
            setShowTransferFormModal(true);
          }}
        />
      )}

      {/* Transfer Form Modal */}
      <Dialog
        open={showTransferFormModal}
        onOpenChange={setShowTransferFormModal}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Company Transfer Form</DialogTitle>
            <DialogDescription>
              Please fill out the transfer form for {selectedOrder?.companyName}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <CompanyTransferForm
              orderId={selectedOrder.orderId}
              companyId={
                selectedOrder.companyId || `company_${selectedOrder.id}`
              }
              companyName={selectedOrder.companyName}
              companyNumber={selectedOrder.companyNumber}
              incorporationDate=""
              incorporationYear={new Date().getFullYear()}
              onSuccess={() => {
                toast.success("Transfer form submitted successfully!");
                setShowTransferFormModal(false);
                loadOrders();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  onViewDetails: () => void;
}

function OrderCard({ order, onViewDetails }: OrderCardProps) {
  const daysUntilRenewal = Math.ceil(
    (new Date(order.renewalDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div
      className="bg-card border border-border/40 rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
      onClick={onViewDetails}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono font-semibold text-foreground">
                {order.orderId}
              </p>
            </div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}
            >
              {order.status.replace(/-/g, " ")}
            </span>
          </div>

          <div className="mb-3">
            <p className="text-sm text-muted-foreground">Company</p>
            <p className="font-semibold text-foreground">{order.companyName}</p>
            <p className="text-xs text-muted-foreground">
              {order.companyNumber}
            </p>
          </div>

          <div className="flex gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-bold text-lg text-foreground">
                {order.currency} {order.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment</p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${
                  order.paymentStatus === "completed"
                    ? "bg-green-100 text-green-700"
                    : order.paymentStatus === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className="flex items-end justify-between h-full">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Purchased: {new Date(order.purchaseDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>
                  Renewal: {new Date(order.renewalDate).toLocaleDateString()}
                </span>
              </div>
              {daysUntilRenewal > 0 && daysUntilRenewal <= 30 && (
                <div className="flex items-center gap-2 text-orange-600 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Renews in {daysUntilRenewal} days</span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Refund Status */}
      {order.refundStatus !== "none" && (
        <div className="mt-4 pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground mb-1">Refund Status</p>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              order.refundStatus === "completed"
                ? "bg-cyan-100 text-cyan-700"
                : order.refundStatus === "approved"
                  ? "bg-green-100 text-green-700"
                  : order.refundStatus === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
            }`}
          >
            {order.refundStatus.replace(/-/g, " ")}
          </span>
        </div>
      )}
    </div>
  );
}

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onOpenTransferForm?: () => void;
}

function OrderDetailsModal({
  order,
  onClose,
  onOpenTransferForm,
}: OrderDetailsModalProps) {
  const daysUntilRenewal = Math.ceil(
    (new Date(order.renewalDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border/40 sticky top-0 bg-background">
          <h2 className="text-xl font-bold text-foreground">Order Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Status Timeline */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              Status & Timeline
            </h3>
            <div className="space-y-3">
              {order.statusHistory && order.statusHistory.length > 0 ? (
                order.statusHistory.map((change) => (
                  <div key={change.id} className="flex gap-4 text-sm">
                    <div className="text-right min-w-24">
                      <p className="text-xs text-muted-foreground">
                        {new Date(change.changedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-muted-foreground">
                        {change.fromStatus?.replace(/-/g, " ")} →{" "}
                        <span className="font-semibold text-foreground">
                          {change.toStatus.replace(/-/g, " ")}
                        </span>
                      </p>
                      {change.reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {change.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No status history available
                </p>
              )}
            </div>
          </div>

          {/* Company Details */}
          <div className="border-t border-border/40 pt-6">
            <h3 className="font-semibold text-foreground mb-4">
              Company Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Company Name</p>
                <p className="text-foreground font-medium">
                  {order.companyName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Company Number</p>
                <p className="text-foreground font-mono">
                  {order.companyNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t border-border/40 pt-6">
            <h3 className="font-semibold text-foreground mb-4">
              Payment Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="text-lg font-bold text-foreground">
                  {order.currency} {order.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment Status</p>
                <p className="text-foreground capitalize">
                  {order.paymentStatus}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment Method</p>
                <p className="text-foreground capitalize">
                  {order.paymentMethod.replace(/_/g, " ")}
                </p>
              </div>
              {order.transactionId && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Transaction ID
                  </p>
                  <p className="text-foreground font-mono text-sm">
                    {order.transactionId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Renewal Information */}
          <div className="border-t border-border/40 pt-6">
            <h3 className="font-semibold text-foreground mb-4">
              Renewal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Renewal Date</p>
                <p className="text-foreground font-medium">
                  {new Date(order.renewalDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Days Until Renewal
                </p>
                <p
                  className={`text-lg font-bold ${daysUntilRenewal > 0 ? "text-foreground" : "text-orange-600"}`}
                >
                  {daysUntilRenewal > 0
                    ? `${daysUntilRenewal} days`
                    : "Overdue"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Renewal Fees</p>
                <p className="text-foreground font-medium">
                  {order.currency} {order.renewalFees.toLocaleString()}
                </p>
              </div>
            </div>

            {daysUntilRenewal > 0 && daysUntilRenewal <= 30 && (
              <Button
                className="w-full mt-4 bg-primary hover:bg-primary-600 text-white"
                disabled
              >
                Renew Now (Coming Soon)
              </Button>
            )}
          </div>

          {/* Documents */}
          {order.documents && order.documents.length > 0 && (
            <div className="border-t border-border/40 pt-6">
              <h3 className="font-semibold text-foreground mb-4">Documents</h3>
              <div className="space-y-2">
                {order.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.uploadedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" disabled>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refund Status */}
          {order.refundStatus !== "none" && (
            <div className="border-t border-border/40 pt-6">
              <h3 className="font-semibold text-foreground mb-4">
                Refund Status
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.refundStatus === "completed"
                        ? "bg-cyan-100 text-cyan-700"
                        : order.refundStatus === "approved"
                          ? "bg-green-100 text-green-700"
                          : order.refundStatus === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {order.refundStatus.replace(/-/g, " ")}
                  </span>
                </div>
                {order.refundRequest && (
                  <>
                    <p className="text-sm text-muted-foreground mb-2">
                      Reason: {order.refundRequest.reason}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      Requested: {order.currency}{" "}
                      {order.refundRequest.requestedAmount.toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Transfer Form Action */}
          {order.status === "transfer-form-pending" && onOpenTransferForm && (
            <div className="border-t border-border/40 pt-6">
              <Button
                onClick={onOpenTransferForm}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Fill Company Transfer Form
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
