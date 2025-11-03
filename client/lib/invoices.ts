/**
 * Invoice Management Library
 * Handles all invoice-related types, utilities, and API operations
 */

import { getAPIBaseURL } from "@/lib/transfer-form";

export type InvoiceStatus = "pending" | "paid" | "overdue" | "refunded" | "partial";
export type PaymentMethod = "stripe" | "wise" | "manual" | "bank_transfer" | "paypal";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedDate: string;
  url?: string;
}

export interface InvoiceStatusChange {
  id: string;
  fromStatus: InvoiceStatus;
  toStatus: InvoiceStatus;
  changedDate: string;
  changedBy: string;
  reason?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  
  // Client Info
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  billingAddress?: string;
  clientCountry?: string;
  
  // Company Info
  companyId: string;
  companyName: string;
  companyNumber: string;
  
  // Order Info
  orderId?: string;
  
  // Invoice Details
  invoiceDate: string;
  dueDate: string;
  amount: number;
  currency: string;
  description?: string;
  
  // Line Items
  lineItems: InvoiceLineItem[];
  
  // Fees & Taxes
  subtotal?: number;
  taxAmount?: number;
  taxRate?: number;
  discountAmount?: number;
  customFee?: number;
  customFeeDescription?: string;
  
  // Payment Info
  paymentMethod?: PaymentMethod;
  status: InvoiceStatus;
  paidDate?: string;
  paidAmount?: number;
  transactionId?: string;
  
  // Attachments & Notes
  attachments: InvoiceAttachment[];
  adminNotes?: string;
  internalNotes?: string;
  
  // Dates
  createdDate: string;
  lastUpdateDate: string;
  
  // Status History
  statusHistory: InvoiceStatusChange[];
  
  // Metadata
  createdBy?: string;
  updatedBy?: string;
  sentCount?: number;
  lastSentDate?: string;
}

export interface InvoiceFilter {
  status?: InvoiceStatus | "all";
  paymentMethod?: PaymentMethod | "all";
  dateFrom?: string;
  dateTo?: string;
  clientName?: string;
  companyName?: string;
  invoiceNumber?: string;
  countryCode?: string;
}

export interface InvoiceSort {
  field: "invoiceNumber" | "invoiceDate" | "dueDate" | "amount" | "status";
  direction: "asc" | "desc";
}

// Status colors for UI
export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
  partial: "bg-blue-100 text-blue-800",
};

// Status labels
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  refunded: "Refunded",
  partial: "Partial",
};

// Payment method labels
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  stripe: "Stripe",
  wise: "Wise",
  manual: "Manual",
  bank_transfer: "Bank Transfer",
  paypal: "PayPal",
};

// Check if invoice is overdue
export function isInvoiceOverdue(invoice: Invoice): boolean {
  if (invoice.status === "paid" || invoice.status === "refunded") {
    return false;
  }
  return new Date(invoice.dueDate) < new Date() && invoice.status === "pending";
}

// Get invoice display status
export function getInvoiceDisplayStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.status === "paid" || invoice.status === "refunded") {
    return invoice.status;
  }
  if (isInvoiceOverdue(invoice)) {
    return "overdue";
  }
  return invoice.status;
}

// Format date for display
export function formatInvoiceDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr || "N/A";
  }
}

