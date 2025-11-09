import { RequestHandler } from "express";
import fs from "fs";
import path from "path";

// Types
interface Wallet {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  balance: number;
  currency: string;
  status: "active" | "frozen";
  createdAt: string;
  updatedAt: string;
  lastTransactionAt?: string;
}

interface WalletTransaction {
  id: string;
  walletId: string;
  type:
    | "deposit"
    | "withdrawal"
    | "payment"
    | "refund"
    | "admin_add"
    | "admin_deduct";
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

// In-memory storage
let inMemoryWallets: Wallet[] = [];
let inMemoryTransactions: WalletTransaction[] = [];

// File persistence
const walletsDbPath = path.join(process.cwd(), "wallets.json");
const transactionsDbPath = path.join(process.cwd(), "wallet-transactions.json");

function loadWalletsFromFile(): Wallet[] {
  try {
    if (fs.existsSync(walletsDbPath)) {
      const data = fs.readFileSync(walletsDbPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("[loadWalletsFromFile] Error:", error);
  }
  return [];
}

function saveWalletsToFile(wallets: Wallet[]) {
  try {
    fs.writeFileSync(walletsDbPath, JSON.stringify(wallets, null, 2));
  } catch (error) {
    console.error("[saveWalletsToFile] Error:", error);
  }
}

function loadTransactionsFromFile(): WalletTransaction[] {
  try {
    if (fs.existsSync(transactionsDbPath)) {
      const data = fs.readFileSync(transactionsDbPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("[loadTransactionsFromFile] Error:", error);
  }
  return [];
}

function saveTransactionsToFile(transactions: WalletTransaction[]) {
  try {
    fs.writeFileSync(transactionsDbPath, JSON.stringify(transactions, null, 2));
  } catch (error) {
    console.error("[saveTransactionsToFile] Error:", error);
  }
}

// Initialize with demo data if empty
function initializeDemoWallets() {
  if (inMemoryWallets.length === 0) {
    const now = new Date().toISOString();
    inMemoryWallets = [
      {
        id: "wallet_1",
        userId: "user_1",
        userEmail: "john@example.com",
        userName: "John Doe",
        balance: 5000,
        currency: "USD",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "wallet_2",
        userId: "user_2",
        userEmail: "sarah@example.com",
        userName: "Sarah Smith",
        balance: 3500,
        currency: "AED",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "wallet_3",
        userId: "user_3",
        userEmail: "ahmed@example.com",
        userName: "Ahmed Hassan",
        balance: 0,
        currency: "USD",
        status: "frozen",
        createdAt: now,
        updatedAt: now,
      },
    ];
    saveWalletsToFile(inMemoryWallets);
  }

  if (inMemoryTransactions.length === 0) {
    const now = new Date().toISOString();
    inMemoryTransactions = [
      {
        id: "txn_1",
        walletId: "wallet_1",
        type: "admin_add",
        amount: 5000,
        currency: "USD",
        balanceBefore: 0,
        balanceAfter: 5000,
        reason: "Initial wallet credit",
        createdAt: now,
        createdBy: "admin@sharekte.com",
      },
      {
        id: "txn_2",
        walletId: "wallet_2",
        type: "admin_add",
        amount: 3500,
        currency: "AED",
        balanceBefore: 0,
        balanceAfter: 3500,
        reason: "Initial wallet credit",
        createdAt: now,
        createdBy: "admin@sharekte.com",
      },
      {
        id: "txn_3",
        walletId: "wallet_1",
        type: "payment",
        amount: 1000,
        currency: "USD",
        balanceBefore: 5000,
        balanceAfter: 4000,
        reason: "Payment for DOMAINO23 LTD",
        orderId: "order_1",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        createdBy: "system",
      },
    ];
    saveTransactionsToFile(inMemoryTransactions);
  }
}

// Load data on startup
inMemoryWallets = loadWalletsFromFile();
inMemoryTransactions = loadTransactionsFromFile();
initializeDemoWallets();

// Handlers
export const getUserWalletHandler: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId;
    // Search by userId OR userEmail (in case email is passed as userId)
    let wallet = inMemoryWallets.find(
      (w) => w.userId === userId || w.userEmail === userId
    );

    if (!wallet) {
      // Create new wallet if doesn't exist
      const newWallet: Wallet = {
        id: `wallet_${Date.now()}`,
        userId,
        userEmail: req.body?.userEmail || userId,
        userName: req.body?.userName,
        balance: 0,
        currency: req.body?.currency || "USD",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryWallets.push(newWallet);
      saveWalletsToFile(inMemoryWallets);
      wallet = newWallet;
    }

    res.json(wallet);
  } catch (error) {
    console.error("[getUserWalletHandler] Error:", error);
    res.status(500).json({ error: "Failed to get wallet" });
  }
};

export const getAllWalletsHandler: RequestHandler = (req, res) => {
  try {
    let wallets = [...inMemoryWallets];

    // Apply filters
    if (req.query.status) {
      wallets = wallets.filter((w) => w.status === req.query.status);
    }
    if (req.query.currency) {
      wallets = wallets.filter((w) => w.currency === req.query.currency);
    }
    if (req.query.minBalance) {
      const min = parseFloat(req.query.minBalance as string);
      wallets = wallets.filter((w) => w.balance >= min);
    }
    if (req.query.maxBalance) {
      const max = parseFloat(req.query.maxBalance as string);
      wallets = wallets.filter((w) => w.balance <= max);
    }

    res.json(wallets);
  } catch (error) {
    console.error("[getAllWalletsHandler] Error:", error);
    res.status(500).json({ error: "Failed to get wallets" });
  }
};

export const addFundsHandler: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    let wallet = inMemoryWallets.find((w) => w.userId === userId);
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Record transaction
    const balanceBefore = wallet.balance;
    const transaction: WalletTransaction = {
      id: `txn_${Date.now()}`,
      walletId: wallet.id,
      type: "admin_add",
      amount,
      currency: wallet.currency,
      balanceBefore,
      balanceAfter: balanceBefore + amount,
      reason,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.email || "admin@sharekte.com",
    };

    // Update wallet
    wallet.balance += amount;
    wallet.updatedAt = new Date().toISOString();
    wallet.lastTransactionAt = new Date().toISOString();

    inMemoryTransactions.push(transaction);
    saveWalletsToFile(inMemoryWallets);
    saveTransactionsToFile(inMemoryTransactions);

    res.json(wallet);
  } catch (error) {
    console.error("[addFundsHandler] Error:", error);
    res.status(500).json({ error: "Failed to add funds" });
  }
};

// Get ALL transactions across all wallets (for admin)
export const getAllTransactionsHandler: RequestHandler = (req, res) => {
  try {
    let transactions = [...inMemoryTransactions];

    // Apply filters
    if (req.query.type) {
      transactions = transactions.filter((t) => t.type === req.query.type);
    }
    if (req.query.startDate) {
      const startDate = new Date(req.query.startDate as string);
      transactions = transactions.filter(
        (t) => new Date(t.createdAt) >= startDate,
      );
    }
    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate as string);
      transactions = transactions.filter(
        (t) => new Date(t.createdAt) <= endDate,
      );
    }

    // Pagination
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const paginated = transactions.slice(offset, offset + limit);

    res.json(paginated);
  } catch (error) {
    console.error("[getAllTransactionsHandler] Error:", error);
    res.status(500).json({ error: "Failed to get transactions" });
  }
};

