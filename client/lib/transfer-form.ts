/**
 * Transfer Form Management System
 * Handles company ownership transfer forms with attachments, status tracking, and notifications
 */

export type FormStatus = 
  | "under-review"
  | "amend-required"
  | "confirm-application"
  | "transferring"
  | "complete-transfer"
  | "canceled";

export interface FormAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  uploadedDate: string;
  uploadedBy: string;
}

export interface FormComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  isAdminOnly: boolean;
}

export interface TransferFormData {
  id: string;
  formId: string;
  orderId: string;
  companyId: string;
  companyName: string;
  companyNumber: string;
  
  // Seller Information
  sellerName: string;
  sellerEmail: string;
  sellerPhone?: string;
  sellerAddress: string;
  sellerCity: string;
  sellerState: string;
  sellerPostalCode: string;
  sellerCountry: string;
  
  // Buyer Information
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerAddress: string;
  buyerCity: string;
  buyerState: string;
  buyerPostalCode: string;
  buyerCountry: string;
  
  // Directors/Shareholders Information
  directors: DirectorInfo[];
  shareholders: ShareholderInfo[];
  
  // Company Details
  companyType: string;
  incorporationDate: string;
  businessDescription: string;
  
  // Transfer Details
  transferReason: string;
  transferDate: string;
  salePrice?: number;
  currency?: string;
  
  // Form Status & Tracking
  status: FormStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  completedAt?: string;
  
  // Admin Data
  assignedTo?: string;
  assignedDate?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  amendmentsRequiredCount: number;
  lastAmendmentDate?: string;
  
  // Attachments & Documents
  attachments: FormAttachment[];
  
  // Comments & Notes
  comments: FormComment[];
  adminNotes?: string;
  
  // Audit Trail
  statusHistory: FormStatusChange[];
}

export interface DirectorInfo {
  id: string;
  name: string;
  dateOfBirth?: string;
  nationality: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  email?: string;
  phone?: string;
  appointmentDate?: string;
}

export interface ShareholderInfo {
  id: string;
  name: string;
  shareholderType: "individual" | "corporate";
  nationality?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  sharesPercentage: number;
  email?: string;
  phone?: string;
}

export interface FormStatusChange {
  id: string;
  fromStatus: FormStatus;
  toStatus: FormStatus;
  changedDate: string;
  changedBy: string;
  reason?: string;
  notes?: string;
}

// Status colors for UI
export const FORM_STATUS_COLORS: Record<FormStatus, string> = {
  "under-review": "bg-blue-100 text-blue-800",
  "amend-required": "bg-yellow-100 text-yellow-800",
  "confirm-application": "bg-purple-100 text-purple-800",
  "transferring": "bg-orange-100 text-orange-800",
  "complete-transfer": "bg-green-100 text-green-800",
  "canceled": "bg-red-100 text-red-800",
};

export const FORM_STATUS_LABELS: Record<FormStatus, string> = {
  "under-review": "Under Review",
  "amend-required": "Amend Required",
  "confirm-application": "Confirm Application",
  "transferring": "Transferring",
  "complete-transfer": "Complete Transfer",
  "canceled": "Canceled",
};

export const FORM_STATUS_ICONS: Record<FormStatus, string> = {
  "under-review": "👀",
  "amend-required": "🔄",
  "confirm-application": "📝",
  "transferring": "🚚",
  "complete-transfer": "🎉",
  "canceled": "❌",
};

// Create a new empty form
export function createEmptyForm(orderId: string, companyId: string, companyName: string, companyNumber: string): TransferFormData {
  return {
    id: `form_${Date.now()}`,
    formId: `FORM-${Date.now()}`,
    orderId,
    companyId,
    companyName,
    companyNumber,
    
    sellerName: "",
    sellerEmail: "",
    sellerPhone: "",
    sellerAddress: "",
    sellerCity: "",
    sellerState: "",
    sellerPostalCode: "",
    sellerCountry: "",
    
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    buyerAddress: "",
    buyerCity: "",
    buyerState: "",
    buyerPostalCode: "",
    buyerCountry: "",
    
    directors: [],
    shareholders: [],
    
    companyType: "",
    incorporationDate: "",
    businessDescription: "",
    
    transferReason: "",
    transferDate: new Date().toISOString().split("T")[0],
    salePrice: undefined,
    currency: "USD",
    
    status: "under-review",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    amendmentsRequiredCount: 0,
    attachments: [],
    comments: [],
    statusHistory: [],
  };
}

