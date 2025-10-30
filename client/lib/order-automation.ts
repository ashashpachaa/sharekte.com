import { Order, type OrderStatus } from "./orders";
import { getPurchasedCompanies, savePurchasedCompany, type PurchasedCompanyData } from "./user-data";

/**
 * Handle order status change and trigger automations
 */
export async function handleOrderStatusChange(
  order: Order,
  oldStatus: OrderStatus,
  newStatus: OrderStatus
): Promise<void> {
  // When order is completed - mark company as sold/owned
  if (newStatus === "completed") {
    await markCompanyAsOwned(order);
  }

  // When order is cancelled or refunded - make company available again
  if (newStatus === "cancelled" || newStatus === "refunded") {
    await makeCompanyAvailable(order);
  }

  // When payment is received - update status
  if (newStatus === "paid") {
    await handlePaymentReceived(order);
  }

  // When refund is approved - start refund process
  if (newStatus === "refunded" && oldStatus !== "refunded") {
    await handleRefundApproved(order);
  }
}

/**
 * Mark company as owned (when order is completed)
 */
async function markCompanyAsOwned(order: Order): Promise<void> {
  try {
    const companies = getPurchasedCompanies();
    const companyIndex = companies.findIndex((c) => c.id === order.companyId);

    if (companyIndex >= 0) {
      const company = companies[companyIndex];
      const updatedCompany: PurchasedCompanyData = {
        ...company,
        status: "completed",
        statusLabel: "Ownership Transferred",
        renewalStatus: "active",
      };

      savePurchasedCompany(updatedCompany);
      console.log(`Company ${order.companyName} marked as owned`);
    }
  } catch (error) {
    console.error("Failed to mark company as owned:", error);
  }
}

/**
 * Make company available again (when order is cancelled/refunded)
 */
async function makeCompanyAvailable(order: Order): Promise<void> {
  try {
    const companies = getPurchasedCompanies();
    const companyIndex = companies.findIndex((c) => c.id === order.companyId);

    if (companyIndex >= 0) {
      const company = companies[companyIndex];

      // Remove from purchased companies - it becomes available for new purchase
      const updatedCompanies = companies.filter((c) => c.id !== order.companyId);

      // Save the updated list (this effectively removes the company from the user's portfolio)
      updatedCompanies.forEach((c) => savePurchasedCompany(c));

      console.log(`Company ${order.companyName} returned to available pool`);

      // In a real implementation, you would:
      // 1. Mark the company as "Available" in the Airtable Companies table
      // 2. Add it back to the marketplace so other users can purchase it
      // 3. Update the Airtable Orders table to reflect the change
    }
  } catch (error) {
    console.error("Failed to make company available:", error);
  }
}

/**
 * Handle payment received - update order status and notify
 */
async function handlePaymentReceived(order: Order): Promise<void> {
  try {
    console.log(`Payment received for order ${order.orderId}`);

    // Update the order's payment date
    const updatedOrder: Order = {
      ...order,
      paymentStatus: "completed",
      paymentDate: new Date().toISOString(),
    };

    // In a real implementation, sync with Airtable here
    console.log("Order payment status updated:", updatedOrder);
  } catch (error) {
    console.error("Failed to handle payment received:", error);
  }
}

/**
 * Handle refund approval - start refund process
 */
async function handleRefundApproved(order: Order): Promise<void> {
  try {
    if (!order.refundRequest) return;

    console.log(`Refund approved for order ${order.orderId}`);
    console.log(`Refund amount: ${order.currency} ${order.refundRequest.approvedAmount || order.refundRequest.requestedAmount}`);

    // In a real implementation:
    // 1. Process payment back to customer's payment method
    // 2. Update payment gateway records
    // 3. Log the refund in audit trail
    // 4. Send confirmation email

    const updatedOrder: Order = {
      ...order,
      status: "refunded",
      refundStatus: "completed",
    };

    console.log("Refund process initiated:", updatedOrder);
  } catch (error) {
    console.error("Failed to handle refund approval:", error);
  }
}

/**
 * Check and send renewal reminders
 */
