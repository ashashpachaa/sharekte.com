/**
 * Airtable Synchronization Utility
 * Syncs transfer forms, orders, and related data to Airtable base
 *
 * Airtable Base: https://airtable.com/app0PK34gyJDizR3Q/tblXvZ0kjl7p7h9Jq
 * Orders Table: tblXvZ0kjl7p7h9Jq
 *
 * Environment Variables Required:
 * - AIRTABLE_API_TOKEN: Your Airtable personal access token
 * - AIRTABLE_BASE_ID: Your base ID (app0PK34gyJDizR3Q)
 * - AIRTABLE_TABLE_FORMS: Table ID for transfer forms
 * - AIRTABLE_TABLE_ORDERS: Table ID for orders (tblXvZ0kjl7p7h9Jq)
 */

import { TransferFormData, FormStatus } from "../../client/lib/transfer-form";
import { Order } from "../../client/lib/orders";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

// Get API headers
function getHeaders(): HeadersInit {
  const token = process.env.AIRTABLE_API_TOKEN;
  if (!token) {
    console.warn("AIRTABLE_API_TOKEN not configured. Airtable sync disabled.");
    return {
      "Content-Type": "application/json",
    };
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

interface AirtableRecord {
  fields: Record<string, any>;
}

/**
 * Sync transfer form to Airtable
 */
export async function syncFormToAirtable(form: TransferFormData): Promise<boolean> {
  try {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_TABLE_FORMS;

    if (!baseId || !tableId) {
      console.warn("Airtable configuration incomplete. Skipping sync.");
      return false;
    }

    const airtableRecord: AirtableRecord = {
      fields: {
        "Form ID": form.formId,
        "Order ID": form.orderId,
        "Company ID": form.companyId,
        "Company Name": form.companyName,
        "Company Number": form.companyNumber,
        "Status": form.status,
        
        // Seller Info
        "Seller Name": form.sellerName,
        "Seller Email": form.sellerEmail,
        "Seller Phone": form.sellerPhone,
        "Seller Address": form.sellerAddress,
        "Seller City": form.sellerCity,
        "Seller Country": form.sellerCountry,
        
        // Buyer Info
        "Buyer Name": form.buyerName,
        "Buyer Email": form.buyerEmail,
        "Buyer Phone": form.buyerPhone,
        "Buyer Address": form.buyerAddress,
        "Buyer City": form.buyerCity,
        "Buyer Country": form.buyerCountry,
        
        // Company Details
        "Company Type": form.companyType,
        "Incorporation Date": form.incorporationDate,
        "Business Description": form.businessDescription,
        "Transfer Reason": form.transferReason,
        "Transfer Date": form.transferDate,
        "Sale Price": form.salePrice,
        "Currency": form.currency,
        
        // Status Info
        "Created At": form.createdAt,
        "Updated At": form.updatedAt,
        "Submitted At": form.submittedAt,
        "Completed At": form.completedAt,
        
        // Admin Info
        "Assigned To": form.assignedTo,
        "Reviewed By": form.reviewedBy,
        "Amendments Required Count": form.amendmentsRequiredCount,
        "Admin Notes": form.adminNotes,
        
        // Attachments
        "Attachment Count": form.attachments.length,
        "Attachments": form.attachments
          .map((a) => `${a.name} (${(a.size / 1024 / 1024).toFixed(2)} MB)`)
          .join("; "),
        
        // Comments
        "Comment Count": form.comments.length,
      },
    };

    const url = `${AIRTABLE_API_URL}/${baseId}/${tableId}`;
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(airtableRecord),
    });

    if (!response.ok) {
      console.error("Airtable sync failed:", response.statusText);
      return false;
    }

    console.log(`Form ${form.formId} synced to Airtable`);
    return true;
  } catch (error) {
    console.error("Airtable sync error:", error);
    return false;
  }
}

/**
 * Update form status in Airtable
 */
