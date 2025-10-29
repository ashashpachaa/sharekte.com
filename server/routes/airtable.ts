import { RequestHandler } from "express";

const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

// Log token status on startup
if (!AIRTABLE_API_TOKEN) {
  console.error("⚠️ AIRTABLE_API_TOKEN is not configured!");
  console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('AIRTABLE')));
} else {
  console.log("✅ AIRTABLE_API_TOKEN is configured (length:", AIRTABLE_API_TOKEN.length, ")");
}

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

export const getCompanies: RequestHandler = async (req, res) => {
  if (!AIRTABLE_API_TOKEN) {
    console.error("❌ Airtable API token not configured");
    return res.status(500).json({ error: "Airtable API token not configured" });
  }

  try {
    const { country, year } = req.query;

    const params = new URLSearchParams();

    if (country) {
      params.append("filterByFormula", `{Country} = "${country}"`);
    }

    if (year) {
      if (country) {
        params.append(
          "filterByFormula",
          `AND({Country} = "${country}", {Incorporate Year} = ${year})`
        );
      } else {
        params.append("filterByFormula", `{Incorporate Year} = ${year}`);
      }
    }

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?${params.toString()}`;
    console.log("📋 Fetching from Airtable:", url.substring(0, 100) + "...");
    console.log("🔑 Token preview:", AIRTABLE_API_TOKEN.substring(0, 20) + "...");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📊 Airtable response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Airtable API error [${response.status}]:`,
        errorText
      );
      return res.status(response.status).json({
        error: `Airtable API error: ${response.status} ${response.statusText}`,
        details: errorText,
      });
    }

    const data: AirtableResponse = await response.json();
    console.log("✅ Fetched", data.records.length, "companies");

    // Log first record fields for debugging
    if (data.records.length > 0) {
      console.log("📋 First record fields:", Object.keys(data.records[0].fields));
      console.log("📋 First record data:", JSON.stringify(data.records[0].fields, null, 2));
    }

    res.json(data.records);
  } catch (error) {
    console.error("❌ Failed to fetch companies from Airtable:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
};

export const getCountries: RequestHandler = async (req, res) => {
  if (!AIRTABLE_API_TOKEN) {
    console.error("❌ Airtable API token not configured");
    return res.status(500).json({ error: "Airtable API token not configured" });
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;
    console.log("🌍 Fetching countries from Airtable...");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📊 Airtable response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Airtable API error [${response.status}]:`,
        errorText
      );
      return res.status(response.status).json({
        error: `Airtable API error: ${response.status} ${response.statusText}`,
        details: errorText,
      });
    }

    const data: AirtableResponse = await response.json();
    const countries = new Set<string>();

    data.records.forEach((record) => {
      const country = record.fields.Country;
      if (country) {
        countries.add(String(country));
      }
    });

    const result = Array.from(countries).sort();
    console.log("✅ Fetched", result.length, "countries");
    res.json(result);
  } catch (error) {
    console.error("❌ Failed to fetch countries:", error);
    res.status(500).json({ error: "Failed to fetch countries" });
  }
};

export const getYears: RequestHandler = async (req, res) => {
  if (!AIRTABLE_API_TOKEN) {
    console.error("❌ Airtable API token not configured");
    return res.status(500).json({ error: "Airtable API token not configured" });
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;
    console.log("📅 Fetching years from Airtable...");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📊 Airtable response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Airtable API error [${response.status}]:`,
        errorText
      );
      return res.status(response.status).json({
        error: `Airtable API error: ${response.status} ${response.statusText}`,
        details: errorText,
      });
    }

    const data: AirtableResponse = await response.json();
    const years = new Set<number>();

    data.records.forEach((record) => {
      const year = record.fields["Incorporate Year"];
      if (year) {
        years.add(Number(year));
      }
    });

    const result = Array.from(years).sort((a, b) => b - a);
    console.log("✅ Fetched", result.length, "years");
    res.json(result);
  } catch (error) {
    console.error("❌ Failed to fetch years:", error);
    res.status(500).json({ error: "Failed to fetch years" });
  }
};