export async function checkRenewalReminders(): Promise<void> {
  try {
    const companies = getPurchasedCompanies();
    const today = new Date();

    companies.forEach((company) => {
      const renewalDate = new Date(company.renewalDate);
      const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Send reminder if renewal is within 30 days
      if (daysUntilRenewal > 0 && daysUntilRenewal <= 30) {
        console.log(`Renewal reminder: ${company.name} renews in ${daysUntilRenewal} days`);
        // In a real implementation, trigger notification here
      }

      // Mark as expired if renewal date has passed
      if (daysUntilRenewal <= 0 && company.renewalStatus === "active") {
        const updatedCompany: PurchasedCompanyData = {
          ...company,
          renewalStatus: "expired",
        };
        savePurchasedCompany(updatedCompany);
        console.log(`Company ${company.name} marked as expired`);
      }
    });
  } catch (error) {
    console.error("Failed to check renewal reminders:", error);
  }
}

/**
 * Process order renewal
 */
export async function renewOrder(orderId: string, newRenewalFees: number): Promise<Order | null> {
  try {
    // Create a new order for renewal
    const renewalOrder: Partial<Order> = {
      orderId: `${orderId}-RENEWAL-${Date.now()}`,
      status: "pending-payment" as OrderStatus,
      purchaseDate: new Date().toISOString(),
      renewalDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString(),
      renewalFees: newRenewalFees,
      refundStatus: "none",
      statusHistory: [],
      documents: [],
    };

    console.log("Renewal order created:", renewalOrder);

    // In a real implementation:
    // 1. Create order in Airtable
    // 2. Send renewal notification to customer
    // 3. Update company renewal date

    return renewalOrder as Order;
  } catch (error) {
    console.error("Failed to process renewal:", error);
    return null;
  }
}

/**
 * Sync order with company status
 */
export async function syncOrderWithCompany(order: Order): Promise<void> {
  try {
    const companies = getPurchasedCompanies();
    const company = companies.find((c) => c.id === order.companyId);

    if (!company) return;

    // Map order status to company status
    const statusMap: Record<OrderStatus, string> = {
      "pending-payment": "pending",
      "paid": "active",
      "transfer-form-pending": "pending",
      "under-review": "pending",
      "amend-required": "pending",
      "pending-transfer": "pending",
      "completed": "active",
      "cancelled": "cancelled",
      "refunded": "cancelled",
      "disputed": "disputed",
    };

    const newStatus = statusMap[order.status] || "pending";

    if (company.status !== newStatus) {
      const updatedCompany: PurchasedCompanyData = {
        ...company,
        status: newStatus as "active" | "pending" | "cancelled" | "disputed",
      };

      savePurchasedCompany(updatedCompany);
      console.log(`Company ${company.name} status synced to ${newStatus}`);
    }

    // Update renewal date
    if (order.renewalDate && company.renewalDate !== order.renewalDate) {
      const updatedCompany: PurchasedCompanyData = {
        ...company,
        renewalDate: order.renewalDate,
        renewalFees: order.renewalFees,
      };

      savePurchasedCompany(updatedCompany);
      console.log(`Company ${company.name} renewal date synced`);
    }
  } catch (error) {
    console.error("Failed to sync order with company:", error);
  }
}

/**
 * Get company ownership timeline
 */
export function getCompanyOwnershipTimeline(order: Order): Array<{
  date: string;
  event: string;
  status: OrderStatus;
}> {
  const timeline: Array<{ date: string; event: string; status: OrderStatus }> = [
    {
      date: order.purchaseDate,
      event: "Company purchased",
      status: order.status,
    },
  ];

  if (order.statusHistory && order.statusHistory.length > 0) {
    order.statusHistory.forEach((change) => {
      timeline.push({
        date: change.changedDate,
        event: `Status changed to ${change.toStatus.replace(/-/g, " ")}`,
        status: change.toStatus,
      });
    });
  }

  if (order.status === "completed") {
    timeline.push({
      date: order.lastUpdateDate,
      event: "Ownership transferred",
      status: "completed",
    });
  }

  if (order.status === "refunded" || order.status === "cancelled") {
    timeline.push({
      date: order.lastUpdateDate,
      event: `Order ${order.status}`,
      status: order.status,
    });
  }

  return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Validate order for completion
 */
export function validateOrderForCompletion(order: Order): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Payment must be complete
  if (order.paymentStatus !== "completed") {
    errors.push("Payment must be completed");
  }

  // Transfer form must be submitted (for certain statuses)
  if (!order.transferFormUrl && order.status !== "transfer-form-pending") {
    errors.push("Transfer form must be submitted");
  }

  // Must have required documents
  if (!order.documents || order.documents.length === 0) {
    errors.push("At least one document must be uploaded");
  }

  // Status must be pending transfer
  if (order.status !== "pending-transfer") {
    errors.push("Order must be in pending transfer status");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
