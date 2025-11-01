/**
 * Airtable Synchronization Utility
 * Syncs transfer forms, orders, and related data to Airtable base
 *
 * Airtable Base: https://airtable.com/app0PK34gyJDizR3Q/tbl01DTvrGtsAaPfZ
 * Orders Table: tbl01DTvrGtsAaPfZ
 *
 * Environment Variables Required:
 * - AIRTABLE_API_TOKEN: Your Airtable personal access token
 * - AIRTABLE_BASE_ID: Your base ID (app0PK34gyJDizR3Q)
 * - AIRTABLE_TABLE_FORMS: Table ID for transfer forms
 * - AIRTABLE_TABLE_ORDERS: Table ID for orders (tbl01DTvrGtsAaPfZ)
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
        "Incorporation Date": form.incorporationDate,
        "Incorporation Year": form.incorporationYear,
        "Status": form.status,

        // Company Shares Information
        "Total Shares": form.totalShares,
        "Total Share Capital": form.totalShareCapital,
        "Price per Share": form.pricePerShare,

        // Shareholders Info
        "Number of Shareholders": form.numberOfShareholders,
        "Shareholders": JSON.stringify(form.shareholders),

        // PSC Info
        "Number of PSCs": form.numberOfPSCs,
        "PSC List": JSON.stringify(form.pscList),

        // Company Updates
        "Change Company Name": form.changeCompanyName ? "Yes" : "No",
        "Suggested Names": form.suggestedNames?.join("; ") || "",
        "Change Company Activities": form.changeCompanyActivities ? "Yes" : "No",
        "Company Activities": form.companyActivities?.join("; ") || "",

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
 * Sync transfer form to simplified Transfer Forms table
 * Only syncs core fields: Order Number, Company Name, Company Number, Country, Status, Attachments
 */
