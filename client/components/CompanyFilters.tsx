import { useState } from "react";
import {
  CompanyFilters,
  CompanyStatus,
  CompanyType,
  PaymentStatus,
  RefundStatus,
  SortField,
  SortOrder,
  COMPANY_TYPES,
} from "@/lib/company-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CheckboxGroup,
  CheckboxGroupItem,
} from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { X, Filter, SortAsc, Search } from "lucide-react";

interface CompanyFiltersProps {
  onFiltersChange: (filters: CompanyFilters) => void;
  onSortChange: (field: SortField, order: SortOrder) => void;
  countries: string[];
}

export function CompanyFiltersComponent({
  onFiltersChange,
  onSortChange,
  countries,
}: CompanyFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<CompanyStatus[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<CompanyType[]>([]);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<
    PaymentStatus[]
  >([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [renewalDaysRange, setRenewalDaysRange] = useState<[number, number]>([
    0, 365,
  ]);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    applyFilters({
      searchTerm: value,
      status: selectedStatuses,
      country: selectedCountries,
      type: selectedTypes,
      paymentStatus: selectedPaymentStatus,
      priceRange: { min: priceRange[0], max: priceRange[1] },
      renewalDaysRange: {
        min: renewalDaysRange[0],
        max: renewalDaysRange[1],
      },
    });
  };

  const handleStatusChange = (status: CompanyStatus, checked: boolean) => {
    const newStatuses = checked
      ? [...selectedStatuses, status]
      : selectedStatuses.filter((s) => s !== status);
    setSelectedStatuses(newStatuses);
    applyFilters({
      searchTerm,
      status: newStatuses.length > 0 ? newStatuses : undefined,
      country: selectedCountries,
      type: selectedTypes,
      paymentStatus: selectedPaymentStatus,
      priceRange: { min: priceRange[0], max: priceRange[1] },
      renewalDaysRange: {
        min: renewalDaysRange[0],
        max: renewalDaysRange[1],
      },
    });
  };

  const handleCountryChange = (country: string, checked: boolean) => {
    const newCountries = checked
      ? [...selectedCountries, country]
      : selectedCountries.filter((c) => c !== country);
    setSelectedCountries(newCountries);
    applyFilters({
      searchTerm,
      status: selectedStatuses,
      country: newCountries.length > 0 ? newCountries : undefined,
      type: selectedTypes,
      paymentStatus: selectedPaymentStatus,
      priceRange: { min: priceRange[0], max: priceRange[1] },
      renewalDaysRange: {
        min: renewalDaysRange[0],
        max: renewalDaysRange[1],
      },
    });
  };

  const handleTypeChange = (type: CompanyType, checked: boolean) => {
    const newTypes = checked
      ? [...selectedTypes, type]
      : selectedTypes.filter((t) => t !== type);
    setSelectedTypes(newTypes);
    applyFilters({
      searchTerm,
      status: selectedStatuses,
      country: selectedCountries,
      type: newTypes.length > 0 ? newTypes : undefined,
      paymentStatus: selectedPaymentStatus,
      priceRange: { min: priceRange[0], max: priceRange[1] },
      renewalDaysRange: {
        min: renewalDaysRange[0],
        max: renewalDaysRange[1],
      },
    });
  };

  const handlePaymentStatusChange = (
    status: PaymentStatus,
    checked: boolean
  ) => {
    const newPaymentStatus = checked
      ? [...selectedPaymentStatus, status]
      : selectedPaymentStatus.filter((s) => s !== status);
    setSelectedPaymentStatus(newPaymentStatus);
    applyFilters({
      searchTerm,
      status: selectedStatuses,
      country: selectedCountries,
      type: selectedTypes,
      paymentStatus:
        newPaymentStatus.length > 0 ? newPaymentStatus : undefined,
      priceRange: { min: priceRange[0], max: priceRange[1] },
      renewalDaysRange: {
        min: renewalDaysRange[0],
        max: renewalDaysRange[1],
      },
    });
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
    applyFilters({
      searchTerm,
      status: selectedStatuses,
      country: selectedCountries,
      type: selectedTypes,
      paymentStatus: selectedPaymentStatus,
      priceRange: { min: range[0], max: range[1] },
      renewalDaysRange: {
        min: renewalDaysRange[0],
        max: renewalDaysRange[1],
      },
    });
  };

  const handleRenewalDaysRangeChange = (range: [number, number]) => {
    setRenewalDaysRange(range);
    applyFilters({
      searchTerm,
      status: selectedStatuses,
      country: selectedCountries,
      type: selectedTypes,
      paymentStatus: selectedPaymentStatus,
      priceRange: { min: priceRange[0], max: priceRange[1] },
      renewalDaysRange: { min: range[0], max: range[1] },
    });
  };

  const handleSortFieldChange = (field: SortField) => {
    setSortField(field);
    onSortChange(field, sortOrder);
  };

  const handleSortOrderChange = (order: SortOrder) => {
    setSortOrder(order);
    onSortChange(sortField, order);
  };

  const applyFilters = (filters: CompanyFilters) => {
    onFiltersChange(filters);
  };

  const hasActiveFilters =
    searchTerm ||
    selectedStatuses.length > 0 ||
    selectedCountries.length > 0 ||
    selectedTypes.length > 0 ||
    selectedPaymentStatus.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000 ||
    renewalDaysRange[0] > 0 ||
    renewalDaysRange[1] < 365;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatuses([]);
    setSelectedCountries([]);
    setSelectedTypes([]);
    setSelectedPaymentStatus([]);
    setPriceRange([0, 10000]);
    setRenewalDaysRange([0, 365]);
    applyFilters({});
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded-lg border">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by company name, number, or client..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2">
        <Select value={sortField} onValueChange={handleSortFieldChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="price">Sort by Price</SelectItem>
            <SelectItem value="renewal">Sort by Renewal</SelectItem>
            <SelectItem value="status">Sort by Status</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={handleSortOrderChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Filters */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Advanced Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                Active
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 space-y-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="font-semibold">Status</Label>
            <div className="space-y-2">
              {(
                [
                  "active",
                  "expired",
                  "cancelled",
                  "refunded",
                  "available",
                ] as CompanyStatus[]
              ).map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`status-${status}`}
                    checked={selectedStatuses.includes(status)}
                    onChange={(e) =>
                      handleStatusChange(status, e.target.checked)
                    }
                    className="rounded"
                  />
                  <Label htmlFor={`status-${status}`} className="capitalize">
                    {status}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Country Filter */}
          <div className="space-y-2">
            <Label className="font-semibold">Country</Label>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {Array.from(new Set(countries || [])).map((country) => (
                <div key={`country-${country}`} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`country-${country}`}
                    checked={selectedCountries.includes(country)}
                    onChange={(e) =>
                      handleCountryChange(country, e.target.checked)
                    }
                    className="rounded"
                  />
                  <Label htmlFor={`country-${country}`}>{country}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <Label className="font-semibold">Company Type</Label>
            <div className="space-y-2">
              {COMPANY_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`type-${type}`}
                    checked={selectedTypes.includes(type)}
                    onChange={(e) => handleTypeChange(type, e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor={`type-${type}`}>{type}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status Filter */}
          <div className="space-y-2">
            <Label className="font-semibold">Payment Status</Label>
            <div className="space-y-2">
              {(["paid", "pending", "failed", "refunded"] as PaymentStatus[]).map(
                (status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`payment-${status}`}
                      checked={selectedPaymentStatus.includes(status)}
                      onChange={(e) =>
                        handlePaymentStatusChange(status, e.target.checked)
                      }
                      className="rounded"
                    />
                    <Label htmlFor={`payment-${status}`} className="capitalize">
                      {status}
                    </Label>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label className="font-semibold">
              Price Range: ${priceRange[0]} - ${priceRange[1]}
            </Label>
            <Slider
              value={priceRange}
              onValueChange={handlePriceRangeChange}
              min={0}
              max={10000}
              step={100}
              className="w-full"
            />
          </div>

          {/* Renewal Days Range */}
          <div className="space-y-2">
            <Label className="font-semibold">
              Renewal Days: {renewalDaysRange[0]} - {renewalDaysRange[1]} days
            </Label>
            <Slider
              value={renewalDaysRange}
              onValueChange={handleRenewalDaysRangeChange}
              min={0}
              max={365}
              step={1}
              className="w-full"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              className="w-full"
              onClick={clearFilters}
            >
              <X className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {hasActiveFilters && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{Object.keys({ searchTerm, selectedStatuses, selectedCountries, selectedTypes, selectedPaymentStatus }).filter(k => (k as any)).length} filters active</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-auto p-0"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
