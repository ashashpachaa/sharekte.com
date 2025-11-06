/**
 * Manages user-specific data (purchased companies, invoices, orders)
 * Data is stored in localStorage with user email as the key
 */

export interface TransferFormAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedDate: string;
  base64Data?: string;
}

export interface RenewalHistoryEntry {
  id: string;
  renewalDate: string;
  renewedDate: string;
  isLate: boolean;
  daysLate: number;
  status: "on-time" | "late" | "pending";
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: string;
  toStatus: string;
  changedDate: string;
  changedBy: string;
  reason?: string;
  notes?: string;
}

export interface PurchasedCompanyData {
  id: string;
  name: string;
  number: string;
  price: number;
  incorporationDate: string;
  incorporationYear: string;
  country: string;
  purchasedDate: string;
  renewalDate: string;
  renewalFees: number;
  status:
    | "pending-form"
    | "under-review"
    | "amend-required"
    | "pending-transfer"
    | "completed";
  statusLabel: string;
  renewalStatus: "active" | "expired" | "cancelled";
  documents: Array<{
    id: string;
    name: string;
    type: string;
    uploadedDate: string;
    url?: string;
  }>;
  transferFormAttachments: TransferFormAttachment[];
  transferFormData?: {
    directorName: string;
    directorEmail: string;
    shareholderName: string;
    shareholderEmail: string;
    companyAddress: string;
  };
  transferFormFilled: boolean;
  adminComments?: string;
  statusHistory?: StatusHistoryEntry[];
  renewalHistory: RenewalHistoryEntry[];
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  companyName: string;
  companyNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  description: string;
  status: "paid" | "unpaid" | "canceled";
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  orderId?: string;
}

export interface BillingInformation {
  fullName: string;
  email: string;
  phoneNumber: string;
  billingAddress: string;
  country: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  savedAt: string;
}

export interface UserDataStore {
  purchasedCompanies: PurchasedCompanyData[];
  invoices: InvoiceData[];
  billingInformation?: BillingInformation;
}

function getUserEmail(): string {
  const user = localStorage.getItem("user");
  if (user) {
    const parsed = JSON.parse(user);
    return parsed.email || parsed.signupEmail || "default_user";
  }
  return "default_user";
}

function getUserDataKey(): string {
  const email = getUserEmail();
  return `user_data_${email}`;
}

export function getUserData(): UserDataStore {
  const key = getUserDataKey();
  const saved = localStorage.getItem(key);

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return { purchasedCompanies: [], invoices: [] };
    }
  }

  return { purchasedCompanies: [], invoices: [] };
}

export function savePurchasedCompany(company: PurchasedCompanyData): void {
  const userData = getUserData();

  // Check if company already exists
  const existingIndex = userData.purchasedCompanies.findIndex(
    (c) => c.id === company.id,
  );
  if (existingIndex >= 0) {
    userData.purchasedCompanies[existingIndex] = company;
  } else {
    userData.purchasedCompanies.push(company);
  }

  const key = getUserDataKey();
  localStorage.setItem(key, JSON.stringify(userData));
}

export function savePurchasedCompanies(
  companies: PurchasedCompanyData[],
): void {
  const userData = getUserData();
  userData.purchasedCompanies = companies;

  const key = getUserDataKey();
  localStorage.setItem(key, JSON.stringify(userData));
}

export function getPurchasedCompanies(): PurchasedCompanyData[] {
  return getUserData().purchasedCompanies;
}

export function saveInvoice(invoice: InvoiceData): void {
  const userData = getUserData();

  // Check if invoice already exists
  const existingIndex = userData.invoices.findIndex((i) => i.id === invoice.id);
  if (existingIndex >= 0) {
    userData.invoices[existingIndex] = invoice;
  } else {
    userData.invoices.push(invoice);
  }

  const key = getUserDataKey();
  localStorage.setItem(key, JSON.stringify(userData));
}

export function saveInvoices(invoices: InvoiceData[]): void {
  const userData = getUserData();
  userData.invoices = invoices;

  const key = getUserDataKey();
  localStorage.setItem(key, JSON.stringify(userData));
}

export function getInvoices(): InvoiceData[] {
  return getUserData().invoices;
}

export function addInvoice(invoice: InvoiceData): void {
  const userData = getUserData();
  userData.invoices.push(invoice);

  const key = getUserDataKey();
  localStorage.setItem(key, JSON.stringify(userData));
}

export function updatePurchasedCompanyStatus(
  companyId: string,
  status:
    | "pending-form"
    | "under-review"
    | "amend-required"
    | "pending-transfer"
    | "completed",
  statusLabel: string,
  adminComments?: string,
): void {
  const userData = getUserData();
  const company = userData.purchasedCompanies.find((c) => c.id === companyId);

  if (company) {
    const previousStatus = company.status;

    // Create status history entry
    if (!company.statusHistory) {
      company.statusHistory = [];
    }

    company.statusHistory.push({
      id: `status_${Date.now()}`,
      fromStatus: previousStatus,
      toStatus: status,
      changedDate: new Date().toISOString(),
      changedBy: "admin",
      notes:
        adminComments || `Status changed from ${previousStatus} to ${status}`,
    });

    company.status = status;
    company.statusLabel = statusLabel;

    // Update admin comments if provided
    if (adminComments) {
      company.adminComments = adminComments;
    }

    const key = getUserDataKey();
    localStorage.setItem(key, JSON.stringify(userData));
  }
}