// Get transactions for specific user
export const getTransactionsHandler: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId;
    const wallet = inMemoryWallets.find((w) => w.userId === userId);

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    let transactions = inMemoryTransactions.filter(
      (t) => t.walletId === wallet.id,
    );

    // Apply filters
    if (req.query.type) {
      transactions = transactions.filter((t) => t.type === req.query.type);
    }
    if (req.query.startDate) {
      const startDate = new Date(req.query.startDate as string);
      transactions = transactions.filter(
        (t) => new Date(t.createdAt) >= startDate,
      );
    }
    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate as string);
      transactions = transactions.filter(
        (t) => new Date(t.createdAt) <= endDate,
      );
    }

    // Pagination
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const paginated = transactions.slice(offset, offset + limit);

    res.json(paginated);
  } catch (error) {
    console.error("[getTransactionsHandler] Error:", error);
    res.status(500).json({ error: "Failed to get transactions" });
  }
};

export const freezeWalletHandler: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId;
    const wallet = inMemoryWallets.find((w) => w.userId === userId);

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    wallet.status = "frozen";
    wallet.updatedAt = new Date().toISOString();
    saveWalletsToFile(inMemoryWallets);

    res.json(wallet);
  } catch (error) {
    console.error("[freezeWalletHandler] Error:", error);
    res.status(500).json({ error: "Failed to freeze wallet" });
  }
};

