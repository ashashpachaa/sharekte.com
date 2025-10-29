import { useState, useMemo } from "react";

export function useSearch<T>(
  items: T[],
  searchFields: (keyof T)[] | ((item: T, query: string) => boolean),
  initialQuery: string = ""
) {
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => {
    if (!query.trim()) {
      return items;
    }

    const lowerQuery = query.toLowerCase();

    if (typeof searchFields === "function") {
      return items.filter((item) => searchFields(item, lowerQuery));
    }

    return items.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];
        if (typeof value === "string") {
          return value.toLowerCase().includes(lowerQuery);
        }
        if (typeof value === "number") {
          return value.toString().includes(lowerQuery);
        }
        return false;
      });
    });
  }, [items, query, searchFields]);

  return {
    query,
    setQuery,
    results,
    isSearching: query.trim().length > 0,
  };
}
