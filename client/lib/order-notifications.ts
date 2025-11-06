import { Order, type OrderStatus, type RefundStatus } from "./orders";
import { getAPIBaseURL } from "./transfer-form";
import { useNotificationTriggers } from "@/hooks/use-notification-triggers";

export interface OrderNotification {
  type:
    | "order-created"
    | "payment-received"
    | "status-changed"
    | "refund-requested"
    | "refund-approved"
    | "refund-rejected"
    | "document-uploaded"
    | "renewal-reminder"
    | "order-cancelled";
  orderId: string;
  customerEmail: string;
  customerName: string;
  subject: string;
  message: string;
  details: Record<string, unknown>;
  sentAt: string;
  emailSent: boolean;
  toastShown: boolean;
}

/**
 * Send order creation notification
 */
export async function notifyOrderCreated(order: Order) {
  const notification: OrderNotification = {
    type: "order-created",
    orderId: order.orderId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    subject: `Order Confirmation - ${order.companyName}`,
    message: `Your order for ${order.companyName} has been created successfully.`,
    details: {
      companyName: order.companyName,
      amount: order.amount,
      currency: order.currency,
      purchaseDate: order.purchaseDate,
    },
    sentAt: new Date().toISOString(),
    emailSent: false,
    toastShown: false,
  };

  await sendNotification(notification);
}

/**
 * Send payment received notification
 */
export async function notifyPaymentReceived(order: Order) {
  const notification: OrderNotification = {
    type: "payment-received",
    orderId: order.orderId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    subject: `Payment Received - ${order.companyName}`,
    message: `Your payment of ${order.currency} ${order.amount} has been received and confirmed.`,
    details: {
      companyName: order.companyName,
      amount: order.amount,
      currency: order.currency,
      transactionId: order.transactionId,
      paymentDate: order.paymentDate,
    },
    sentAt: new Date().toISOString(),
    emailSent: false,
    toastShown: false,
  };

  await sendNotification(notification);
}

/**
 * Send status change notification
 */
export async function notifyStatusChanged(
  order: Order,
  oldStatus: OrderStatus,
  newStatus: OrderStatus,
  reason?: string
) {
  const notification: OrderNotification = {
    type: "status-changed",
    orderId: order.orderId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    subject: `Order Status Updated - ${order.companyName}`,
    message: `Your order status has been updated from ${oldStatus} to ${newStatus}.${reason ? ` ${reason}` : ""}`,
    details: {
      companyName: order.companyName,
      oldStatus,
      newStatus,
      reason,
      changedDate: new Date().toISOString(),
    },
    sentAt: new Date().toISOString(),
    emailSent: false,
    toastShown: false,
  };

  await sendNotification(notification);
}

/**
 * Send refund requested notification (to admin)
 */
export async function notifyRefundRequested(order: Order) {
  if (!order.refundRequest) return;

  const notification: OrderNotification = {
    type: "refund-requested",
    orderId: order.orderId,
    customerEmail: "admin@example.com", // Send to admin
    customerName: "Admin",
    subject: `[ADMIN] Refund Request - ${order.customerName}`,
    message: `Refund request received from ${order.customerName} for order ${order.orderId}.`,
    details: {
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      companyName: order.companyName,
      requestedAmount: order.refundRequest.requestedAmount,
      reason: order.refundRequest.reason,
      orderId: order.orderId,
    },
    sentAt: new Date().toISOString(),
    emailSent: false,
    toastShown: false,
  };

  await sendNotification(notification);
}

/**
 * Send refund approved notification
 */
export async function notifyRefundApproved(order: Order) {
  if (!order.refundRequest) return;

  const notification: OrderNotification = {
    type: "refund-approved",
    orderId: order.orderId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    subject: `Refund Approved - ${order.companyName}`,
    message: `Your refund request has been approved. You will receive ${order.currency} ${
      order.refundRequest.approvedAmount || order.refundRequest.requestedAmount
    } within 5-7 business days.`,
    details: {
      companyName: order.companyName,
      approvedAmount: order.refundRequest.approvedAmount,
      refundFee: order.refundRequest.refundFee,
      netRefundAmount: order.refundRequest.netRefundAmount,
      originalAmount: order.amount,
    },
    sentAt: new Date().toISOString(),
    emailSent: false,
    toastShown: false,
  };

  await sendNotification(notification);
}