export async function updateFormStatusInAirtable(
  formId: string,
  airtableRecordId: string,
  newStatus: FormStatus,
  updatedAt: string
): Promise<boolean> {
  try {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_TABLE_FORMS;

    if (!baseId || !tableId) {
      console.warn("Airtable configuration incomplete. Skipping update.");
      return false;
    }

    const url = `${AIRTABLE_API_URL}/${baseId}/${tableId}/${airtableRecordId}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        fields: {
          "Status": newStatus,
          "Updated At": updatedAt,
        },
      }),
    });

    if (!response.ok) {
      console.error("Airtable update failed:", response.statusText);
      return false;
    }

    console.log(`Form ${formId} status updated in Airtable`);
    return true;
  } catch (error) {
    console.error("Airtable update error:", error);
    return false;
  }
}

/**
 * Fetch forms from Airtable
 */
export async function fetchFormsFromAirtable(): Promise<TransferFormData[]> {
  try {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_TABLE_FORMS;

    if (!baseId || !tableId) {
      console.warn("Airtable configuration incomplete. Cannot fetch forms.");
      return [];
    }

    const url = `${AIRTABLE_API_URL}/${baseId}/${tableId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      console.error("Airtable fetch failed:", response.statusText);
      return [];
    }

    const data = await response.json();
    const forms: TransferFormData[] = data.records.map((record: any) => ({
      id: record.id,
      formId: record.fields["Form ID"],
      orderId: record.fields["Order ID"],
      companyId: record.fields["Company ID"],
      companyName: record.fields["Company Name"],
      companyNumber: record.fields["Company Number"],
      // ... map other fields
      status: record.fields["Status"],
      createdAt: record.fields["Created At"],
      updatedAt: record.fields["Updated At"],
    }));

    console.log(`Fetched ${forms.length} forms from Airtable`);
    return forms;
  } catch (error) {
    console.error("Airtable fetch error:", error);
    return [];
  }
}

/**
 * Sync order completion to Airtable
 */