export async function syncFormToTransferFormTable(form: TransferFormData): Promise<boolean> {
  try {
    const baseId = process.env.AIRTABLE_BASE_ID || "app0PK34gyJDizR3Q";
    const tableId = process.env.AIRTABLE_TABLE_TRANSFER_FORMS;

    // Debug: Log environment variables
    const airtableVars = Object.keys(process.env).filter(k => k.includes('AIRTABLE'));
    console.log("[syncFormToTransferFormTable] Available AIRTABLE env vars:", airtableVars);
    console.log("[syncFormToTransferFormTable] tableId value:", tableId);
    console.log("[syncFormToTransferFormTable] baseId value:", baseId);

    if (!tableId) {
      console.warn("[syncFormToTransferFormTable] AIRTABLE_TABLE_TRANSFER_FORMS not configured. Available vars:", airtableVars);
      return false;
    }

    // Format date to YYYY-MM-DD format for Airtable date field
    const formatDateForAirtable = (dateString: string): string => {
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch {
        return new Date().toISOString().split('T')[0];
      }
    };

    // Build detailed form summary with all attachments information
    const formSummary = {
      formId: form.formId,
      orderId: form.orderId,
      submittedAt: form.submittedAt || form.createdAt,
      companyInfo: {
        name: form.companyName,
        number: form.companyNumber,
        incorporationDate: form.incorporationDate,
        incorporationYear: form.incorporationYear,
        country: form.country,
      },
      shareInfo: {
        totalShares: form.totalShares,
        totalShareCapital: form.totalShareCapital,
        pricePerShare: form.pricePerShare,
      },
      shareholderCount: form.numberOfShareholders,
      pscCount: form.numberOfPSCs,
      attachmentCount: form.attachments.length,
      attachmentDetails: form.attachments.map(att => ({
        name: att.name,
        type: att.type,
        size: `${(att.size / 1024 / 1024).toFixed(2)} MB`,
        uploadedDate: att.uploadedDate,
        uploadedBy: att.uploadedBy,
      })),
      downloadPDFLink: `${process.env.APP_URL || 'http://localhost:8080'}/api/transfer-forms/${form.id}/pdf`,
    };

    // Create download link for the complete form
    const downloadLink = `${process.env.APP_URL || 'http://localhost:8080'}/api/transfer-forms/${form.id}/pdf`;

    // Build attachments information as text
    const attachmentsInfo = form.attachments.length > 0
      ? `Download Link: ${downloadLink}\n\nClient Attachments:\n${form.attachments.map(att => `- ${att.name} (${att.type}, ${(att.size / 1024 / 1024).toFixed(2)} MB)`).join('\n')}`
      : `Download Link: ${downloadLink}\n\nNo additional client attachments`;

    const airtableRecord: AirtableRecord = {
      fields: {
        "Order Number": form.orderId,
        "Company Name": form.companyName,
        "Company Number": form.companyNumber,
        "Country": form.country,
        "Status": form.status,
        "Form ID": form.formId,
        "Submitted Date": formatDateForAirtable(form.submittedAt || form.createdAt),
        "Attachments": attachmentsInfo,
      },
    };

    const url = `${AIRTABLE_API_URL}/${baseId}/${tableId}`;
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(airtableRecord),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[syncFormToTransferFormTable] Airtable sync failed: Status ${response.status}, Body: ${errorText}`);
      return false;
    }

    console.log(`[syncFormToTransferFormTable] ✓ Form ${form.formId} (Order: ${form.orderId}) synced to Transfer Forms table`);
    return true;
  } catch (error) {
    console.error("[syncFormToTransferFormTable] Error:", error);
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
    const tableId = process.env.AIRTABLE_TABLE_ORDERS || "tbl01DTvrGtsAaPfZ";
    const token = process.env.AIRTABLE_API_TOKEN;

    if (!token) {
      console.warn("AIRTABLE_API_TOKEN not configured. Skipping order sync.");
      return null;
    }

    console.log(`[syncOrderToAirtable] Syncing order ${order.orderId} to Airtable (table: ${tableId})`);

    // Send order data to Airtable using the exact field names from the user's Orders table
    const airtableRecord = {
      fields: {
        // Core Order Fields
        "Order ID": order.orderId,
        "Order Date": order.purchaseDate || new Date().toISOString().split("T")[0],

        // Customer Info
        "Customer Name": order.customerName,
        "Customer Email": order.customerEmail,
        "Customer Phone": order.customerPhone || "",
        "Billing Address": order.billingAddress || "",
        "Country": order.country,

        // Company Info
        "Company ID": order.companyId,
        "Company Name": order.companyName,
        "Company Number": order.companyNumber,

        // Payment Info
        "Payment Method": order.paymentMethod,
        "Payment Status": order.paymentStatus,
        "Transaction ID": order.transactionId || "",
        "Amount": order.amount,
        "Currency": order.currency,

        // Order Status
        "Status": order.status,
        "Status Changed Date": order.statusChangedDate || new Date().toISOString().split("T")[0],
        "Status History": JSON.stringify(order.statusHistory || []),

        // Renewal
        "Renewal Date": order.renewalDate || "",
        "Renewal Fees": order.renewalFees || 0,

        // Refund Info
        "Refund Status": order.refundStatus,
        "Refund Request": order.refundRequest ? JSON.stringify(order.refundRequest) : "",

        // Documents & Transfer Form
        "Documents": JSON.stringify(order.documents || []),
        "Transfer Form URL": order.transferFormUrl || "",

        // Admin & Internal Notes
        "Admin Notes": order.adminNotes || "",
        "Internal Notes": order.internalNotes || "",

        // Metadata
        "Created At": order.createdAt || new Date().toISOString().split("T")[0],
        "Updated At": order.updatedAt || new Date().toISOString().split("T")[0],
        "Created By": order.createdBy || "website",
        "Updated By": order.updatedBy || "website",
      },
    };

    const url = airtableRecordId
      ? `${AIRTABLE_API_URL}/${baseId}/${tableId}/${airtableRecordId}`
      : `${AIRTABLE_API_URL}/${baseId}/${tableId}`;

    console.log(`[syncOrderToAirtable] Request URL: ${url}`);
    console.log(`[syncOrderToAirtable] Fields to sync: ${Object.keys(airtableRecord.fields).join(", ")}`);

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
      console.error(
        `[syncOrderToAirtable] FAILED - Status ${response.status}:`,
        "Error:",
        JSON.stringify(errorData)
      );
      console.error(
        `[syncOrderToAirtable] Details - Order: ${order.orderId}, Table: ${tableId}`
      );
      console.error(
        `[syncOrderToAirtable] Fields attempted: ${Object.keys(airtableRecord.fields).join(", ")}`
      );

      // If it's an invalid field error, log helpful message
      if (errorData?.error?.type === "INVALID_REQUEST_UNKNOWN") {
        console.error(
          `[syncOrderToAirtable] ⚠️ HINT: One or more field names don't exist in Airtable table ${tableId}`
        );
        console.error(
          `[syncOrderToAirtable] Please verify these fields exist in your Airtable Orders table`
        );
      }

      return null;
    }

    const data = await response.json();
    const recordId = data.id || airtableRecordId;
    console.log(`[syncOrderToAirtable] ✓ Order ${order.orderId} synced to Airtable (ID: ${recordId}) - ${airtableRecordId ? "updated" : "created"}`);
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
    const tableId = process.env.AIRTABLE_TABLE_ORDERS || "tbl01DTvrGtsAaPfZ";
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
      const now = new Date().toISOString();

      // Helper to safely parse JSON
      const parseJSON = (value: any, defaultValue: any = null) => {
        if (!value) return defaultValue;
        try {
          return JSON.parse(String(value));
        } catch {
          return defaultValue;
        }
      };

      return {
        id: record.id,

        // Core Order Fields
        orderId: fields["Order ID"] || "",
        purchaseDate: fields["Order Date"] || now,

        // Customer Info
        customerName: fields["Customer Name"] || "",
        customerEmail: fields["Customer Email"] || "",
        customerPhone: fields["Customer Phone"] || "",
        billingAddress: fields["Billing Address"] || "",
        country: fields["Country"] || "",

        // Company Info
        companyId: fields["Company ID"] || "",
        companyName: fields["Company Name"] || "",
        companyNumber: fields["Company Number"] || "",

        // Payment Info
        paymentMethod: fields["Payment Method"] || "credit_card",
        paymentStatus: fields["Payment Status"] || "pending",
        transactionId: fields["Transaction ID"] || "",
        amount: fields["Amount"] ? parseFloat(String(fields["Amount"])) : 0,
        currency: fields["Currency"] || "USD",
        paymentDate: fields["Order Date"] || now,

        // Order Status
        status: fields["Status"] || "pending-payment",
        statusChangedDate: fields["Status Changed Date"] || new Date().toISOString().split("T")[0],
        statusHistory: parseJSON(fields["Status History"], []),

        // Dates
        lastUpdateDate: fields["Updated At"] || now,

        // Renewal
        renewalDate: fields["Renewal Date"] || "",
        renewalFees: fields["Renewal Fees"] ? parseFloat(String(fields["Renewal Fees"])) : 0,

        // Refund Info
        refundStatus: fields["Refund Status"] || "none",
        refundRequest: parseJSON(fields["Refund Request"]),

        // Documents & Transfer Form
        documents: parseJSON(fields["Documents"], []),
        transferFormUrl: fields["Transfer Form URL"] || "",

        // Admin & Internal Notes
        adminNotes: fields["Admin Notes"] || "",
        internalNotes: fields["Internal Notes"] || "",

        // Metadata
        createdAt: fields["Created At"] || now,
        updatedAt: fields["Updated At"] || now,
        createdBy: fields["Created By"] || "airtable",
        updatedBy: fields["Updated By"] || "airtable",
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
    const tableId = process.env.AIRTABLE_TABLE_ORDERS || "tbl01DTvrGtsAaPfZ";
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
          "Status": newStatus,
          "Status Changed Date": updatedAt || new Date().toISOString().split("T")[0],
          "Updated At": updatedAt || new Date().toISOString().split("T")[0],
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