/**
 * Send refund rejected notification
 */
export async function notifyRefundRejected(order: Order, reason: string) {
  const notification: OrderNotification = {
    type: "refund-rejected",
    orderId: order.orderId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    subject: `Refund Decision - ${order.companyName}`,
    message: `Your refund request has been reviewed. Reason: ${reason}`,
    details: {
      companyName: order.companyName,
      reason,
      contactSupport: "support@example.com",
    },
    sentAt: new Date().toISOString(),
    emailSent: false,
    toastShown: false,
  };

  await sendNotification(notification);
}

/**
 * Send document uploaded notification
 */
export async function notifyDocumentUploaded(order: Order, documentName: string, visibility: string) {
  if (visibility === "admin") return; // Don't notify if admin-only

  const notification: OrderNotification = {
    type: "document-uploaded",
    orderId: order.orderId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    subject: `New Document Available - ${order.companyName}`,
    message: `A new document "${documentName}" has been uploaded to your order.`,
    details: {
      companyName: order.companyName,
      documentName,
      uploadedDate: new Date().toISOString(),
    },
    sentAt: new Date().toISOString(),
    emailSent: false,
    toastShown: false,
  };

  await sendNotification(notification);
}

/**
 * Send renewal reminder notification
 */
export async function notifyRenewalReminder(order: Order, daysUntilRenewal: number) {
  const notification: OrderNotification = {
    type: "renewal-reminder",
    orderId: order.orderId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    subject: `Renewal Reminder - ${order.companyName}`,
    message: `Your company ${order.companyName} will expire in ${daysUntilRenewal} days. Renew now to avoid service interruption.`,
    details: {
      companyName: order.companyName,
      renewalDate: order.renewalDate,
      renewalFees: order.renewalFees,
      daysUntilRenewal,
    },
    sentAt: new Date().toISOString(),
    emailSent: false,
    toastShown: false,
  };

  await sendNotification(notification);
}

/**
 * Send order cancelled notification
 */
export async function notifyOrderCancelled(order: Order, reason: string) {
  const notification: OrderNotification = {
    type: "order-cancelled",
    orderId: order.orderId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    subject: `Order Cancelled - ${order.companyName}`,
    message: `Your order for ${order.companyName} has been cancelled. Reason: ${reason}`,
    details: {
      companyName: order.companyName,
      reason,
      cancelledDate: new Date().toISOString(),
    },
    sentAt: new Date().toISOString(),
    emailSent: false,
    toastShown: false,
  };

  await sendNotification(notification);
}

/**
 * Main notification sender - handles both email and toast
 */
async function sendNotification(notification: OrderNotification) {
  try {
    // Send email notification
    const emailSent = await sendEmailNotification(notification);
    notification.emailSent = emailSent;

    // Store in localStorage for audit trail
    const notifications = localStorage.getItem("order_notifications") || "[]";
    const parsed = JSON.parse(notifications);
    parsed.push(notification);
    localStorage.setItem("order_notifications", JSON.stringify(parsed.slice(-100))); // Keep last 100

    return notification;
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

/**
 * Send email via API endpoint
 */
async function sendEmailNotification(notification: OrderNotification): Promise<boolean> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/notifications/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: notification.customerEmail,
        subject: notification.subject,
        message: notification.message,
        notificationType: notification.type,
        details: notification.details,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

/**
 * Get all notifications for an order
 */
export function getOrderNotifications(orderId: string): OrderNotification[] {
  try {
    const notifications = localStorage.getItem("order_notifications") || "[]";
    const parsed = JSON.parse(notifications);
    return parsed.filter((n: OrderNotification) => n.orderId === orderId);
  } catch {
    return [];
  }
}

/**
 * Get recent notifications across all orders
 */
export function getRecentNotifications(limit = 20): OrderNotification[] {
  try {
    const notifications = localStorage.getItem("order_notifications") || "[]";
    const parsed = JSON.parse(notifications);
    return parsed.slice(-limit).reverse();
  } catch {
    return [];
  }
}