export const unfreezeWalletHandler: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId;
    const wallet = inMemoryWallets.find((w) => w.userId === userId);

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    wallet.status = "active";
    wallet.updatedAt = new Date().toISOString();
    saveWalletsToFile(inMemoryWallets);

    res.json(wallet);
  } catch (error) {
    console.error("[unfreezeWalletHandler] Error:", error);
    res.status(500).json({ error: "Failed to unfreeze wallet" });
  }
};

export const deductFromWalletHandler: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId;
    const { amount, reason, orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount", success: false });
    }

    const wallet = inMemoryWallets.find((w) => w.userId === userId);
    if (!wallet) {
      return res
        .status(404)
        .json({ error: "Wallet not found", success: false });
    }

    if (wallet.status === "frozen") {
      return res
        .status(400)
        .json({ error: "Wallet is frozen", success: false });
    }

    if (wallet.balance < amount) {
      return res
        .status(400)
        .json({ error: "Insufficient balance", success: false });
    }

    // Record transaction
    const balanceBefore = wallet.balance;
    const transaction: WalletTransaction = {
      id: `txn_${Date.now()}`,
      walletId: wallet.id,
      type: "payment",
      amount,
      currency: wallet.currency,
      balanceBefore,
      balanceAfter: balanceBefore - amount,
      reason,
      orderId,
      createdAt: new Date().toISOString(),
      createdBy: "system",
    };

    // Update wallet
    wallet.balance -= amount;
    wallet.updatedAt = new Date().toISOString();
    wallet.lastTransactionAt = new Date().toISOString();

    inMemoryTransactions.push(transaction);
    saveWalletsToFile(inMemoryWallets);
    saveTransactionsToFile(inMemoryTransactions);

    res.json({ success: true, newBalance: wallet.balance });
  } catch (error) {
    console.error("[deductFromWalletHandler] Error:", error);
    res
      .status(500)
      .json({ error: "Failed to deduct from wallet", success: false });
  }
};

export const getWalletReportHandler: RequestHandler = (req, res) => {
  try {
    let wallets = [...inMemoryWallets];
    let transactions = [...inMemoryTransactions];

    // Apply filters
    if (req.query.currency) {
      wallets = wallets.filter((w) => w.currency === req.query.currency);
      transactions = transactions.filter(
        (t) => t.currency === req.query.currency,
      );
    }
    if (req.query.startDate) {
      const startDate = new Date(req.query.startDate as string);
      transactions = transactions.filter(
        (t) => new Date(t.createdAt) >= startDate,
      );
    }
    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate as string);
      transactions = transactions.filter(
        (t) => new Date(t.createdAt) <= endDate,
      );
    }

    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalDeposited = transactions
      .filter((t) => t.type === "admin_add")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawn = transactions
      .filter((t) => t.type === "admin_deduct")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPayments = transactions
      .filter((t) => t.type === "payment")
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      totalUsers: wallets.length,
      totalBalance,
      totalDeposited,
      totalWithdrawn,
      totalPayments,
      currency: (req.query.currency as string) || "All",
      transactions,
    });
  } catch (error) {
    console.error("[getWalletReportHandler] Error:", error);
    res.status(500).json({ error: "Failed to get wallet report" });
  }
};