export function updateCompanyAdminComments(
  companyId: string,
  comments: string,
): void {
  const userData = getUserData();
  const company = userData.purchasedCompanies.find((c) => c.id === companyId);

  if (company) {
    company.adminComments = comments;
    const key = getUserDataKey();
    localStorage.setItem(key, JSON.stringify(userData));
  }
}

export function renewCompany(companyId: string): void {
  const userData = getUserData();
  const company = userData.purchasedCompanies.find((c) => c.id === companyId);

  if (company) {
    // Calculate next renewal date based on original purchase date
    // The renewal date should always be on the anniversary of the purchase date
    const purchaseDate = new Date(company.purchasedDate);
    const today = new Date();

    // Calculate years between purchase and today
    let yearsToAdd = purchaseDate.getFullYear() - purchaseDate.getFullYear();
    const nextRenewalDate = new Date(purchaseDate);

    // If today is past the purchase anniversary this year, next renewal is next year
    if (
      today >=
      new Date(
        today.getFullYear(),
        purchaseDate.getMonth(),
        purchaseDate.getDate(),
      )
    ) {
      yearsToAdd = today.getFullYear() - purchaseDate.getFullYear() + 1;
    } else {
      yearsToAdd = today.getFullYear() - purchaseDate.getFullYear();
    }

    nextRenewalDate.setFullYear(purchaseDate.getFullYear() + yearsToAdd + 1);

    const newRenewalDate = nextRenewalDate.toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];

    // Calculate if renewal was late
    const currentRenewalDate = new Date(company.renewalDate);
    const renewalTime = today.getTime();
    const dueTime = currentRenewalDate.getTime();
    const daysLate = Math.max(
      0,
      Math.ceil((renewalTime - dueTime) / (1000 * 60 * 60 * 24)),
    );
    const isLate = renewalTime > dueTime;

    // Add to renewal history
    if (!company.renewalHistory) {
      company.renewalHistory = [];
    }

    company.renewalHistory.push({
      id: `renewal-${Date.now()}`,
      renewalDate: company.renewalDate,
      renewedDate: todayStr,
      isLate: isLate,
      daysLate: daysLate,
      status: isLate ? "late" : "on-time",
    });

    company.renewalDate = newRenewalDate;
    company.renewalStatus = "active";

    const key = getUserDataKey();
    localStorage.setItem(key, JSON.stringify(userData));
  }
}

export function updateCompanyRenewalStatus(
  companyId: string,
  renewalStatus: "active" | "expired" | "cancelled",
): void {
  const userData = getUserData();
  const company = userData.purchasedCompanies.find((c) => c.id === companyId);

  if (company) {
    company.renewalStatus = renewalStatus;
    const key = getUserDataKey();
    localStorage.setItem(key, JSON.stringify(userData));
  }
}

export function saveBillingInformation(billing: BillingInformation): void {
  const userData = getUserData();
  userData.billingInformation = {
    ...billing,
    savedAt: new Date().toISOString(),
  };
  const key = getUserDataKey();
  localStorage.setItem(key, JSON.stringify(userData));
}

export function getBillingInformation(): BillingInformation | undefined {
  const userData = getUserData();
  return userData.billingInformation;
}

export function clearBillingInformation(): void {
  const userData = getUserData();
  userData.billingInformation = undefined;
  const key = getUserDataKey();
  localStorage.setItem(key, JSON.stringify(userData));
}

export function populateDemoAmendmentData(): void {
  const userData = getUserData();

  // Find companies with amend-required status and populate them with demo data
  userData.purchasedCompanies.forEach((company) => {
    if (company.status === "amend-required" && !company.statusHistory) {
      // Add demo admin comments
      company.adminComments =
        "We need some clarifications on your company information:\n\n" +
        "1. Please provide updated proof of address for the registered office\n" +
        "2. Shareholder details need to be verified - please provide ID copies\n" +
        "3. The company activities listed need to be more specific\n" +
        "4. Please confirm the current beneficial owners\n\n" +
        "Please review the attached requirements and submit the updated information within 5 business days.";

      // Add demo status history
      company.statusHistory = [
        {
          id: `status_${Date.now() - 86400000}`,
          fromStatus: "pending-form",
          toStatus: "under-review",
          changedDate: new Date(Date.now() - 86400000).toISOString(),
          changedBy: "admin@sharekte.com",
          notes: "Form received and under review",
        },
        {
          id: `status_${Date.now()}`,
          fromStatus: "under-review",
          toStatus: "amend-required",
          changedDate: new Date().toISOString(),
          changedBy: "admin@sharekte.com",
          reason: "Additional information required",
          notes: "We need clarifications on company information. Please review admin comments.",
        },
      ];
    }
  });

  const key = getUserDataKey();
  localStorage.setItem(key, JSON.stringify(userData));
}