export async function syncOrderCompletion(
  orderId: string,
  airtableOrderRecordId: string,
  formId: string,
  buyerName: string,
  buyerEmail: string
): Promise<boolean> {
  try {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_TABLE_ORDERS;

    if (!baseId || !tableId) {
      console.warn("Airtable configuration incomplete. Skipping order sync.");
      return false;
    }

    const url = `${AIRTABLE_API_URL}/${baseId}/${tableId}/${airtableOrderRecordId}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        fields: {
          "Form ID": formId,
          "Transfer Status": "Form Submitted",
          "Buyer Confirmed": buyerName,
          "Last Updated": new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      console.error("Airtable order sync failed:", response.statusText);
      return false;
    }

    console.log(`Order ${orderId} synced to Airtable`);
    return true;
  } catch (error) {
    console.error("Airtable order sync error:", error);
    return false;
  }
}

/**
 * Configuration Status
 * Returns whether Airtable is properly configured
 */
export function isAirtableConfigured(): boolean {
  return !!(
    process.env.AIRTABLE_API_TOKEN &&
    process.env.AIRTABLE_BASE_ID &&
    (process.env.AIRTABLE_TABLE_FORMS || process.env.AIRTABLE_TABLE_ORDERS)
  );
}

/**
 * Get Airtable Configuration Info
 * Returns info about current Airtable configuration
 */
export function getAirtableConfig(): {
  configured: boolean;
  baseId?: string;
  hasToken: boolean;
  tables: {
    forms?: string;
    orders?: string;
  };
} {
  return {
    configured: isAirtableConfigured(),
    baseId: process.env.AIRTABLE_BASE_ID,
    hasToken: !!process.env.AIRTABLE_API_TOKEN,
    tables: {
      forms: process.env.AIRTABLE_TABLE_FORMS,
      orders: process.env.AIRTABLE_TABLE_ORDERS,
    },
  };
}

/**
 * Sync order to Airtable (create or update)
 */
export async function syncOrderToAirtable(order: Order, airtableRecordId?: string): Promise<string | null> {
  try {
    const baseId = process.env.AIRTABLE_BASE_ID || "app0PK34gyJDizR3Q";
    const tableId = process.env.AIRTABLE_TABLE_ORDERS || "tblXvZ0kjl7p7h9Jq";
    const token = process.env.AIRTABLE_API_TOKEN;

    if (!token) {
      console.warn("AIRTABLE_API_TOKEN not configured. Skipping order sync.");
      return null;
    }

    console.log(`[syncOrderToAirtable] Syncing order ${order.orderId} to Airtable (table: ${tableId})`);

    const airtableRecord = {
      fields: {
        "Order ID": order.orderId,
        "Order date": order.purchaseDate,
        "Country": order.country,
        "Company name": order.companyName,
        "Company numbers": order.companyNumber,
        "Statues": order.status,
        "Customer name": order.customerName,
        "Customer Email": order.customerEmail,
        "Customer Mobile number": order.customerPhone || "",
        "price": order.amount,
        "currency": order.currency,
        "Payment Status": order.paymentStatus,
        "Payment Method": order.paymentMethod,
        "Transaction ID": order.transactionId || "",
        "Renewal Date": order.renewalDate,
        "Renewal Fees": order.renewalFees,
        "Refund Status": order.refundStatus,
        "Billing Address": order.billingAddress || "",
        "Company ID": order.companyId,
        "Last Update Date": order.lastUpdateDate,
        "Status History": JSON.stringify(order.statusHistory || []),
        "Documents": JSON.stringify(order.documents || []),
        "Admin Notes": order.adminNotes || "",
        "Internal Notes": order.internalNotes || "",
        "Created At": order.createdAt,
        "Updated At": order.updatedAt,
      },
    };

    const url = airtableRecordId
      ? `${AIRTABLE_API_URL}/${baseId}/${tableId}/${airtableRecordId}`
      : `${AIRTABLE_API_URL}/${baseId}/${tableId}`;

    const response = await fetch(url, {
      method: airtableRecordId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(airtableRecord),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error("Airtable order sync failed:", errorData);
      return null;
    }

    const data = await response.json();
    const recordId = data.id || airtableRecordId;
    console.log(`Order ${order.orderId} synced to Airtable (${airtableRecordId ? "updated" : "created"})`);
    return recordId;
  } catch (error) {
    console.error("Airtable order sync error:", error);
    return null;
  }
}

/**
 * Fetch orders from Airtable
 */
export async function fetchOrdersFromAirtable(): Promise<Order[]> {
  try {
    const baseId = process.env.AIRTABLE_BASE_ID || "app0PK34gyJDizR3Q";
    const tableId = process.env.AIRTABLE_TABLE_ORDERS || "tblXvZ0kjl7p7h9Jq";
    const token = process.env.AIRTABLE_API_TOKEN;

    if (!token) {
      console.warn("AIRTABLE_API_TOKEN not configured. Cannot fetch orders from Airtable.");
      return [];
    }

    const url = `${AIRTABLE_API_URL}/${baseId}/${tableId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`Airtable fetch failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const orders: Order[] = data.records.map((record: any) => {
      const fields = record.fields;
      return {
        id: record.id,
        orderId: fields["Order ID"] || "",
        customerName: fields["Customer name"] || "",
        customerEmail: fields["Customer Email"] || "",
        customerPhone: fields["Customer Mobile number"] || "",
        billingAddress: fields["Billing Address"] || "",
        country: fields["Country"] || "",
        companyId: fields["Company ID"] || "",
        companyName: fields["Company name"] || "",
        companyNumber: fields["Company numbers"] || "",
        paymentMethod: fields["Payment Method"] || "credit_card",
        paymentStatus: fields["Payment Status"] || "pending",
        transactionId: fields["Transaction ID"] || "",
        amount: fields.price || 0,
        currency: fields.currency || "USD",
        paymentDate: fields["Order date"] || "",
        status: fields["Statues"] || "pending-payment",
        statusChangedDate: fields["Last Update Date"] || new Date().toISOString().split("T")[0],
        statusHistory: fields["Status History"] ? JSON.parse(fields["Status History"]) : [],
        purchaseDate: fields["Order date"] || "",
        lastUpdateDate: fields["Last Update Date"] || "",
        renewalDate: fields["Renewal Date"] || "",
        renewalFees: fields["Renewal Fees"] || 0,
        refundStatus: fields["Refund Status"] || "none",
        refundRequest: undefined,
        documents: fields.Documents ? JSON.parse(fields.Documents) : [],
        transferFormUrl: "",
        adminNotes: fields["Admin Notes"] || "",
        internalNotes: fields["Internal Notes"] || "",
        createdAt: fields["Created At"] || "",
        updatedAt: fields["Updated At"] || "",
        createdBy: "airtable",
        updatedBy: "airtable",
        airtableId: record.id,
      } as Order;
    });

    console.log(`Fetched ${orders.length} orders from Airtable`);
    return orders;
  } catch (error) {
    console.error("Airtable fetch orders error:", error);
    return [];
  }
}

/**
 * Update order status in Airtable
 */
export async function updateOrderStatusInAirtable(
  airtableRecordId: string,
  newStatus: string,
  updatedAt: string
): Promise<boolean> {
  try {
    const baseId = process.env.AIRTABLE_BASE_ID || "app0PK34gyJDizR3Q";
    const tableId = process.env.AIRTABLE_TABLE_ORDERS || "tblXvZ0kjl7p7h9Jq";
    const token = process.env.AIRTABLE_API_TOKEN;

    if (!token) {
      console.warn("AIRTABLE_API_TOKEN not configured. Skipping status update.");
      return false;
    }

    const url = `${AIRTABLE_API_URL}/${baseId}/${tableId}/${airtableRecordId}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fields: {
          "Statues": newStatus,
          "Last Update Date": updatedAt,
        },
      }),
    });

    if (!response.ok) {
      console.error("Airtable status update failed:", response.statusText);
      return false;
    }

    console.log(`Order status updated in Airtable: ${newStatus}`);
    return true;
  } catch (error) {
    console.error("Airtable status update error:", error);
    return false;
  }
}
