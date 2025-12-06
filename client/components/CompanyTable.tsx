import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  MoreHorizontal,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import {
  CompanyData,
  STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  formatPrice,
  formatDate,
} from "@/lib/company-management";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";

interface CompanyTableProps {
  companies: CompanyData[];
  onViewDetails?: (company: CompanyData) => void;
  onEdit?: (company: CompanyData) => void;
  onDelete?: (id: string) => void;
  onRenew?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  isAdmin?: boolean;
  disableInternalPaging?: boolean; // If true, don't limit to 10 items (let parent handle pagination)
}

// Cache for companies data with expiry
let companiesCache: { data: CompanyData[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Pending fetch promise to deduplicate concurrent requests
let pendingFetch: Promise<CompanyData[]> | null = null;

async function fetchCompaniesWithRetry(): Promise<CompanyData[]> {
  // Return cached data if available and not expired
  if (
    companiesCache &&
    Date.now() - companiesCache.timestamp < CACHE_DURATION
  ) {
    return companiesCache.data;
  }

  // If a fetch is already in progress, return that promise
  if (pendingFetch) {
    return pendingFetch;
  }

  // Create new fetch promise with exponential backoff retry
  pendingFetch = (async () => {
    let retries = 0;
    const maxRetries = 3;
    let lastError: Error | null = null;

    while (retries < maxRetries) {
      try {
        const response = await fetch("/api/companies");

        if (response.ok) {
          const data = await response.json();

          // Cache the successful response
          companiesCache = {
            data,
            timestamp: Date.now(),
          };

          pendingFetch = null;
          return data;
        } else if (response.status === 429) {
          // Rate limited - exponential backoff
          const waitTime = Math.pow(2, retries) * 1000; // 1s, 2s, 4s
          console.warn(
            `Rate limited (429). Retry ${retries + 1}/${maxRetries} after ${waitTime}ms`,
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          retries++;
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retries++;

        if (retries < maxRetries) {
          const waitTime = Math.pow(2, retries - 1) * 1000;
          console.warn(
            `Fetch failed. Retry ${retries}/${maxRetries} after ${waitTime}ms`,
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    pendingFetch = null;
    throw (
      lastError || new Error("Failed to fetch companies after maximum retries")
    );
  })();

  return pendingFetch;
}

export const CompanyTable = memo(function CompanyTable({
  companies = [],
  onViewDetails,
  onEdit,
  onDelete,
  onRenew,
  onStatusChange,
  isAdmin = false,
  disableInternalPaging = false,
}: CompanyTableProps) {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const {
    currency,
    formatPrice: formatWithCurrency,
    formatPriceAlreadyConverted,
    rates,
    convertPrice,
  } = useCurrency();
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [loadedCompanies, setLoadedCompanies] =
    useState<CompanyData[]>(companies);
  const [isLoading, setIsLoading] = useState(
    !companies || companies.length === 0,
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [displayCount, setDisplayCount] = useState(10);
  const hasFetched = useRef(false);

  const handleAddToCart = (company: CompanyData) => {
    addItem({
      id: company.id,
      name: company.companyName,
      price: company.purchasePrice,
      companyNumber: company.companyNumber,
      country: company.country,
      incorporationDate: company.incorporationDate,
      incorporationYear: company.incorporationYear?.toString(),
      renewalFees: company.renewalFee,
    });
    toast.success(`${company.companyName} added to cart`);
  };

  useEffect(() => {
    // If no companies passed as prop, fetch from API (only once per component mount)
    if (!companies || companies.length === 0) {
      if (hasFetched.current) {
        return;
      }
      hasFetched.current = true;

      setIsLoading(true);
      setError(null);

      fetchCompaniesWithRetry()
        .then((data) => {
          setLoadedCompanies(data);
          setError(null);
        })
        .catch((err) => {
          console.error("Error fetching companies:", err);
          setError(
            err instanceof Error ? err.message : "Failed to load companies",
          );
          setLoadedCompanies([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setLoadedCompanies(companies);
      setIsLoading(false);
    }
  }, []);

  const handleDelete = (id: string) => {
    if (onDelete) {
      onDelete(id);
      setShowDeleteDialog(null);
      toast.success("Company deleted successfully");
    }
  };

  const handleRenew = (id: string) => {
    if (onRenew) {
      onRenew(id);
      toast.success("Company renewal processed");
    }
  };

  const safeCompanies = Array.isArray(loadedCompanies) ? loadedCompanies : [];

  // Filter companies based on selected criteria
  const filteredCompanies = safeCompanies.filter((company) => {
    const countryMatch =
      !selectedCountry || company.country === selectedCountry;
    const yearMatch =
      !selectedYear || company.incorporationYear === parseInt(selectedYear);
    const isActive = company.status === "active"; // Only show active companies
    return countryMatch && yearMatch && isActive;
  });

  // Get unique countries and years for filter options (only from available/non-sold companies)
  const availableCompanies = safeCompanies.filter((c) => c.status !== "sold");

  const uniqueCountries = Array.from(
    new Set(availableCompanies.map((c) => c.country).filter(Boolean)),
  ).sort();

  const uniqueYears = Array.from(
    new Set(availableCompanies.map((c) => c.incorporationYear).filter(Boolean)),
  ).sort((a, b) => b - a);

  // Display only the first `displayCount` items if internal paging is enabled
  // Otherwise, show all filtered companies (parent component handles pagination)
  const displayedCompanies = disableInternalPaging
    ? filteredCompanies
    : filteredCompanies.slice(0, displayCount);
  const hasMoreItems = disableInternalPaging
    ? false
    : filteredCompanies.length > displayCount;

  return (
    <>
      <div className="w-full">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("table.filterByCountry")}
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setDisplayCount(10);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t("table.allCountries")}</option>
              {uniqueCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("table.filterByYear")}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setDisplayCount(10);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t("table.allYears")}</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {(selectedCountry || selectedYear) && (
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCountry("");
                  setSelectedYear("");
                  setDisplayCount(10);
                }}
                className="w-full sm:w-auto"
              >
                {t("table.clearFilters")}
              </Button>
            </div>
          )}
        </div>

        {/* Results info */}
        <div className="mb-4 text-sm text-gray-600 px-4">
          {t("table.showing", {
            count: displayedCompanies.length,
            total: filteredCompanies.length,
          })}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">{t("table.loadingCompanies")}</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                hasFetched.current = false;
                setIsLoading(true);
                setError(null);
                companiesCache = null;
                pendingFetch = null;
                fetchCompaniesWithRetry()
                  .then((data) => {
                    setLoadedCompanies(data);
                    setError(null);
                  })
                  .catch((err) => {
                    console.error("Error fetching companies:", err);
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Failed to load companies",
                    );
                    setLoadedCompanies([]);
                  })
                  .finally(() => {
                    setIsLoading(false);
                  });
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("table.retry")}
            </Button>
          </div>
        ) : safeCompanies.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">{t("table.noCompanies")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">
                    {t("table.companyName")}
                  </TableHead>
                  <TableHead className="font-semibold">
                    {t("table.country")}
                  </TableHead>
                  <TableHead className="font-semibold">
                    {t("table.companyNumber")}
                  </TableHead>
                  <TableHead className="font-semibold">
                    {t("table.incorporateDate")}
                  </TableHead>
                  <TableHead className="font-semibold">
                    {t("table.incorporateYear")}
                  </TableHead>
                  <TableHead className="font-semibold">
                    {t("table.price")}
                  </TableHead>
                  <TableHead className="font-semibold">
                    {t("table.optionsIncluded")}
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    {t("table.action")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedCompanies.map((company) => (
                  <TableRow
                    key={company.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      <button
                        onClick={() => onViewDetails?.(company)}
                        className="text-blue-600 hover:underline"
                      >
                        {company.companyName}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">{company.country}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {company.companyNumber}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(company.incorporationDate)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {company.incorporationYear}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatPriceAlreadyConverted(
                        // If company has a different currency, we need to normalize to USD first, then convert to user's currency
                        company.currency &&
                          company.currency !== "USD" &&
                          rates[company.currency as any]
                          ? convertPrice(
                              company.purchasePrice /
                                (rates[company.currency as any]?.rate || 1),
                            )
                          : convertPrice(company.purchasePrice),
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {company.optionsInclude &&
                      company.optionsInclude.length > 0 ? (
                        <span className="text-gray-700">
                          {company.optionsInclude.join(", ")}
                        </span>
                      ) : (
                        <span className="text-gray-400">{t("table.none")}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdmin ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onViewDetails?.(company)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              {t("table.viewDetails")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit?.(company)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              {t("table.edit")}
                            </DropdownMenuItem>
                            {company.status !== "expired" &&
                              company.status !== "cancelled" && (
                                <DropdownMenuItem
                                  onClick={() => handleRenew(company.id)}
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  {t("table.renew")}
                                </DropdownMenuItem>
                              )}
                            {(company.status === "refunded" ||
                              company.status === "cancelled") && (
                              <DropdownMenuItem
                                onClick={() =>
                                  onStatusChange?.(company.id, "available")
                                }
                              >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setShowDeleteDialog(company.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAddToCart(company)}
                          className="gap-1"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {t("table.addToCart")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Show More Button */}
        {hasMoreItems && (
          <div className="flex justify-center p-6">
            <Button
              onClick={() => setDisplayCount((prev) => prev + 10)}
              variant="outline"
              className="px-8"
            >
              Show More
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog !== null}
        onOpenChange={(open) => !open && setShowDeleteDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this company? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (showDeleteDialog) {
                  handleDelete(showDeleteDialog);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
