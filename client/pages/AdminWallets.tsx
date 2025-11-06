import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Wallet,
  WalletTransaction,
  getAllWallets,
  getWalletReport,
  getWalletTransactions,
} from "@/lib/wallet";
import {
  Wallet as WalletIcon,
  MoreVertical,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Plus,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/lib/currency-context";

export default function AdminWallets() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currency } = useCurrency();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [filteredWallets, setFilteredWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "wallets" | "transactions" | "report"
  >("wallets");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "frozen">(
    "all",
  );
  const [currencyFilter, setCurrencyFilter] = useState<string>("");

  // Dialog states
  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [addReason, setAddReason] = useState("");

  // Report state
  const [reportData, setReportData] = useState<any>(null);

  // Load wallets
  const loadWallets = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== "all") filters.status = statusFilter;
      if (currencyFilter && currencyFilter !== "all") filters.currency = currencyFilter;

      const data = await getAllWallets(filters);
      setWallets(data);

      // Apply search filter
      const filtered = data.filter(
        (w) =>
          w.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredWallets(filtered);
    } catch (error) {
      console.error("Failed to load wallets:", error);
      toast.error("Failed to load wallets");
    } finally {
      setLoading(false);
    }
  };

  // Load transactions
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getWalletTransactions("", { limit: 100 });
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  // Load report
  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await getWalletReport({
        currency: currencyFilter || undefined,
      });
      setReportData(data);
    } catch (error) {
      console.error("Failed to load report:", error);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "wallets") {
      loadWallets();
    } else if (activeTab === "transactions") {
      loadTransactions();
    } else if (activeTab === "report") {
      loadReport();
    }
  }, [activeTab, statusFilter, currencyFilter]);

  useEffect(() => {
    if (activeTab === "wallets") {
      const filtered = wallets.filter(
        (w) =>
          w.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredWallets(filtered);
    }
  }, [searchTerm, wallets]);

  const handleAddFunds = async () => {
    if (!selectedWallet || !addAmount) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const response = await fetch(
        `/api/wallets/${selectedWallet.userId}/add-funds`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: parseFloat(addAmount),
            reason: addReason || "Admin credit",
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to add funds");

      toast.success("Funds added successfully");
      setShowAddFundsDialog(false);
      setAddAmount("");
      setAddReason("");
      loadWallets();
    } catch (error) {
      console.error("Error adding funds:", error);
      toast.error("Failed to add funds");
    }
  };

  const handleFreezeWallet = async (wallet: any) => {
    try {
      const response = await fetch(`/api/wallets/${wallet.userId}/freeze`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to freeze wallet");

      toast.success(`Wallet for ${wallet.userName} has been frozen`);
      loadWallets();
    } catch (error) {
      console.error("Error freezing wallet:", error);
      toast.error("Failed to freeze wallet");
    }
  };

  const handleUnfreezeWallet = async (wallet: any) => {
    try {
      const response = await fetch(`/api/wallets/${wallet.userId}/unfreeze`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to unfreeze wallet");

      toast.success(`Wallet for ${wallet.userName} has been unfrozen`);
      loadWallets();
    } catch (error) {
      console.error("Error unfreezing wallet:", error);
      toast.error("Failed to unfreeze wallet");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {t("admin.wallets.title") || "Wallet Management"}
            </h1>
            <p className="text-muted-foreground">
              {t("admin.wallets.description") ||
                "Manage user wallets and transactions"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-8">
            <button
              onClick={() => setActiveTab("wallets")}
              className={`px-4 py-2 font-semibold border-b-2 transition-all ${
                activeTab === "wallets"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <WalletIcon className="inline mr-2 h-5 w-5" />
              Wallets
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 font-semibold border-b-2 transition-all ${
                activeTab === "transactions"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="inline mr-2 h-5 w-5" />
              Transactions
            </button>
            <button
              onClick={() => setActiveTab("report")}
              className={`px-4 py-2 font-semibold border-b-2 transition-all ${
                activeTab === "report"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Download className="inline mr-2 h-5 w-5" />
              Reports
            </button>
          </div>

          {/* Wallets Tab */}
          {activeTab === "wallets" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-card border border-border/40 rounded-lg p-6">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Status
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={(v: any) => setStatusFilter(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="frozen">Frozen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Currency
                    </label>
                    <Select
                      value={currencyFilter}
                      onValueChange={setCurrencyFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All currencies" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Currencies</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="SAR">SAR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={loadWallets} variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>

              {/* Wallets Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading wallets...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredWallets.length === 0 ? (
                    <div className="text-center py-12 bg-card border border-border/40 rounded-lg">
                      <p className="text-muted-foreground">No wallets found</p>
                    </div>
                  ) : (
                    filteredWallets.map((wallet) => (
                      <div
                        key={wallet.id}
                        className="bg-card border border-border/40 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground">
                              {wallet.userName || "Unknown User"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {wallet.userEmail}
                            </p>
                            <div className="flex gap-4 mt-4">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Balance
                                </p>
                                <p className="text-2xl font-bold text-primary">
                                  {wallet.currency} {wallet.balance.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Status
                                </p>
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                    wallet.status === "active"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {wallet.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedWallet(wallet);
                              setShowAddFundsDialog(true);
                            }}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Funds
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <div className="space-y-6">
              <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="text-left p-4 font-semibold">Type</th>
                      <th className="text-left p-4 font-semibold">Amount</th>
                      <th className="text-left p-4 font-semibold">Reason</th>
                      <th className="text-left p-4 font-semibold">Date</th>
                      <th className="text-left p-4 font-semibold">
                        Balance After
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr
                        key={txn.id}
                        className="border-b border-border hover:bg-muted/50"
                      >
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              txn.type === "payment"
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {txn.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 font-semibold">
                          {txn.currency} {txn.amount.toFixed(2)}
                        </td>
                        <td className="p-4">{txn.reason}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-semibold">
                          {txn.currency} {txn.balanceAfter.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transactions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No transactions yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Report Tab */}
          {activeTab === "report" && (
            <div className="space-y-6">
              {reportData && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-card border border-border/40 rounded-lg p-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        Total Users
                      </p>
                      <p className="text-3xl font-bold text-primary">
                        {reportData.totalUsers}
                      </p>
                    </div>
                    <div className="bg-card border border-border/40 rounded-lg p-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        Total Balance
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {reportData.totalBalance.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-card border border-border/40 rounded-lg p-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        Total Deposited
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {reportData.totalDeposited.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-card border border-border/40 rounded-lg p-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        Total Payments
                      </p>
                      <p className="text-3xl font-bold text-red-600">
                        {reportData.totalPayments.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Transactions List */}
                  <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="text-left p-4 font-semibold">Type</th>
                          <th className="text-left p-4 font-semibold">
                            Amount
                          </th>
                          <th className="text-left p-4 font-semibold">
                            Reason
                          </th>
                          <th className="text-left p-4 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.transactions.map(
                          (txn: WalletTransaction) => (
                            <tr
                              key={txn.id}
                              className="border-b border-border hover:bg-muted/50"
                            >
                              <td className="p-4">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    txn.type === "payment"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {txn.type.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-4 font-semibold">
                                {txn.amount.toFixed(2)}
                              </td>
                              <td className="p-4">{txn.reason}</td>
                              <td className="p-4 text-sm text-muted-foreground">
                                {new Date(txn.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFundsDialog} onOpenChange={setShowAddFundsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Funds to Wallet</DialogTitle>
            <DialogDescription>
              Add credit to {selectedWallet?.userName}'s wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Amount ({selectedWallet?.currency})
              </label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                step="0.01"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Reason
              </label>
              <Input
                placeholder="e.g., Customer refund, promotional credit"
                value={addReason}
                onChange={(e) => setAddReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddFundsDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddFunds}>Add Funds</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
