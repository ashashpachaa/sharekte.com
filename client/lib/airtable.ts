const AIRTABLE_API_TOKEN = import.meta.env.VITE_AIRTABLE_API_TOKEN;
const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

export interface Company {
  id: string;
  fields: {
    "Company Name"?: string;
    "Company Number"?: string;
    "Incorporate Date"?: string;
    "Incorporate Year"?: number;
    Country?: string;
    Revenue?: string;
    Industry?: string;
    [key: string]: unknown;
  };
}

interface AirtableResponse {
  records: Company[];
  offset?: string;
}

export async function fetchCompanies(filters?: {
  country?: string;
  year?: number;
}): Promise<Company[]> {
  if (!AIRTABLE_API_TOKEN) {
    console.error("Airtable API token not configured");
    return [];
  }

  try {
    const params = new URLSearchParams();

    if (filters?.country) {
      params.append(
        "filterByFormula",
        `{Country} = "${filters.country}"`
      );
    }

    if (filters?.year) {
      params.append(
        "filterByFormula",
        filters.country
          ? `AND({Country} = "${filters.country}", {Incorporate Year} = ${filters.year})`
          : `{Incorporate Year} = ${filters.year}`
      );
    }

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?${params.toString()}`;
    console.log("Fetching from URL:", url.replace(AIRTABLE_API_TOKEN, "***"));

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Airtable API error [${response.status}]:`, errorData);
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
    }

    const data: AirtableResponse = await response.json();
    return data.records;
  } catch (error) {
    console.error("Failed to fetch companies from Airtable:", error);
    return [];
  }
}

export async function getCountries(): Promise<string[]> {
  if (!AIRTABLE_API_TOKEN) {
    console.error("Airtable API token not configured");
    return [];
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;
    console.log("Fetching countries from:", url.replace(AIRTABLE_API_TOKEN, "***"));

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Airtable API error [${response.status}]:`, errorData);
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
    }

    const data: AirtableResponse = await response.json();
    const countries = new Set<string>();

    data.records.forEach((record) => {
      const country = record.fields.Country;
      if (country) {
        countries.add(String(country));
      }
    });

    return Array.from(countries).sort();
  } catch (error) {
    console.error("Failed to fetch countries:", error);
    return [];
  }
}

export async function getYears(): Promise<number[]> {
  if (!AIRTABLE_API_TOKEN) {
    return [];
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data: AirtableResponse = await response.json();
    const years = new Set<number>();

    data.records.forEach((record) => {
      const year = record.fields["Incorporate Year"];
      if (year) {
        years.add(Number(year));
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  } catch (error) {
    console.error("Failed to fetch years:", error);
    return [];
  }
}