// API Functions
export async function fetchTransferForms(orderId?: string): Promise<TransferFormData[]> {
  try {
    const url = orderId ? `/api/transfer-forms?orderId=${orderId}` : "/api/transfer-forms";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch forms");
    return await response.json();
  } catch (error) {
    console.error("Error fetching forms:", error);
    return [];
  }
}

export async function getTransferForm(formId: string): Promise<TransferFormData | null> {
  try {
    const response = await fetch(`/api/transfer-forms/${formId}`);
    if (!response.ok) throw new Error("Failed to fetch form");
    return await response.json();
  } catch (error) {
    console.error("Error fetching form:", error);
    return null;
  }
}

export async function createTransferForm(form: Omit<TransferFormData, "id" | "createdAt" | "updatedAt">): Promise<TransferFormData | null> {
  try {
    const response = await fetch("/api/transfer-forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!response.ok) throw new Error("Failed to create form");
    return await response.json();
  } catch (error) {
    console.error("Error creating form:", error);
    return null;
  }
}

export async function updateTransferForm(
  formId: string,
  updates: Partial<TransferFormData>
): Promise<TransferFormData | null> {
  try {
    const response = await fetch(`/api/transfer-forms/${formId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update form");
    return await response.json();
  } catch (error) {
    console.error("Error updating form:", error);
    return null;
  }
}

export async function updateFormStatus(
  formId: string,
  newStatus: FormStatus,
  notes?: string,
  reason?: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/transfer-forms/${formId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, notes, reason }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error updating form status:", error);
    return false;
  }
}

export async function uploadFormAttachment(
  formId: string,
  file: File
): Promise<FormAttachment | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("formId", formId);
    
    const response = await fetch("/api/transfer-forms/attachments/upload", {
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

export async function deleteFormAttachment(formId: string, attachmentId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/transfer-forms/${formId}/attachments/${attachmentId}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return false;
  }
}

export async function addFormComment(
  formId: string,
  text: string,
  isAdminOnly: boolean = false
): Promise<FormComment | null> {
  try {
    const response = await fetch(`/api/transfer-forms/${formId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, isAdminOnly }),
    });
    if (!response.ok) throw new Error("Failed to add comment");
    return await response.json();
  } catch (error) {
    console.error("Error adding comment:", error);
    return null;
  }
}

export async function generateFormPDF(formId: string): Promise<Blob | null> {
  try {
    const response = await fetch(`/api/transfer-forms/${formId}/pdf`, {
      method: "GET",
    });
    if (!response.ok) throw new Error("Failed to generate PDF");
    return await response.blob();
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
}

export async function downloadFormPDF(formId: string): Promise<void> {
  const blob = await generateFormPDF(formId);
  if (blob) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transfer-form-${formId}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}

// Helper functions
export function formatFormStatus(status: FormStatus): string {
  return FORM_STATUS_LABELS[status];
}

export function getFormStatusColor(status: FormStatus): string {
  return FORM_STATUS_COLORS[status];
}

export function getFormStatusIcon(status: FormStatus): string {
  return FORM_STATUS_ICONS[status];
}

export function isFormEditable(status: FormStatus): boolean {
  return ["under-review", "amend-required"].includes(status);
}

export function canChangeStatus(currentStatus: FormStatus, newStatus: FormStatus): boolean {
  const transitions: Record<FormStatus, FormStatus[]> = {
    "under-review": ["amend-required", "confirm-application", "canceled"],
    "amend-required": ["under-review", "canceled"],
    "confirm-application": ["transferring", "canceled"],
    "transferring": ["complete-transfer", "canceled"],
    "complete-transfer": [],
    "canceled": ["under-review"],
  };
  
  return transitions[currentStatus]?.includes(newStatus) ?? false;
}

export function getAvailableStatusTransitions(currentStatus: FormStatus): FormStatus[] {
  const transitions: Record<FormStatus, FormStatus[]> = {
    "under-review": ["amend-required", "confirm-application", "canceled"],
    "amend-required": ["under-review", "canceled"],
    "confirm-application": ["transferring", "canceled"],
    "transferring": ["complete-transfer", "canceled"],
    "complete-transfer": [],
    "canceled": ["under-review"],
  };
  
  return transitions[currentStatus] ?? [];
}
