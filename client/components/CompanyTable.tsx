import { useState, useEffect } from "react";
import { fetchCompanies, getCountries, getYears, type Company } from "@/lib/airtable";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Filter } from "lucide-react";

export function CompanyTable() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load filter options on mount
  useEffect(() => {
    async function loadFilterOptions() {
      const [countriesData, yearsData] = await Promise.all([
        getCountries(),
        getYears(),
      ]);
      setCountries(countriesData);
      setYears(yearsData);
    }

    loadFilterOptions();
  }, []);

  // Load companies based on filters
  useEffect(() => {
    async function loadCompanies() {
      setLoading(true);
      const filters = {
        country: selectedCountry || undefined,
        year: selectedYear ? Number(selectedYear) : undefined,
      };
      const data = await fetchCompanies(filters);
      setCompanies(data);
      setLoading(false);
    }

    loadCompanies();
  }, [selectedCountry, selectedYear]);

  const handleSelectCompany = (companyId: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      newSelected.add(companyId);
    }
    setSelectedCompanies(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCompanies.size === companies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(companies.map((c) => c.id)));
    }
  };

  const handleBuySelected = () => {
    if (selectedCompanies.size === 0) {
      alert("Please select at least one company");
      return;
    }
    const selectedList = companies
      .filter((c) => selectedCompanies.has(c.id))
      .map((c) => c.fields["Company Name"] || "Unknown")
      .join(", ");
    alert(`Purchase initiated for: ${selectedList}\n\nThis will be connected to payment processing.`);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card border border-border/40 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Filters</h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Country Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Incorporate Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3 py-2 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCountry("");
                setSelectedYear("");
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading companies...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No companies found matching your filters</p>
          </div>
        ) : (
          <>
            {/* Action Bar */}
            <div className="border-b border-border/40 px-6 py-4 flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedCompanies.size === companies.length && companies.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all companies"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedCompanies.size} of {companies.length} selected
                </span>
              </div>
              {selectedCompanies.size > 0 && (
                <Button
                  className="bg-primary hover:bg-primary-600 text-white gap-2"
                  onClick={handleBuySelected}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Buy Selected ({selectedCompanies.size})
                </Button>
              )}
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="w-12 px-6 py-3 text-left">
                      <Checkbox
                        checked={selectedCompanies.size === companies.length && companies.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Company Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Company Number
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Incorporate Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Incorporate Year
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Country
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">
                      Option Include
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => {
                    const isSelected = selectedCompanies.has(company.id);
                    const companyName = company.fields["Company name"] || "N/A";

                    // Handle option include which is an array
                    const optionIncludeRaw = company.fields["option include"];
                    const optionInclude = Array.isArray(optionIncludeRaw)
                      ? optionIncludeRaw.join(", ")
                      : (optionIncludeRaw || "—");

                    // Handle Country field which has a trailing space
                    const country = company.fields["Country "] || "N/A";

                    return (
                      <tr
                        key={company.id}
                        className={`border-b border-border/40 hover:bg-muted/50 transition-colors ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="w-12 px-6 py-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectCompany(company.id)}
                            aria-label={`Select ${companyName}`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">
                            {companyName}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-foreground">
                            {company.fields["Company number"] || "N/A"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-foreground">
                            {company.fields["Incorporate date"] || "N/A"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-foreground">
                            {company.fields["Incorporate Year"] || "N/A"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-foreground">
                            {country}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="text-foreground font-medium text-sm">
                            {optionInclude}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary-600 text-white gap-1"
                            onClick={() => {
                              alert(
                                `Purchase initiated for ${companyName}\n\nThis will be connected to payment processing.`
                              );
                            }}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Buy Now
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
