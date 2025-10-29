export interface Company {
  id: string;
  fields: {
    "Company Name"?: string;
    "Company Number"?: string;
    "Incorporate Date"?: string;
    "Incorporate Year"?: number;
    "Country "?: string;
    Country?: string;
    Revenue?: string;
    Industry?: string;
    [key: string]: unknown;
  };
}

export async function fetchCompanies(filters?: {
  country?: string;
  year?: number;
}): Promise<Company[]> {
  try {
    const params = new URLSearchParams();

    if (filters?.country) {
      params.append("country", filters.country);
    }

    if (filters?.year) {
      params.append("year", String(filters.year));
    }

    const url = `/api/companies?${params.toString()}`;
    console.log("Fetching companies from:", url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `API error [${response.status}]:`,
        errorData
      );
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: Company[] = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    return [];
  }
}

export async function getCountries(): Promise<string[]> {
  try {
    const url = `/api/countries`;
    console.log("Fetching countries from:", url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `API error [${response.status}]:`,
        errorData
      );
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const countries: string[] = await response.json();
    return countries;
  } catch (error) {
    console.error("Failed to fetch countries:", error);
    return [];
  }
}

export async function getYears(): Promise<number[]> {
  try {
    const url = `/api/years`;
    console.log("Fetching years from:", url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `API error [${response.status}]:`,
        errorData
      );
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const years: number[] = await response.json();
    return years;
  } catch (error) {
    console.error("Failed to fetch years:", error);
    return [];
  }
}
