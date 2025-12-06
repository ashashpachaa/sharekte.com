import { useQuery } from "@tanstack/react-query";
import { fetchAllCompanies, getCompany } from "@/lib/company-management";
import type { CompanyData } from "@/lib/company-management";

/**
 * Hook for fetching all companies with automatic caching
 * Stale time: 5 minutes
 * Cache time: 10 minutes
 */
export function useCompanies(enabled: boolean = true) {
  return useQuery<CompanyData[]>({
    queryKey: ["companies"],
    queryFn: () => fetchAllCompanies(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook for fetching a single company by ID
 */
export function useCompany(id: string | null) {
  return useQuery<CompanyData | null>({
    queryKey: ["company", id],
    queryFn: () => (id ? getCompany(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Hook for fetching active companies only
 */
export function useActiveCompanies(enabled: boolean = true) {
  const { data, isLoading, error } = useCompanies(enabled);

  const activeCompanies = data?.filter((c) => c.status === "active") || [];

  return {
    companies: activeCompanies,
    isLoading,
    error,
    data,
  };
}
