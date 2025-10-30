export type CompanyStatus =
  | "active"
  | "expired"
  | "cancelled"
  | "refunded"
  | "available"
  | "pending"
  | "sold";

export type CompanyType =
  | "LTD"
  | "LLC"
  | "INC"
  | "AB"
  | "FZCO"
  | "GmbH"
  | "SARL"
  | "BV"
  | "OOO"
  | "Ltd Liability Partnership"
  | "Sole Proprietor"
  | "Other";

export type RefundStatus = 
  | "not-refunded" 
  | "partially-refunded" 
  | "fully-refunded";

export type PaymentStatus = 
  | "paid" 
  | "pending" 
  | "failed" 
  | "refunded";

export interface CompanyTag {
  id: string;
  name: string;
  color: "blue" | "green" | "red" | "yellow" | "purple" | "pink" | "cyan" | "gray";
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  details: string;
  previousStatus?: CompanyStatus;
  newStatus?: CompanyStatus;
}

export interface CompanyData {
  id: string;
  companyName: string;
  companyNumber: string;
  country: string;
  type: CompanyType;
  incorporationDate: string;
  incorporationYear: number;
  purchasePrice: number;
  renewalFee: number;
  currency: string;
  expiryDate: string;
  renewalDate: string;
  renewalDaysLeft: number;
  status: CompanyStatus;
  paymentStatus: PaymentStatus;
  refundStatus: RefundStatus;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  industry?: string;
  revenue?: string;
  adminNotes?: string;
  internalNotes?: string;
  optionsInclude?: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  tags: CompanyTag[];
  documents: CompanyDocument[];
  activityLog: ActivityLogEntry[];
  ownershipHistory: OwnershipHistoryEntry[];
}

export interface CompanyDocument {
  id: string;
  name: string;
  type: string;
  uploadedDate: string;
  uploadedBy: string;
  url?: string;
}

export interface OwnershipHistoryEntry {
  id: string;
  previousOwner?: string;
  newOwner: string;
  transferDate: string;
  reason: "sale" | "refund" | "cancellation" | "reactivation";
  notes?: string;
}

export interface CompanyFilters {
  status?: CompanyStatus[];
  country?: string[];
  type?: CompanyType[];
  paymentStatus?: PaymentStatus[];
  refundStatus?: RefundStatus[];
  priceRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
  searchTerm?: string;
  renewalDaysRange?: {
    min: number;
    max: number;
  };
}

export type SortField = "name" | "date" | "price" | "renewal" | "status";
export type SortOrder = "asc" | "desc";

export interface CompanySort {
  field: SortField;
  order: SortOrder;
}

// Status utilities
export const STATUS_COLORS: Record<CompanyStatus, string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  refunded: "bg-yellow-100 text-yellow-800",
  available: "bg-blue-100 text-blue-800",
  pending: "bg-purple-100 text-purple-800",
};

export const STATUS_DESCRIPTIONS: Record<CompanyStatus, string> = {
  active: "Company is active and owned",
  expired: "Company registration has expired",
  cancelled: "Company has been cancelled",
  refunded: "Company was refunded to available pool",
  available: "Available for purchase",
  pending: "Registration pending",
};

// Payment status utilities
export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

// Company type utilities
export const COMPANY_TYPES: CompanyType[] = [
  "LTD",
  "AB",
  "FZCO",
  "GmbH",
  "SARL",
  "BV",
  "OOO",
  "Other",
];

// Calculate renewal days left
export function calculateRenewalDaysLeft(renewalDate: string): number {
  const renewal = new Date(renewalDate);
  const today = new Date();
  const daysLeft = Math.floor(
    (renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, daysLeft);
}

// Calculate expiry date (1 year from purchase/renewal)
export function calculateExpiryDate(baseDate: string): string {
  const date = new Date(baseDate);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split("T")[0];
}

// Get status based on dates
export function determineStatus(
  renewalDate: string,
  currentStatus: CompanyStatus
): CompanyStatus {
  if (currentStatus === "available" || currentStatus === "pending") {
    return currentStatus;
  }

  const daysLeft = calculateRenewalDaysLeft(renewalDate);
  
  if (daysLeft <= 0) {
    return "expired";
  }

  return currentStatus === "refunded" || currentStatus === "cancelled"
    ? "available"
    : "active";
}

// Format currency
export function formatPrice(price: number | string | undefined, currency: string = "USD"): string {
  if (price === undefined || price === null || price === "") {
    return "N/A";
  }
  try {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) {
      return "N/A";
    }
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(numPrice);
  } catch (error) {
    console.warn("Format price error:", error);
    return price ? `${price} ${currency}` : "N/A";
  }
}

// Format date
export function formatDate(dateString: string | undefined): string {
  if (!dateString) {
    return "N/A";
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.warn("Format date error:", error);
    return dateString;
  }
}

// Get renewal countdown text
export function getRenewalCountdown(renewalDaysLeft: number): string {
  if (renewalDaysLeft <= 0) {
    return "Expired";
  }
  if (renewalDaysLeft === 1) {
    return "1 day left";
  }
  if (renewalDaysLeft <= 30) {
    return `${renewalDaysLeft} days left`;
  }
  const months = Math.floor(renewalDaysLeft / 30);
  return `${months} months left`;
}

