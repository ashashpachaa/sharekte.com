import { getAPIBaseURL } from "./transfer-form";

export type WalletTransactionType =
  | "deposit"
  | "withdrawal"
  | "payment"
  | "refund"
  | "admin_add"
  | "admin_deduct";
export type WalletStatus = "active" | "frozen";

export interface Wallet {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  balance: number;
  currency: string;
  status: WalletStatus;
  createdAt: string;
  updatedAt: string;
  lastTransactionAt?: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  orderId?: string;
  reference?: string;
  createdAt: string;
  createdBy: string;
}

export interface WalletReport {
  totalUsers: number;
  totalBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalPayments: number;
  currency: string;
  transactions: WalletTransaction[];
}

// API Utilities
const getAPIBaseURL_Internal = () => {
  if (typeof window === "undefined") return "http://localhost:5000";
  return window.location.origin;
};

export async function getUserWallet(userId: string): Promise<Wallet> {
  const baseURL = getAPIBaseURL_Internal();
  const response = await fetch(`${baseURL}/api/wallets/${userId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to fetch wallet");
  return response.json();
}

export async function getAllWallets(filters?: {
  status?: WalletStatus;
  currency?: string;
  minBalance?: number;
  maxBalance?: number;
}): Promise<Wallet[]> {
  const baseURL = getAPIBaseURL_Internal();
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.currency) params.append("currency", filters.currency);
  if (filters?.minBalance)
    params.append("minBalance", filters.minBalance.toString());
  if (filters?.maxBalance)
    params.append("maxBalance", filters.maxBalance.toString());

  const response = await fetch(`${baseURL}/api/wallets?${params}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to fetch wallets");
  return response.json();
}

export async function addFundsToWallet(
  userId: string,
  amount: number,
  reason: string,
): Promise<Wallet> {
  const baseURL = getAPIBaseURL_Internal();
  const response = await fetch(`${baseURL}/api/wallets/${userId}/add-funds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, reason }),
  });
  if (!response.ok) throw new Error("Failed to add funds");
  return response.json();
}

export async function getWalletTransactions(
  userId: string,
  filters?: {
    type?: WalletTransactionType;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  },
): Promise<WalletTransaction[]> {
  const baseURL = getAPIBaseURL_Internal();
  const params = new URLSearchParams();
  if (filters?.type) params.append("type", filters.type);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.offset) params.append("offset", filters.offset.toString());

  const response = await fetch(
    `${baseURL}/api/wallets/${userId}/transactions?${params}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  if (!response.ok) throw new Error("Failed to fetch transactions");
  return response.json();
}

export async function freezeWallet(userId: string): Promise<Wallet> {
  const baseURL = getAPIBaseURL_Internal();
  const response = await fetch(`${baseURL}/api/wallets/${userId}/freeze`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to freeze wallet");
  return response.json();
}

export async function unfreezeWallet(userId: string): Promise<Wallet> {
  const baseURL = getAPIBaseURL_Internal();
  const response = await fetch(`${baseURL}/api/wallets/${userId}/unfreeze`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to unfreeze wallet");
  return response.json();
}

export async function getWalletReport(filters?: {
  currency?: string;
  startDate?: string;
  endDate?: string;
}): Promise<WalletReport> {
  const baseURL = getAPIBaseURL_Internal();
  const params = new URLSearchParams();
  if (filters?.currency) params.append("currency", filters.currency);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);

  const response = await fetch(
    `${baseURL}/api/wallets/report${params ? `?${params}` : ""}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  if (!response.ok) throw new Error("Failed to fetch wallet report");
  return response.json();
}

export async function deductFromWallet(
  userId: string,
  amount: number,
  reason: string,
  orderId?: string,
): Promise<{ success: boolean; newBalance: number }> {
  const baseURL = getAPIBaseURL_Internal();
  const response = await fetch(`${baseURL}/api/wallets/${userId}/deduct`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, reason, orderId }),
  });
  if (!response.ok) throw new Error("Failed to deduct from wallet");
  return response.json();
}
