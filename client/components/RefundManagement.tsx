import { useState } from "react";
import { Order, approveRefund, rejectRefund, calculateRefundFee, calculateNetRefund, type RefundStatus } from "@/lib/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, XCircle, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RefundManagementProps {
  order: Order;
  onClose: () => void;
  onRefundProcessed: (updatedOrder: Order) => void;
}

export function RefundManagement({ order, onClose, onRefundProcessed }: RefundManagementProps) {
  const [approvalAmount, setApprovalAmount] = useState(order.refundRequest?.requestedAmount.toString() || "");
  const [refundFeePercentage, setRefundFeePercentage] = useState("3");
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState<"review" | "approve" | "reject">("review");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  if (!order.refundRequest) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Refund Request</h3>
            <p className="text-muted-foreground mb-4">This order does not have a pending refund request.</p>
            <Button className="w-full bg-primary hover:bg-primary-600 text-white" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const refundAmount = parseFloat(approvalAmount) || 0;
  const refundFee = calculateRefundFee(refundAmount, parseFloat(refundFeePercentage) || 0);
  const netRefund = calculateNetRefund(refundAmount, refundFee);

  const handleApproveRefund = async () => {
    if (!refundAmount || refundAmount <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }

    setProcessing(true);
    try {
      const updatedOrder = await approveRefund(order.id, refundAmount, refundFee);
      toast.success(`Refund approved for £${netRefund.toLocaleString()}`);
      onRefundProcessed(updatedOrder);
      onClose();
    } catch (error) {
      console.error("Failed to approve refund:", error);
      toast.error("Failed to approve refund");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectRefund = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const updatedOrder = await rejectRefund(order.id, rejectionReason);
      toast.success("Refund request rejected");
      onRefundProcessed(updatedOrder);
      onClose();
    } catch (error) {
      console.error("Failed to reject refund:", error);
      toast.error("Failed to reject refund");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border/40 sticky top-0 bg-background">
          <h2 className="text-xl font-bold text-foreground">Refund Management</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Order ID</p>
                <p className="font-semibold text-foreground">{order.orderId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-semibold text-foreground">{order.customerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Original Amount</p>
                <p className="font-bold text-lg text-foreground">
                  {order.currency} {order.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Status</p>
                <p className="font-semibold text-orange-600">Refund Requested</p>
              </div>
            </div>
          </div>

          {/* Refund Request Details */}
          <div className="border-t border-border/40 pt-6">
            <h3 className="font-semibold text-foreground mb-4">Refund Request Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Request Date:</span>
                <span className="text-foreground">
                  {new Date(order.refundRequest.requestDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reason:</span>
                <span className="text-foreground font-medium">{order.refundRequest.reason}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border/40">
                <span className="text-muted-foreground">Requested Amount:</span>
                <span className="text-foreground font-bold">
                  {order.currency} {order.refundRequest.requestedAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border/40">
            <button
              onClick={() => setActiveTab("review")}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === "review"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Review
            </button>
            <button
              onClick={() => setActiveTab("approve")}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === "approve"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Approve
            </button>
            <button
              onClick={() => setActiveTab("reject")}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === "reject"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Reject
            </button>
          </div>

          {/* Review Tab */}
          {activeTab === "review" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Review the refund request carefully.</strong> Check the customer's reason and the order details before making a decision. Once approved or rejected, the customer will be notified.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Order Details:</h4>
                <div className="text-sm space-y-2">
                  <p>
                    <span className="text-muted-foreground">Company:</span>{" "}
                    <span className="font-medium text-foreground">{order.companyName}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Purchase Date:</span>{" "}
                    <span className="font-medium text-foreground">
                      {new Date(order.purchaseDate).toLocaleDateString()}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Payment Status:</span>{" "}
                    <span className="font-medium text-foreground capitalize">{order.paymentStatus}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Days Since Purchase:</span>{" "}
                    <span className="font-medium text-foreground">
                      {Math.floor(
                        (new Date().getTime() - new Date(order.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)
                      )}
                      days
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Approve Tab */}
          {activeTab === "approve" && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-900">
                    Approving this refund will process the payment back to the customer's original payment method.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Refund Amount {order.currency}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={approvalAmount}
                      onChange={(e) => setApprovalAmount(e.target.value)}
                      placeholder={order.refundRequest.requestedAmount.toString()}
                      className="pl-10"
                      disabled={processing}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Original request: {order.currency} {order.refundRequest.requestedAmount.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Refund Fee (%) - Typically 3%
                  </label>
                  <Input
                    type="number"
                    value={refundFeePercentage}
                    onChange={(e) => setRefundFeePercentage(e.target.value)}
                    placeholder="3"
                    disabled={processing}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Fee for payment gateway, chargeback protection, etc.
                  </p>
                </div>

                {/* Calculation Summary */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Refund Amount:</span>
                    <span className="font-semibold text-foreground">
                      {order.currency} {refundAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Refund Fee ({refundFeePercentage}%):</span>
                    <span className="font-semibold">- {order.currency} {refundFee.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border/40 pt-2 flex justify-between text-sm">
                    <span className="font-semibold text-foreground">Net Refund:</span>
                    <span className="font-bold text-lg text-green-600">
                      {order.currency} {netRefund.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleApproveRefund}
                  disabled={processing || refundAmount <= 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {processing ? "Processing..." : "Approve Refund"}
                </Button>
              </div>
            </div>
          )}

          {/* Reject Tab */}
          {activeTab === "reject" && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-900">
                    Rejecting this refund will send a notification to the customer with your reason.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why you are rejecting this refund request..."
                  className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={5}
                  disabled={processing}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The customer will see this message. Be professional and clear.
                </p>
              </div>

              <Button
                onClick={handleRejectRefund}
                disabled={processing || !rejectionReason.trim()}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {processing ? "Processing..." : "Reject Refund"}
              </Button>
            </div>
          )}

          {/* Footer Note */}
          <div className="border-t border-border/40 pt-4 text-xs text-muted-foreground">
            <p>
              <strong>Note:</strong> Refund decisions are logged in the system. The customer will receive an email notification immediately after approval or rejection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
