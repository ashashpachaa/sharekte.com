/**
 * Transfer Form Management System
 * Handles company ownership transfer forms with attachments, status tracking, and notifications
 */

// Get the correct API base URL (supports localhost, Fly.io, and Hostinger)
export function getAPIBaseURL(): string {
  // Server-side: use Hostinger production URL
  if (typeof window === "undefined") return "https://shareket.com";

  const hostname = window.location.hostname;

  // Development & All Production: Use relative paths on same domain
  // This works for: localhost, Fly.io, Hostinger, and any other deployment
  // because API endpoints are served on the same domain as the frontend
  return "";
}

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
  data?: string;
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
  country: string;
  incorporationDate: string;
  incorporationYear: number;

  // Seller Information
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  sellerAddress?: string;

  // Buyer Information
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;

  // Company Shares Information
  totalShares: number;
  totalShareCapital: number;
  pricePerShare: number;

  // Shareholders Information
  shareholders: ShareholderInfo[];
  numberOfShareholders: number;

  // PSC Information
  pscList: PSCInfo[];
  numberOfPSCs: number;

  // Company Update Section
  changeCompanyName: boolean;
  suggestedNames?: string[];
  changeCompanyActivities: boolean;
  companyActivities?: string[];

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
  nationality: string;
  address: string;
  city: string;
  country: string;
  shareholderPercentage: number;
  shares: number;
  amount: number;
}

export interface PSCInfo {
  id: string;
  shareholderId: string;
  shareholderName: string;
  nationality: string;
  address: string;
  city: string;
  country: string;
  levelOfControl: string[];
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
  transferring: "bg-orange-100 text-orange-800",
  "complete-transfer": "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
};

export const FORM_STATUS_LABELS: Record<FormStatus, string> = {
  "under-review": "Under Review",
  "amend-required": "Amend Required",
  "confirm-application": "Confirm Application",
  transferring: "Transferring",
  "complete-transfer": "Complete Transfer",
  canceled: "Canceled",
};

export const FORM_STATUS_ICONS: Record<FormStatus, string> = {
  "under-review": "👀",
  "amend-required": "���",
  "confirm-application": "📝",
  transferring: "🚚",
  "complete-transfer": "🎉",
  canceled: "❌",
};

// Create a new empty form
export function createEmptyForm(
  orderId: string,
  companyId: string,
  companyName: string,
  companyNumber: string,
  country?: string,
  incorporationDate?: string,
  incorporationYear?: number,
): TransferFormData {
  return {
    id: `form_${Date.now()}`,
    formId: `FORM-${Date.now()}`,
    orderId,
    companyId,
    companyName,
    companyNumber,
    country: country || "",
    incorporationDate: incorporationDate || "",
    incorporationYear: incorporationYear || new Date().getFullYear(),

    // Seller and Buyer information (optional, can be filled in later)
    sellerName: "",
    sellerEmail: "",
    sellerPhone: "",
    sellerAddress: "",
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    buyerAddress: "",

    totalShares: 0,
    totalShareCapital: 0,
    pricePerShare: 0,

    shareholders: [],
    numberOfShareholders: 0,

    pscList: [],
    numberOfPSCs: 0,

    changeCompanyName: false,
    suggestedNames: [],
    changeCompanyActivities: false,
    companyActivities: [],

    status: "under-review",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    amendmentsRequiredCount: 0,
    attachments: [],
    comments: [],
    statusHistory: [],
  };
}

// Fetch existing transfer form by company ID (for amendments)
export async function fetchExistingTransferForm(
  companyId: string,
): Promise<TransferFormData | null> {
  try {
    const response = await fetch(`/api/transfer-forms?companyId=${companyId}`);
    if (response.ok) {
      const data = await response.json();
      // Return the first form (most recent)
      return data[0] || null;
    }
  } catch (error) {
    console.error("Error fetching existing transfer form:", error);
  }
  return null;
}