// Format currency
export function formatInvoiceAmount(amount: number, currency: string = "GBP"): string {
  try {
    if (!Number.isFinite(amount)) {
      return `£0.00`;
    }
    const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "€";
    return `${symbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } catch {
    return `£0.00`;
  }
}

// Calculate invoice summary
export function getInvoiceSummary(invoice: Invoice): {
  subtotal: number;
  taxes: number;
  discount: number;
  fees: number;
  total: number;
} {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxes = invoice.taxAmount || 0;
  const discount = invoice.discountAmount || 0;
  const fees = invoice.customFee || 0;
  const total = subtotal + taxes + fees - discount;

  return { subtotal, taxes, discount, fees, total };
}

// Validate invoice before saving
export function validateInvoice(invoice: Partial<Invoice>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!invoice.invoiceNumber?.trim()) {
    errors.push("Invoice number is required");
  }
  if (!invoice.clientName?.trim()) {
    errors.push("Client name is required");
  }
  if (!invoice.clientEmail?.trim()) {
    errors.push("Client email is required");
  }
  if (!invoice.companyName?.trim()) {
    errors.push("Company name is required");
  }
  if (!invoice.invoiceDate) {
    errors.push("Invoice date is required");
  }
  if (!invoice.dueDate) {
    errors.push("Due date is required");
  }
  if (!invoice.amount || invoice.amount <= 0) {
    errors.push("Invoice amount must be greater than 0");
  }
  if (!invoice.lineItems || invoice.lineItems.length === 0) {
    errors.push("At least one line item is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// API Functions

export async function getAllInvoices(filters?: InvoiceFilter): Promise<Invoice[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== "all") params.append("status", filters.status);
    if (filters?.paymentMethod && filters.paymentMethod !== "all") params.append("paymentMethod", filters.paymentMethod);
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);
    if (filters?.clientName) params.append("clientName", filters.clientName);
    if (filters?.companyName) params.append("companyName", filters.companyName);
    if (filters?.invoiceNumber) params.append("invoiceNumber", filters.invoiceNumber);

    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/invoices?${params}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to fetch invoices");
    return await response.json();
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/invoices/${invoiceId}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to fetch invoice");
    return await response.json();
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return null;
  }
}

export async function createInvoice(invoice: Omit<Invoice, "id" | "createdDate" | "lastUpdateDate" | "statusHistory">): Promise<Invoice | null> {
  try {
    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoice),
    });

    if (!response.ok) throw new Error("Failed to create invoice");
    return await response.json();
  } catch (error) {
    console.error("Error creating invoice:", error);
    return null;
  }
}

export async function updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice | null> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) throw new Error("Failed to update invoice");
    return await response.json();
  } catch (error) {
    console.error("Error updating invoice:", error);
    return null;
  }
}

export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus, reason?: string): Promise<Invoice | null> {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });

    if (!response.ok) throw new Error("Failed to update invoice status");
    return await response.json();
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return null;
  }
}

export async function deleteInvoice(invoiceId: string): Promise<boolean> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/invoices/${invoiceId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to delete invoice");
    return true;
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return false;
  }
}

export async function uploadInvoiceAttachment(invoiceId: string, file: File): Promise<InvoiceAttachment | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/invoices/${invoiceId}/attachments`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to upload attachment");
    return await response.json();
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return null;
  }
}

export async function deleteInvoiceAttachment(invoiceId: string, attachmentId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/attachments/${attachmentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to delete attachment");
    return true;
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return false;
  }
}

export async function sendInvoiceEmail(invoiceId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to send invoice");
    return true;
  } catch (error) {
    console.error("Error sending invoice:", error);
    return false;
  }
}

export async function downloadInvoicePDF(invoiceId: string): Promise<Blob | null> {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to download PDF");
    return await response.blob();
  } catch (error) {
    console.error("Error downloading PDF:", error);
    return null;
  }
}

export async function bulkUpdateInvoiceStatus(invoiceIds: string[], status: InvoiceStatus): Promise<boolean> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/invoices/bulk/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceIds, status }),
    });

    if (!response.ok) throw new Error("Failed to bulk update invoices");
    return true;
  } catch (error) {
    console.error("Error in bulk update:", error);
    return false;
  }
}

export async function bulkSendEmails(invoiceIds: string[]): Promise<boolean> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/invoices/bulk/send-emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceIds }),
    });

    if (!response.ok) throw new Error("Failed to send emails");
    return true;
  } catch (error) {
    console.error("Error sending bulk emails:", error);
    return false;
  }
}

export async function exportInvoicesToCSV(filters?: InvoiceFilter): Promise<Blob | null> {
  try {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== "all") params.append("status", filters.status);
    if (filters?.paymentMethod && filters.paymentMethod !== "all") params.append("paymentMethod", filters.paymentMethod);
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);

    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/invoices/export/csv?${params}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to export CSV");
    return await response.blob();
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return null;
  }
}

export async function getInvoiceStatistics(): Promise<{
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  byStatus: Record<InvoiceStatus, number>;
  byPaymentMethod: Record<PaymentMethod, number>;
}> {
  try {
    const response = await fetch("/api/invoices/analytics/summary", {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to fetch statistics");
    return await response.json();
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return {
      totalInvoices: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      byStatus: { pending: 0, paid: 0, overdue: 0, refunded: 0, partial: 0 },
      byPaymentMethod: {
        stripe: 0,
        wise: 0,
        manual: 0,
        bank_transfer: 0,
        paypal: 0,
      },
    };
  }
}
