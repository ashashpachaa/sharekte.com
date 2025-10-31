export type OrderStatus = 
  | "pending-payment"
  | "paid"
  | "transfer-form-pending"
  | "under-review"
  | "amend-required"
  | "pending-transfer"
  | "completed"
  | "cancelled"
  | "refunded"
  | "disputed";

export type RefundStatus = 
  | "none"
  | "requested"
  | "under-review"
  | "approved"
  | "completed"
  | "rejected";

export type PaymentMethod = "credit_card" | "debit_card" | "bank_transfer" | "paypal";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface OrderDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedDate: string;
  uploadedBy: string;
  url?: string;
  visibility: "admin" | "user" | "both";
  version: number;
}

export interface RefundRequest {
  id: string;
  requestDate: string;
  requestedBy: string;
  reason: string;
  status: RefundStatus;
  requestedAmount: number;
  approvedAmount?: number;
  refundFee?: number;
  netRefundAmount?: number;
  approvedDate?: string;
  approvedBy?: string;
  rejectionReason?: string;
  completedDate?: string;
  notes?: string;
}

export interface OrderStatusChange {
  id: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedDate: string;
  changedBy: string;
  reason?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderId: string;
  
  // Customer Info
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  billingAddress?: string;
  country: string;
  
  // Company Info
  companyId: string;
  companyName: string;
  companyNumber: string;
  
  // Payment Info
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  amount: number;
  currency: string;
  paymentDate?: string;
  
  // Order Status
  status: OrderStatus;
  statusChangedDate: string;
  statusHistory: OrderStatusChange[];
  
  // Dates
  purchaseDate: string;
  lastUpdateDate: string;
  
  // Renewal
  renewalDate: string;
  renewalFees: number;
  
  // Refund Info
  refundStatus: RefundStatus;
  refundRequest?: RefundRequest;
  
  // Documents
  documents: OrderDocument[];
  transferFormUrl?: string;
  
  // Admin Notes
  adminNotes?: string;
  internalNotes?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  airtableId?: string;
}

/**
 * Get all orders
 */
export async function getAllOrders(): Promise<Order[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch("/api/orders", {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `Failed to fetch orders: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Failed to fetch orders:", errorMessage);
    throw new Error(`Failed to fetch orders: ${errorMessage}`);
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const response = await fetch(`/api/orders/${orderId}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return null;
  }
}

/**
 * Create new order
 */
export async function createOrder(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!response.ok) throw new Error("Failed to create order");
  return response.json();
}

/**
 * Update order
 */
export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<Order> {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update order");
  return response.json();
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus, reason?: string): Promise<Order> {
  const response = await fetch(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus, reason }),
  });
  if (!response.ok) throw new Error("Failed to update order status");
  return response.json();
}

/**
 * Request refund
 */
export async function requestRefund(orderId: string, reason: string, requestedAmount: number): Promise<Order> {
  const response = await fetch(`/api/orders/${orderId}/refund-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, requestedAmount }),
  });
  if (!response.ok) throw new Error("Failed to request refund");
  return response.json();
}

/**
 * Approve refund
 */
export async function approveRefund(orderId: string, approvedAmount: number, refundFee?: number): Promise<Order> {
  const response = await fetch(`/api/orders/${orderId}/refund-approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approvedAmount, refundFee }),
  });
  if (!response.ok) throw new Error("Failed to approve refund");
  return response.json();
}

/**
 * Reject refund
 */
export async function rejectRefund(orderId: string, reason: string): Promise<Order> {
  const response = await fetch(`/api/orders/${orderId}/refund-reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error("Failed to reject refund");
  return response.json();
}

/**
 * Upload document to order
 */
export async function uploadOrderDocument(
  orderId: string,
  file: File,
  visibility: "admin" | "user" | "both"
): Promise<Order> {
  // Convert file to base64 for JSON transmission (works better with serverless)
  const fileData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const response = await fetch(`/api/orders/${orderId}/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file: fileData,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      visibility,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || "Failed to upload document");
  }

  return response.json();
}

/**
 * Delete order document
 */
export async function deleteOrderDocument(orderId: string, documentId: string): Promise<Order> {
  const response = await fetch(`/api/orders/${orderId}/documents/${documentId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete document");
  return response.json();
}

/**
 * Add internal note to order
 */
export async function addOrderNote(orderId: string, note: string, isInternal: boolean = false): Promise<Order> {
  const response = await fetch(`/api/orders/${orderId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note, isInternal }),
  });
  if (!response.ok) throw new Error("Failed to add note");
  return response.json();
}

/**
 * Get status color for display
 */
export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    "pending-payment": "bg-yellow-100 text-yellow-700",
    "paid": "bg-blue-100 text-blue-700",
    "transfer-form-pending": "bg-orange-100 text-orange-700",
    "under-review": "bg-purple-100 text-purple-700",
    "amend-required": "bg-red-100 text-red-700",
    "pending-transfer": "bg-indigo-100 text-indigo-700",
    "completed": "bg-green-100 text-green-700",
    "cancelled": "bg-gray-100 text-gray-700",
    "refunded": "bg-cyan-100 text-cyan-700",
    "disputed": "bg-rose-100 text-rose-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}

/**
 * Get refund status color
 */
export function getRefundStatusColor(status: RefundStatus): string {
  const colors: Record<RefundStatus, string> = {
    "none": "bg-gray-100 text-gray-700",
    "requested": "bg-blue-100 text-blue-700",
    "under-review": "bg-yellow-100 text-yellow-700",
    "approved": "bg-green-100 text-green-700",
    "completed": "bg-emerald-100 text-emerald-700",
    "rejected": "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}

/**
 * Calculate refund fee (% based)
 */
export function calculateRefundFee(amount: number, feePercentage: number = 3): number {
  return Math.round((amount * feePercentage) / 100);
}

/**
 * Calculate net refund amount
 */
export function calculateNetRefund(amount: number, fee: number): number {
  return amount - fee;
}

/**
 * Format order ID for display
 */
export function formatOrderId(orderId: string): string {
  return `ORD-${orderId.slice(-8).toUpperCase()}`;
}