// Filter and sort companies
export function filterCompanies(
  companies: CompanyData[],
  filters: CompanyFilters
): CompanyData[] {
  return companies.filter((company) => {
    // Status filter
    if (
      filters.status &&
      filters.status.length > 0 &&
      !filters.status.includes(company.status)
    ) {
      return false;
    }

    // Country filter
    if (
      filters.country &&
      filters.country.length > 0 &&
      !filters.country.includes(company.country)
    ) {
      return false;
    }

    // Type filter
    if (
      filters.type &&
      filters.type.length > 0 &&
      !filters.type.includes(company.type)
    ) {
      return false;
    }

    // Payment status filter
    if (
      filters.paymentStatus &&
      filters.paymentStatus.length > 0 &&
      !filters.paymentStatus.includes(company.paymentStatus)
    ) {
      return false;
    }

    // Refund status filter
    if (
      filters.refundStatus &&
      filters.refundStatus.length > 0 &&
      !filters.refundStatus.includes(company.refundStatus)
    ) {
      return false;
    }

    // Price range filter
    if (filters.priceRange) {
      if (
        company.purchasePrice < filters.priceRange.min ||
        company.purchasePrice > filters.priceRange.max
      ) {
        return false;
      }
    }

    // Renewal days range filter
    if (filters.renewalDaysRange) {
      if (
        company.renewalDaysLeft < filters.renewalDaysRange.min ||
        company.renewalDaysLeft > filters.renewalDaysRange.max
      ) {
        return false;
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const companyTagIds = company.tags.map((t) => t.id);
      const hasAllTags = filters.tags.every((tagId) =>
        companyTagIds.includes(tagId)
      );
      if (!hasAllTags) {
        return false;
      }
    }

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      return (
        company.companyName.toLowerCase().includes(term) ||
        company.companyNumber.toLowerCase().includes(term) ||
        company.clientName.toLowerCase().includes(term) ||
        company.clientEmail.toLowerCase().includes(term)
      );
    }

    return true;
  });
}

export function sortCompanies(
  companies: CompanyData[],
  sort: CompanySort
): CompanyData[] {
  const sorted = [...companies];

  sorted.sort((a, b) => {
    let aValue: string | number | Date | undefined;
    let bValue: string | number | Date | undefined;

    try {
      switch (sort.field) {
        case "name":
          aValue = (a.companyName || "").toLowerCase();
          bValue = (b.companyName || "").toLowerCase();
          break;
        case "date":
          aValue = new Date(a.createdAt || "");
          bValue = new Date(b.createdAt || "");
          break;
        case "price":
          aValue = a.purchasePrice || 0;
          bValue = b.purchasePrice || 0;
          break;
        case "renewal":
          aValue = new Date(a.renewalDate || "");
          bValue = new Date(b.renewalDate || "");
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sort.order === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sort.order === "asc" ? 1 : -1;
      }
      return 0;
    } catch (error) {
      console.warn("Sort error:", error);
      return 0;
    }
  });

  return sorted;
}

// API Functions
export async function fetchAllCompanies(): Promise<CompanyData[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch("/api/companies", {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `Failed to fetch companies: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error fetching companies:", errorMessage);
    throw new Error(`Failed to fetch companies: ${errorMessage}`);
  }
}

export async function getCompany(id: string): Promise<CompanyData | null> {
  try {
    const response = await fetch(`/api/companies/${id}`);
    if (!response.ok) throw new Error("Failed to fetch company");
    return await response.json();
  } catch (error) {
    console.error("Error fetching company:", error);
    return null;
  }
}

export async function createCompany(company: Omit<CompanyData, "id" | "createdAt" | "updatedAt">): Promise<CompanyData | null> {
  try {
    const response = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(company),
    });
    if (!response.ok) throw new Error("Failed to create company");
    return await response.json();
  } catch (error) {
    console.error("Error creating company:", error);
    return null;
  }
}

export async function updateCompany(
  id: string,
  updates: Partial<CompanyData>
): Promise<CompanyData | null> {
  try {
    const response = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update company");
    return await response.json();
  } catch (error) {
    console.error("Error updating company:", error);
    return null;
  }
}

export async function deleteCompany(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/companies/${id}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch (error) {
    console.error("Error deleting company:", error);
    return false;
  }
}

export async function updateCompanyStatus(
  id: string,
  newStatus: CompanyStatus,
  notes?: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/companies/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, notes }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error updating company status:", error);
    return false;
  }
}

export async function renewCompany(
  id: string,
  notes?: string
): Promise<CompanyData | null> {
  try {
    const response = await fetch(`/api/companies/${id}/renew`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) throw new Error("Failed to renew company");
    return await response.json();
  } catch (error) {
    console.error("Error renewing company:", error);
    return null;
  }
}

export async function requestRefund(
  id: string,
  reason: string,
  notes?: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/companies/${id}/refund-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, notes }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error requesting refund:", error);
    return false;
  }
}

export async function approveRefund(
  id: string,
  refundAmount: number,
  notes?: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/companies/${id}/refund-approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refundAmount, notes }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error approving refund:", error);
    return false;
  }
}

// Get statistics
export function getCompanyStatistics(companies: CompanyData[]) {
  return {
    total: companies.length,
    active: companies.filter((c) => c.status === "active").length,
    expired: companies.filter((c) => c.status === "expired").length,
    available: companies.filter((c) => c.status === "available").length,
    cancelled: companies.filter((c) => c.status === "cancelled").length,
    refunded: companies.filter((c) => c.status === "refunded").length,
    totalRevenue: companies.reduce((sum, c) => sum + c.purchasePrice, 0),
    renewingSoon: companies.filter((c) => c.renewalDaysLeft <= 30).length,
    paymentPending: companies.filter((c) => c.paymentStatus === "pending")
      .length,
  };
}