// Get amendment comments for a company
export async function getAmendmentComments(
  companyId: string,
): Promise<FormComment[]> {
  try {
    const form = await fetchExistingTransferForm(companyId);
    if (form && form.comments) {
      // Filter for admin comments only and sort by date (newest first)
      return form.comments
        .filter((c) => c.isAdminOnly)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
  } catch (error) {
    console.error("Error fetching amendment comments:", error);
  }
  return [];
}

// Helper function to get full activity label from code
export function getActivityLabel(code: string): string {
  // Activity codes map - matches COMPANY_ACTIVITIES structure
  const activities: Record<string, string> = {
    "01110":
      "01110 - Growing of cereals and other crops not elsewhere classified",
    "01120": "01120 - Growing of rice",
    "01130": "01130 - Growing of vegetables and melons, roots and tubers",
    "01140": "01140 - Growing of sugar cane",
    "01150": "01150 - Growing of tobacco",
    "01160": "01160 - Growing of fibre crops",
    "01190": "01190 - Growing of other non-perennial crops",
    "01210": "01210 - Growing of grapes",
    "01220": "01220 - Growing of tropical and subtropical fruits",
    "01230": "01230 - Growing of citrus fruits",
    "01240": "01240 - Growing of pome fruits and stone fruits",
    "01250": "01250 - Growing of other tree and shrub fruits and nuts",
    "01260": "01260 - Growing of oleaginous fruits",
    "01270": "01270 - Growing of beverage crops",
    "01280": "01280 - Growing of spices, aromatic, drug and dye plants",
    "01290": "01290 - Growing of other perennial crops",
    "01300": "01300 - Plant propagation",
    "01410": "01410 - Raising of cattle",
    "01420": "01420 - Raising of horses and other equines",
    "01430": "01430 - Raising of camels and camelids",
    "01440": "01440 - Raising of sheep and goats",
    "01450": "01450 - Raising of swine",
    "01460": "01460 - Raising of poultry",
    "01470": "01470 - Raising of other animals",
    "01500": "01500 - Mixed farming",
    "01610": "01610 - Support activities for crop production",
    "01620": "01620 - Support activities for animal production",
    "01630": "01630 - Post-harvest crop activities",
    "01640": "01640 - Seed processing for propagation",
    "01700": "01700 - Hunting, trapping and related activities",
    "46900":
      "46900 - Remediation activities and other waste management services",
  };

  return activities[code] || code;
}

// API Functions
export async function fetchTransferForms(
  orderId?: string,
): Promise<TransferFormData[]> {
  try {
    const url = orderId
      ? `/api/transfer-forms?orderId=${orderId}`
      : "/api/transfer-forms";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch forms");
    return await response.json();
  } catch (error) {
    console.error("Error fetching forms:", error);
    return [];
  }
}

export async function getTransferForm(
  formId: string,
): Promise<TransferFormData | null> {
  try {
    const response = await fetch(`/api/transfer-forms/${formId}`);
    if (!response.ok) throw new Error("Failed to fetch form");
    return await response.json();
  } catch (error) {
    console.error("Error fetching form:", error);
    return null;
  }
}

export async function createTransferForm(
  form: Omit<TransferFormData, "id" | "createdAt" | "updatedAt">,
): Promise<TransferFormData | null> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/transfer-forms`, {
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
  updates: Partial<TransferFormData>,
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
  reason?: string,
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
  file: File,
): Promise<FormAttachment | null> {
  try {
    // Convert file to base64
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Data = btoa(binary);

    const response = await fetch(`/api/transfer-forms/${formId}/attachments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: file.name,
        filesize: file.size,
        filetype: file.type || "application/octet-stream",
        data: base64Data,
      }),
    });
    if (!response.ok) throw new Error("Failed to upload attachment");
    const attachment = await response.json();
    return attachment;
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return null;
  }
}

export async function deleteFormAttachment(
  formId: string,
  attachmentId: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/transfer-forms/${formId}/attachments/${attachmentId}`,
      {
        method: "DELETE",
      },
    );
    return response.ok;
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return false;
  }
}

export async function addFormComment(
  formId: string,
  text: string,
  isAdminOnly: boolean = false,
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

export function canChangeStatus(
  currentStatus: FormStatus,
  newStatus: FormStatus,
): boolean {
  const transitions: Record<FormStatus, FormStatus[]> = {
    "under-review": ["amend-required", "confirm-application", "canceled"],
    "amend-required": ["under-review", "canceled"],
    "confirm-application": ["transferring", "canceled"],
    transferring: ["complete-transfer", "canceled"],
    "complete-transfer": [],
    canceled: ["under-review"],
  };

  return transitions[currentStatus]?.includes(newStatus) ?? false;
}

export function getAvailableStatusTransitions(
  currentStatus: FormStatus,
): FormStatus[] {
  const transitions: Record<FormStatus, FormStatus[]> = {
    "under-review": ["amend-required", "confirm-application", "canceled"],
    "amend-required": ["under-review", "canceled"],
    "confirm-application": ["transferring", "canceled"],
    transferring: ["complete-transfer", "canceled"],
    "complete-transfer": [],
    canceled: ["under-review"],
  };

  return transitions[currentStatus] ?? [];
}
