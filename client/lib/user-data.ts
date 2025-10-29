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

export interface PurchasedCompanyData {
  id: string;
  name: string;
  number: string;
  price: number;
  incorporationDate: string;
  incorporationYear: string;
  renewalDate: string;
  renewalFees: number;
  status: "pending-form" | "under-review" | "amend-required" | "pending-transfer" | "completed";
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
  purchasedDate: string;
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

export interface UserDataStore {
  purchasedCompanies: PurchasedCompanyData[];
  invoices: InvoiceData[];
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
  const existingIndex = userData.purchasedCompanies.findIndex(c => c.id === company.id);
  if (existingIndex >= 0) {
    userData.purchasedCompanies[existingIndex] = company;
  } else {
    userData.purchasedCompanies.push(company);
  }
  
  const key = getUserDataKey();
  localStorage.setItem(key, JSON.stringify(userData));
}

export function savePurchasedCompanies(companies: PurchasedCompanyData[]): void {
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
  const existingIndex = userData.invoices.findIndex(i => i.id === invoice.id);
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
  status: "pending-form" | "under-review" | "amend-required" | "pending-transfer" | "completed",
  statusLabel: string
): void {
  const userData = getUserData();
  const company = userData.purchasedCompanies.find(c => c.id === companyId);
  
  if (company) {
    company.status = status;
    company.statusLabel = statusLabel;
    const key = getUserDataKey();
    localStorage.setItem(key, JSON.stringify(userData));
  }
}
