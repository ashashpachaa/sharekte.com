import { useState } from "react";
import { type ServiceOrder } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAPIBaseURL } from "@/lib/transfer-form";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

interface ServiceOrderDetailsModalProps {
  order: ServiceOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: (order: ServiceOrder) => void;
}

interface OrderComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export function ServiceOrderDetailsModal({
  order,
  open,
  onOpenChange,
  onOrderUpdated,
}: ServiceOrderDetailsModalProps) {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<OrderComment[]>([]);
  const [newStatus, setNewStatus] = useState(order.status);
  const [loadingComment, setLoadingComment] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  // Load comments when modal opens
  const loadComments = async () => {
    if (commentsLoaded) return;
    try {
      const baseURL = getAPIBaseURL();
      const response = await fetch(
        `${baseURL}/api/service-orders/${order.id}/comments`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setComments(data || []);
      }
      setCommentsLoaded(true);
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setLoadingComment(true);
      const baseURL = getAPIBaseURL();
      const response = await fetch(
        `${baseURL}/api/service-orders/${order.id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: newComment,
            author: "Admin",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const comment = await response.json();
      setComments([...comments, comment]);
      setNewComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setLoadingComment(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      setLoadingStatus(true);
      const baseURL = getAPIBaseURL();
      const response = await fetch(
        `${baseURL}/api/service-orders/${order.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const updatedOrder = await response.json();
      setNewStatus(status);
      onOrderUpdated(updatedOrder);
      toast.success("Order status updated");
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
      setNewStatus(order.status);
    } finally {
      setLoadingStatus(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(amount);
    } catch {
      return `${currency} ${amount}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Service Order Details</DialogTitle>
          <DialogDescription>
            Order ID: {order.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono font-semibold">{order.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Service Name</p>
              <p className="font-semibold">{order.serviceName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer Name</p>
              <p className="font-semibold">{order.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer Email</p>
              <p className="text-sm">{order.customerEmail}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-semibold">
                {formatAmount(order.amount, order.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="text-sm">{formatDate(order.purchaseDate)}</p>
            </div>
          </div>

          <Separator />

          {/* Status Section */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">Order Status</p>
            <div className="flex items-center gap-3">
              <Badge className={STATUS_COLORS[newStatus] || "bg-gray-100"}>
                {newStatus}
              </Badge>
              <Select value={newStatus} onValueChange={handleStatusChange} disabled={loadingStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {loadingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>

          <Separator />

          {/* Application Form Data */}
          <div>
            <h3 className="font-semibold mb-4">Application Form Data</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              {Object.entries(order.applicationData || {}).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No application data submitted
                </p>
              ) : (
                Object.entries(order.applicationData || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start">
                    <span className="text-sm font-medium capitalize text-muted-foreground">
                      {key.replace(/_/g, " ")}:
                    </span>
                    <span className="text-sm font-semibold max-w-xs text-right">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <Separator />

          {/* Comments Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Admin Notes & Comments</h3>
              {!commentsLoaded && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadComments}
                >
                  Load Comments
                </Button>
              )}
            </div>

            {commentsLoaded && (
              <>
                {/* Comments List */}
                <div className="space-y-3 mb-4 max-h-[250px] overflow-y-auto bg-muted/30 rounded-lg p-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No comments yet
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-background rounded-lg p-3 border border-border/50"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm font-semibold">
                            {comment.author}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a note or comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={loadingComment || !newComment.trim()}
                    className="w-full"
                  >
                    {loadingComment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Add Comment
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
