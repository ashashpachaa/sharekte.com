import { RequestHandler } from "express";
import {
  CompanyData,
  CompanyStatus,
  PaymentStatus,
  calculateExpiryDate,
  calculateRenewalDaysLeft,
  determineStatus,
} from "../../client/lib/company-management";

// All company data comes from Airtable - no local in-memory storage
// Airtable provides persistent storage and real-time synchronization

// Server-side cache for companies data
let serverCache: {
  data: CompanyData[];
  timestamp: number;
} | null = null;
const SERVER_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Pending Airtable fetch to deduplicate concurrent requests
let pendingAirtableFetch: Promise<CompanyData[]> | null = null;

// Helper function to get today's date as string
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

// Helper function to generate unique ID
function generateId(): string {
  return (
    "rec_" +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
}

// Helper function to fetch companies data from Airtable (used by multiple endpoints)
async function fetchCompaniesData(): Promise<CompanyData[]> {
  try {
    // Check server cache first
    if (
      serverCache &&
      Date.now() - serverCache.timestamp < SERVER_CACHE_DURATION
    ) {
      return serverCache.data;
    }

    // If fetch is already in progress, wait for it
    if (pendingAirtableFetch) {
      return await pendingAirtableFetch;
    }

    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q"; // Updated to user's new Airtable base
    const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

    if (!AIRTABLE_API_TOKEN) {
      console.error("AIRTABLE_API_TOKEN not configured");
      return [];
    }

    pendingAirtableFetch = (async () => {
      try {
        const response = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
          {
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
            },
          },
        );

        if (!response.ok) {
          const error = await response.text();
          console.error("Airtable API error:", response.status, error);
          throw new Error(`Airtable API error: ${response.status}`);
        }

        const data = await response.json();
        const companies: CompanyData[] = data.records.map((record: any) => {
          const fields = record.fields;
          const incorporationDate =
            fields["Incorporate date"] || getTodayString();
          // Try multiple field name variations for status/statues field
          const rawStatus =
            fields["Statues "] ||
            fields["Statues"] ||
            fields["Status"] ||
            "active";
          const statusValue = rawStatus.toLowerCase() as CompanyStatus;

          // Try multiple field name variations for price field
          const priceValue =
            fields["Price"] ||
            fields["price"] ||
            fields["Purchase Price"] ||
            fields["purchase price"] ||
            fields["Purchase price"] ||
            "0";
          const purchasePrice = parseFloat(String(priceValue));

          // Try to get currency from Airtable or default to USD
          const currencyValue = fields["Currency"] || fields["currency"] || "USD";

          return {
            id: record.id,
            companyName: fields["Company name"] || "",
            companyNumber: String(fields["Company number"] || ""),
            country: fields["country"] || "",
            type: "LTD" as any,
            incorporationDate: incorporationDate,
            incorporationYear: parseInt(
              String(fields["Incorporate Year"] || new Date().getFullYear()),
            ),
            purchasePrice: purchasePrice,
            renewalFee: parseFloat(String(fields["Renewal fees"] || "0")),
            currency: String(currencyValue) as any,
            expiryDate: calculateExpiryDate(incorporationDate),
            renewalDate: calculateExpiryDate(incorporationDate),
            renewalDaysLeft: calculateRenewalDaysLeft(
              calculateExpiryDate(incorporationDate),
            ),
            status: statusValue,
            paymentStatus: "paid" as const,
            refundStatus: "not-refunded" as const,
            clientName: fields["Client Name"] || "",
            clientEmail: fields["Client Email"] || "",
            clientPhone: fields["Client Phone"],
            industry: fields.Industry,
            revenue: fields.Revenue,
            adminNotes: fields["Admin Notes"],
            internalNotes: fields["Internal Notes"],
            optionsInclude: Array.isArray(fields["option include"])
              ? fields["option include"]
              : [],
            createdBy: "airtable",
            createdAt: getTodayString(),
            updatedAt: getTodayString(),
            updatedBy: "airtable",
            tags: [],
            documents: [],
            activityLog: [
              {
                id: "log_1",
                timestamp: getTodayString(),
                action: "Imported from Airtable",
                performedBy: "system",
                details: `Company ${fields["Company name"]} imported from Airtable`,
              },
            ],
            ownershipHistory: [],
          };
        });

        serverCache = {
          data: companies,
          timestamp: Date.now(),
        };

        return companies;
      } finally {
        pendingAirtableFetch = null;
      }
    })();

    return await pendingAirtableFetch;
  } catch (error) {
    console.error("Error fetching companies data:", error);
    return [];
  }
}

// Helper function to create a new company
function createNewCompany(
  data: Partial<CompanyData> & {
    companyName: string;
    companyNumber: string;
    country: string;
    type: any;
    incorporationDate: string;
    incorporationYear: number;
    purchasePrice: number;
    renewalFee: number;
    currency: string;
    clientName: string;
    clientEmail: string;
  },
): CompanyData {
  const expiryDate = calculateExpiryDate(data.incorporationDate);
  const renewalDate = calculateExpiryDate(data.incorporationDate);
  const renewalDaysLeft = calculateRenewalDaysLeft(renewalDate);

  return {
    id: generateId(),
    companyName: data.companyName,
    companyNumber: data.companyNumber,
    country: data.country,
    type: data.type,
    incorporationDate: data.incorporationDate,
    incorporationYear: data.incorporationYear,
    purchasePrice: data.purchasePrice,
    renewalFee: data.renewalFee,
    currency: data.currency,
    expiryDate,
    renewalDate,
    renewalDaysLeft,
    status: (data.status || "available") as CompanyStatus,
    paymentStatus: (data.paymentStatus || "pending") as PaymentStatus,
    refundStatus: data.refundStatus || "not-refunded",
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    clientPhone: data.clientPhone,
    industry: data.industry,
    revenue: data.revenue,
    adminNotes: data.adminNotes,
    internalNotes: data.internalNotes,
    createdBy: data.createdBy || "system",
    createdAt: getTodayString(),
    updatedAt: getTodayString(),
    updatedBy: data.updatedBy || "system",
    tags: data.tags || [],
    documents: data.documents || [],
    activityLog: [
      {
        id: "log_1",
        timestamp: getTodayString(),
        action: "Company Created",
        performedBy: data.createdBy || "system",
        details: `Company ${data.companyName} was created`,
      },
    ],
    ownershipHistory: [],
  };
}

// Get all companies from Airtable with caching and deduplication
export const getCompanies: RequestHandler = async (req, res) => {
  try {
    const companies = await fetchCompaniesData();
    res.set("Cache-Control", "public, max-age=120");
    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
};

// Get single company from Airtable
export const getCompany: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q"; // Updated to user's new Airtable base
    const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

    if (!AIRTABLE_API_TOKEN) {
      return res
        .status(500)
        .json({ error: "Airtable integration not configured" });
    }

    // Fetch from Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${id}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        },
      },
    );

    if (!response.ok) {
      return res.status(404).json({ error: "Company not found" });
    }

    const record = await response.json();
    const fields = record.fields;
    const incorporationDate = fields["Incorporate date"] || getTodayString();
    const statusValue = fields["Status"] || fields["Statues "] || "active";

    // Try multiple field name variations for price field
    const priceValue =
      fields["Price"] ||
      fields["price"] ||
      fields["Purchase Price"] ||
      fields["purchase price"] ||
      fields["Purchase price"] ||
      "0";
    const purchasePrice = parseFloat(String(priceValue));

    // Try to get currency from Airtable or default to USD
    const currencyValue = fields["Currency"] || fields["currency"] || "USD";

    const company: CompanyData = {
      id: record.id,
      companyName: fields["Company name"] || "",
      companyNumber: String(fields["Company number"] || ""),
      country: fields["country"] || fields.country || fields.Country || "",
      type: "LTD" as any,
      incorporationDate: incorporationDate,
      incorporationYear: parseInt(
        String(fields["Incorporate Year"] || new Date().getFullYear()),
      ),
      purchasePrice: purchasePrice,
      renewalFee: parseFloat(String(fields["Renewal fees"] || "0")),
      currency: String(currencyValue) as any,
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: calculateExpiryDate(incorporationDate),
      renewalDaysLeft: calculateRenewalDaysLeft(
        calculateExpiryDate(incorporationDate),
      ),
      status: statusValue as CompanyStatus,
      paymentStatus: "paid" as const,
      refundStatus: "not-refunded" as const,
      clientName: fields["Client Name"] || "",
      clientEmail: fields["Client Email"] || "",
      clientPhone: fields["Client Phone"],
      industry: fields.Industry,
      revenue: fields.Revenue,
      adminNotes: fields["Admin Notes"],
      internalNotes: fields["Internal Notes"],
      createdBy: "airtable",
      createdAt: getTodayString(),
      updatedAt: getTodayString(),
      updatedBy: "airtable",
      tags: [],
      documents: [],
      activityLog: [
        {
          id: "log_1",
          timestamp: getTodayString(),
          action: "Imported from Airtable",
          performedBy: "system",
          details: `Company ${fields["Company name"]} imported from Airtable`,
        },
      ],
      ownershipHistory: [],
    };

    res.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ error: "Failed to fetch company" });
  }
};

// Create company
export const createCompany: RequestHandler = async (req, res) => {
  try {
    const {
      companyName,
      companyNumber,
      country,
      type,
      incorporationDate,
      incorporationYear,
      purchasePrice,
      renewalFee,
      currency,
      clientName,
      clientEmail,
      clientPhone,
      industry,
      revenue,
      adminNotes,
      status,
      paymentStatus,
    } = req.body;

    if (
      !companyName ||
      !companyNumber ||
      !country ||
      !clientName ||
      !clientEmail
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q"; // Updated to user's new Airtable base
    const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

    if (!AIRTABLE_API_TOKEN) {
      return res
        .status(500)
        .json({ error: "Airtable integration not configured" });
    }

    // Create record in Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                "Company name": companyName,
                "Company number": companyNumber,
                Country: country,
                "Incorporate date":
                  incorporationDate || new Date().toISOString().split("T")[0],
                "Incorporate year":
                  incorporationYear || new Date().getFullYear(),
                Price: purchasePrice || 0,
              },
            },
          ],
        }),
      },
    );

    if (!airtableResponse.ok) {
      const error = await airtableResponse.text();
      console.error("[createCompany] Airtable API error:");
      console.error("[createCompany] Status:", airtableResponse.status);
      console.error("[createCompany] Response:", error);
      console.error(
        "[createCompany] Request body:",
        JSON.stringify(
          {
            records: [
              {
                fields: {
                  "Company name": companyName,
                  "Company number": companyNumber,
                  Country: country,
                  "Incorporate date":
                    incorporationDate || new Date().toISOString().split("T")[0],
                  "Incorporate year":
                    incorporationYear || new Date().getFullYear(),
                  Price: purchasePrice || 0,
                },
              },
            ],
          },
          null,
          2,
        ),
      );
      return res.status(500).json({
        error: "Failed to create company in Airtable",
        details: error,
      });
    }

    const airtableData = await airtableResponse.json();
    const record = airtableData.records[0];

    // Map Airtable response to CompanyData
    const company: CompanyData = {
      id: record.id,
      companyName: record.fields["Company name"] || "",
      companyNumber: record.fields["Company number"] || "",
      country: record.fields.Country || "",
      type: "LTD" as any,
      incorporationDate: record.fields["Incorporate date"] || getTodayString(),
      incorporationYear:
        record.fields["Incorporate year"] || new Date().getFullYear(),
      purchasePrice: parseFloat(
        String(
          record.fields.Price ||
          record.fields.price ||
          record.fields["Purchase Price"] ||
          record.fields["purchase price"] ||
          "0"
        )
      ),
      renewalFee: parseFloat(String(record.fields["Renewal fees"] || "0")),
      currency: String(record.fields.Currency || record.fields.currency || "USD") as any,
      expiryDate: calculateExpiryDate(
        record.fields["Incorporate date"] || getTodayString(),
      ),
      renewalDate: calculateExpiryDate(
        record.fields["Incorporate date"] || getTodayString(),
      ),
      renewalDaysLeft: calculateRenewalDaysLeft(
        calculateExpiryDate(
          record.fields["Incorporate date"] || getTodayString(),
        ),
      ),
      status: "active" as const,
      paymentStatus: "paid" as const,
      refundStatus: "not-refunded" as const,
      clientName: clientName || "",
      clientEmail: clientEmail || "",
      clientPhone,
      industry,
      revenue,
      adminNotes,
      optionsInclude: Array.isArray(record.fields["option include"])
        ? record.fields["option include"]
        : [],
      createdBy: "airtable",
      createdAt: getTodayString(),
      updatedAt: getTodayString(),
      updatedBy: "airtable",
      tags: [],
      documents: [],
      activityLog: [
        {
          id: "log_1",
          timestamp: getTodayString(),
          action: "Created in Airtable",
          performedBy: "system",
          details: `Company ${companyName} created`,
        },
      ],
      ownershipHistory: [],
    };

    res.status(201).json(company);
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ error: "Failed to create company" });
  }
};

// Update company in Airtable
export const updateCompany: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q"; // Updated to user's new Airtable base
    const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

    if (!AIRTABLE_API_TOKEN) {
      return res
        .status(500)
        .json({ error: "Airtable integration not configured" });
    }

    const updates = req.body;
    const airtableFields: any = {};

    // Map fields to Airtable column names
    if (updates.companyName)
      airtableFields["Company name"] = updates.companyName;
    if (updates.companyNumber)
      airtableFields["Company number"] = updates.companyNumber;
    if (updates.country) airtableFields.Country = updates.country;
    if (updates.incorporationDate)
      airtableFields["Incorporate date"] = updates.incorporationDate;
    if (updates.incorporationYear)
      airtableFields["Incorporate year"] = updates.incorporationYear;
    if (updates.purchasePrice !== undefined)
      airtableFields.Price = updates.purchasePrice;
    if (updates.status) airtableFields.Status = updates.status;

    // Update in Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: airtableFields }),
      },
    );

    if (!response.ok) {
      return res.status(404).json({ error: "Company not found" });
    }

    const record = await response.json();
    const fields = record.fields;
    const incorporationDate = fields["Incorporate date"] || getTodayString();
    const statusValue = fields["Status"] || fields["Statues "] || "active";

    const company: CompanyData = {
      id: record.id,
      companyName: fields["Company name"] || "",
      companyNumber: String(fields["Company number"] || ""),
      country: fields["country"] || fields.country || fields.Country || "",
      type: "LTD" as any,
      incorporationDate: incorporationDate,
      incorporationYear: parseInt(
        String(fields["Incorporate Year"] || new Date().getFullYear()),
      ),
      purchasePrice: parseFloat(String(fields["Price"] || "0")),
      renewalFee: parseFloat(
        String(fields["Renewal fees"] || updatedFields["Renewal fees"] || "0"),
      ),
      currency: "USD",
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: calculateExpiryDate(incorporationDate),
      renewalDaysLeft: calculateRenewalDaysLeft(
        calculateExpiryDate(incorporationDate),
      ),
      status: statusValue as CompanyStatus,
      paymentStatus: "paid" as const,
      refundStatus: "not-refunded" as const,
      clientName: fields["Client Name"] || "",
      clientEmail: fields["Client Email"] || "",
      clientPhone: fields["Client Phone"],
      industry: fields.Industry,
      revenue: fields.Revenue,
      adminNotes: fields["Admin Notes"],
      internalNotes: fields["Internal Notes"],
      optionsInclude: Array.isArray(fields["option include"])
        ? fields["option include"]
        : [],
      createdBy: "airtable",
      createdAt: getTodayString(),
      updatedAt: getTodayString(),
      updatedBy: "airtable",
      tags: [],
      documents: [],
      activityLog: [],
      ownershipHistory: [],
    };

    res.json(company);
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ error: "Failed to update company" });
  }
};

// Delete company from Airtable
export const deleteCompany: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q"; // Updated to user's new Airtable base
    const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

    if (!AIRTABLE_API_TOKEN) {
      return res
        .status(500)
        .json({ error: "Airtable integration not configured" });
    }

    // Delete from Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        },
      },
    );

    if (!response.ok) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json({ success: true, message: "Company deleted from Airtable" });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ error: "Failed to delete company" });
  }
};

// Update company status in Airtable
export const updateCompanyStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    console.log(
      `[updateCompanyStatus] Starting - Airtable ID: ${id}, New Status: ${status}`,
    );

    // Verify Airtable token is configured
    if (!process.env.AIRTABLE_API_TOKEN) {
      console.error("AIRTABLE_API_TOKEN not configured");
      return res
        .status(500)
        .json({ error: "Airtable API token not configured" });
    }

    // The ID is the Airtable record ID (rec123456), so we can use it directly
    const airtableId = id;

    // Fetch the current record to get field details
    const getUrl = `https://api.airtable.com/v0/app0PK34gyJDizR3Q/tbljtdHPdHnTberDy/${airtableId}`;
    const getResponse = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
      },
    });

    if (!getResponse.ok) {
      const getError = await getResponse.text();
      console.error(
        `Airtable GET failed for ${airtableId}:`,
        getResponse.status,
        getError,
      );
      return res.status(getResponse.status).json({
        error: "Failed to fetch company from Airtable",
        details: getError,
      });
    }

    const currentRecord = await getResponse.json();
    const fields = currentRecord.fields;
    const companyName = fields["Company name"] || "Unknown Company";
    const incorporationDate = fields["Incorporate date"] || getTodayString();
    // Read from Statues (with space) first, then Status
    const currentStatusValue =
      fields["Statues "] || fields["Status"] || "active";

    // Ensure status is provided
    if (!status) {
      return res.status(400).json({ error: "Status value is required" });
    }

    // Capitalize first letter: "sold" �� "Sold", "active" → "Active"
    const newStatusValue =
      status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    console.log(
      `[${airtableId}] Updating "${companyName}": "${currentStatusValue}" → "${newStatusValue}"`,
    );

    // Clear cache since we're updating
    serverCache = null;

    // Step 4: Update in Airtable using the found Airtable record ID
    // Try both "Statues " (with space) and "Statues" (without space) field names
    const fieldNames = ["Statues ", "Statues", "Status"];
    let updateResponse = null;
    let lastError = null;

    for (const fieldName of fieldNames) {
      console.log(
        `[updateCompanyStatus] Attempting PATCH with field name: "${fieldName}"`,
      );

      updateResponse = await fetch(
        `https://api.airtable.com/v0/app0PK34gyJDizR3Q/tbljtdHPdHnTberDy/${airtableId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              [fieldName]: newStatusValue,
            },
          }),
        },
      );

      if (updateResponse.ok) {
        console.log(
          `[updateCompanyStatus] SUCCESS with field name: "${fieldName}"`,
        );
        break;
      } else {
        const responseText = await updateResponse.text();
        lastError = { fieldName, status: updateResponse.status, responseText };
        console.warn(
          `[updateCompanyStatus] FAILED with field name "${fieldName}": Status ${updateResponse.status}, Body: ${responseText}`,
        );
      }
    }

    if (!updateResponse || !updateResponse.ok) {
      console.error(
        `[updateCompanyStatus] FAILED for all field names:`,
        "Company:",
        companyName,
        "Airtable ID:",
        airtableId,
        "Trying to set value:",
        newStatusValue,
        "Last error:",
        lastError,
      );
      return res.status(500).json({
        error: "Failed to update company status in Airtable",
        details:
          "Airtable field name could not be determined or API error occurred",
        lastAttempt: lastError,
        airtableId: airtableId,
        companyName: companyName,
        fieldValue: newStatusValue,
        help: "Check Airtable field names: try 'Statues', 'Statues ', or 'Status'",
      });
    }

    const updatedResponse = await updateResponse.json();
    const updatedFields = updatedResponse.fields;

    // Normalize status to lowercase for filtering
    const normalizedStatus = newStatusValue.toLowerCase() as CompanyStatus;

    const updatedCompany: CompanyData = {
      id: id,
      companyName: updatedFields["Company name"] || "",
      companyNumber: updatedFields["Company number"] || "",
      country: updatedFields.country || updatedFields.Country || "",
      type: "LTD" as any,
      incorporationDate: incorporationDate,
      incorporationYear: parseInt(
        updatedFields["Incorporate Year"] || new Date().getFullYear(),
      ),
      purchasePrice: parseFloat(updatedFields.Price || "0"),
      renewalFee: parseFloat(String(updatedFields["Renewal fees"] || "0")),
      currency: "USD",
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: calculateExpiryDate(incorporationDate),
      renewalDaysLeft: calculateRenewalDaysLeft(
        calculateExpiryDate(incorporationDate),
      ),
      status: normalizedStatus,
      paymentStatus: "paid" as const,
      refundStatus: "not-refunded" as const,
      clientName: updatedFields["Client Name"] || "",
      clientEmail: updatedFields["Client Email"] || "",
      clientPhone: updatedFields["Client Phone"],
      industry: updatedFields.Industry,
      revenue: updatedFields.Revenue,
      adminNotes: updatedFields["Admin Notes"],
      internalNotes: updatedFields["Internal Notes"],
      optionsInclude: Array.isArray(updatedFields["option include"])
        ? updatedFields["option include"]
        : [],
      createdBy: "airtable",
      createdAt: getTodayString(),
      updatedAt: getTodayString(),
      updatedBy: "system",
      tags: [],
      documents: [],
      activityLog: [],
      ownershipHistory: [],
    };

    console.log(
      `✓ Company ${airtableId} (${companyName}) status updated to ${newStatusValue}`,
    );
    res.json(updatedCompany);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[updateCompanyStatus] EXCEPTION:", {
      message: errorMessage,
      stack: errorStack,
      airtableId: req.params?.id,
      requestStatus: req.body?.status,
    });
    res.status(500).json({
      error: "Failed to update company status",
      details: errorMessage,
      type: error instanceof Error ? error.name : typeof error,
    });
  }
};

// Renew company in Airtable
export const renewCompany: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch current company from Airtable
    const getResponse = await fetch(
      `https://api.airtable.com/v0/app0PK34gyJDizR3Q/tbljtdHPdHnTberDy/${id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
        },
      },
    );

    if (!getResponse.ok) {
      return res.status(404).json({ error: "Company not found" });
    }

    const record = await getResponse.json();
    const fields = record.fields;
    const incorporationDate = fields["Incorporate date"] || getTodayString();
    const newRenewalDate = calculateExpiryDate(getTodayString());

    // Clear cache since we're updating
    serverCache = null;

    // Update in Airtable
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/app0PK34gyJDizR3Q/tbljtdHPdHnTberDy/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Status: "active",
          },
        }),
      },
    );

    if (!updateResponse.ok) {
      return res.status(500).json({ error: "Failed to renew company" });
    }

    const updatedRecord = await updateResponse.json();
    const updatedFields = updatedRecord.fields;

    const company: CompanyData = {
      id: updatedRecord.id,
      companyName: updatedFields["Company name"] || "",
      companyNumber: updatedFields["Company number"] || "",
      country: updatedFields.country || updatedFields.Country || "",
      type: "LTD" as any,
      incorporationDate: incorporationDate,
      incorporationYear: parseInt(
        updatedFields["Incorporate Year"] || new Date().getFullYear(),
      ),
      purchasePrice: parseFloat(updatedFields.Price || "0"),
      renewalFee: parseFloat(String(updatedFields["Renewal fees"] || "0")),
      currency: "USD",
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: newRenewalDate,
      renewalDaysLeft: calculateRenewalDaysLeft(newRenewalDate),
      status: "active" as const,
      paymentStatus: "paid" as const,
      refundStatus: "not-refunded" as const,
      clientName: updatedFields["Client Name"] || "",
      clientEmail: updatedFields["Client Email"] || "",
      clientPhone: updatedFields["Client Phone"],
      industry: updatedFields.Industry,
      revenue: updatedFields.Revenue,
      adminNotes: updatedFields["Admin Notes"],
      internalNotes: updatedFields["Internal Notes"],
      optionsInclude: Array.isArray(updatedFields["option include"])
        ? updatedFields["option include"]
        : [],
      createdBy: "airtable",
      createdAt: getTodayString(),
      updatedAt: getTodayString(),
      updatedBy: "system",
      tags: [],
      documents: [],
      activityLog: [],
      ownershipHistory: [],
    };

    res.json(company);
  } catch (error) {
    console.error("Error renewing company:", error);
    res.status(500).json({ error: "Failed to renew company" });
  }
};

// Request refund for company
export const requestRefund: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch current company from Airtable
    const getResponse = await fetch(
      `https://api.airtable.com/v0/app0PK34gyJDizR3Q/tbljtdHPdHnTberDy/${id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
        },
      },
    );

    if (!getResponse.ok) {
      return res.status(404).json({ error: "Company not found" });
    }

    const record = await getResponse.json();
    const fields = record.fields;
    const incorporationDate = fields["Incorporate date"] || getTodayString();

    // Clear cache since we're updating
    serverCache = null;

    // Update in Airtable
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/app0PK34gyJDizR3Q/tbljtdHPdHnTberDy/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Status: "refund-pending",
          },
        }),
      },
    );

    if (!updateResponse.ok) {
      return res.status(500).json({ error: "Failed to request refund" });
    }

    const updatedRecord = await updateResponse.json();
    const updatedFields = updatedRecord.fields;

    const company: CompanyData = {
      id: updatedRecord.id,
      companyName: updatedFields["Company name"] || "",
      companyNumber: updatedFields["Company number"] || "",
      country: updatedFields.country || updatedFields.Country || "",
      type: "LTD" as any,
      incorporationDate: incorporationDate,
      incorporationYear: parseInt(
        updatedFields["Incorporate Year"] || new Date().getFullYear(),
      ),
      purchasePrice: parseFloat(updatedFields.Price || "0"),
      renewalFee: parseFloat(String(updatedFields["Renewal fees"] || "0")),
      currency: "USD",
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: calculateExpiryDate(incorporationDate),
      renewalDaysLeft: calculateRenewalDaysLeft(
        calculateExpiryDate(incorporationDate),
      ),
      status: "refund-pending" as CompanyStatus,
      paymentStatus: "pending" as const,
      refundStatus: "partially-refunded" as const,
      clientName: updatedFields["Client Name"] || "",
      clientEmail: updatedFields["Client Email"] || "",
      clientPhone: updatedFields["Client Phone"],
      industry: updatedFields.Industry,
      revenue: updatedFields.Revenue,
      adminNotes: updatedFields["Admin Notes"],
      internalNotes: updatedFields["Internal Notes"],
      optionsInclude: Array.isArray(updatedFields["option include"])
        ? updatedFields["option include"]
        : [],
      createdBy: "airtable",
      createdAt: getTodayString(),
      updatedAt: getTodayString(),
      updatedBy: "system",
      tags: [],
      documents: [],
      activityLog: [],
      ownershipHistory: [],
    };

    res.json(company);
  } catch (error) {
    console.error("Error requesting refund:", error);
    res.status(500).json({ error: "Failed to request refund" });
  }
};

// Approve refund for company
export const approveRefund: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch current company from Airtable
    const getResponse = await fetch(
      `https://api.airtable.com/v0/app0PK34gyJDizR3Q/tbljtdHPdHnTberDy/${id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
        },
      },
    );

    if (!getResponse.ok) {
      return res.status(404).json({ error: "Company not found" });
    }

    const record = await getResponse.json();
    const fields = record.fields;
    const incorporationDate = fields["Incorporate date"] || getTodayString();

    // Clear cache since we're updating
    serverCache = null;

    // Update in Airtable
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/app0PK34gyJDizR3Q/tbljtdHPdHnTberDy/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Status: "refunded",
          },
        }),
      },
    );

    if (!updateResponse.ok) {
      return res.status(500).json({ error: "Failed to approve refund" });
    }

    const updatedRecord = await updateResponse.json();
    const updatedFields = updatedRecord.fields;

    const company: CompanyData = {
      id: updatedRecord.id,
      companyName: updatedFields["Company name"] || "",
      companyNumber: updatedFields["Company number"] || "",
      country: updatedFields.country || updatedFields.Country || "",
      type: "LTD" as any,
      incorporationDate: incorporationDate,
      incorporationYear: parseInt(
        updatedFields["Incorporate Year"] || new Date().getFullYear(),
      ),
      purchasePrice: parseFloat(updatedFields.Price || "0"),
      renewalFee: parseFloat(String(updatedFields["Renewal fees"] || "0")),
      currency: "USD",
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: calculateExpiryDate(incorporationDate),
      renewalDaysLeft: calculateRenewalDaysLeft(
        calculateExpiryDate(incorporationDate),
      ),
      status: "refunded" as const,
      paymentStatus: "refunded" as const,
      refundStatus: "fully-refunded" as const,
      clientName: updatedFields["Client Name"] || "",
      clientEmail: updatedFields["Client Email"] || "",
      clientPhone: updatedFields["Client Phone"],
      industry: updatedFields.Industry,
      revenue: updatedFields.Revenue,
      adminNotes: updatedFields["Admin Notes"],
      internalNotes: updatedFields["Internal Notes"],
      optionsInclude: Array.isArray(updatedFields["option include"])
        ? updatedFields["option include"]
        : [],
      createdBy: "airtable",
      createdAt: getTodayString(),
      updatedAt: getTodayString(),
      updatedBy: "system",
      tags: [],
      documents: [],
      activityLog: [],
      ownershipHistory: [],
    };

    res.json(company);
  } catch (error) {
    console.error("Error approving refund:", error);
    res.status(500).json({ error: "Failed to approve refund" });
  }
};

// Mark company as sold
export const markCompanyAsSold: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q"; // Updated to user's new Airtable base
    const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

    if (!AIRTABLE_API_TOKEN) {
      return res
        .status(500)
        .json({ error: "Airtable integration not configured" });
    }

    // Fetch current company from Airtable
    const getResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${id}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        },
      },
    );

    if (!getResponse.ok) {
      return res.status(404).json({ error: "Company not found" });
    }

    const record = await getResponse.json();
    const fields = record.fields;
    const incorporationDate = fields["Incorporate date"] || getTodayString();

    // Clear cache since we're updating
    serverCache = null;

    // Update in Airtable with "sold" status
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Status: "sold",
          },
        }),
      },
    );

    if (!updateResponse.ok) {
      return res.status(500).json({ error: "Failed to mark company as sold" });
    }

    const updatedRecord = await updateResponse.json();
    const updatedFields = updatedRecord.fields;

    const company: CompanyData = {
      id: updatedRecord.id,
      companyName: updatedFields["Company name"] || "",
      companyNumber: String(updatedFields["Company number"] || ""),
      country: updatedFields.country || updatedFields.Country || "",
      type: "LTD" as any,
      incorporationDate: incorporationDate,
      incorporationYear: parseInt(
        String(updatedFields["Incorporate Year"] || new Date().getFullYear()),
      ),
      purchasePrice: parseFloat(String(updatedFields["Price"] || "0")),
      renewalFee: parseFloat(String(updatedFields["Renewal fees"] || "0")),
      currency: "USD",
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: calculateExpiryDate(incorporationDate),
      renewalDaysLeft: calculateRenewalDaysLeft(
        calculateExpiryDate(incorporationDate),
      ),
      status: "sold" as CompanyStatus,
      paymentStatus: "paid" as const,
      refundStatus: "not-refunded" as const,
      clientName: updatedFields["Client Name"] || "",
      clientEmail: updatedFields["Client Email"] || "",
      clientPhone: updatedFields["Client Phone"],
      industry: updatedFields.Industry,
      revenue: updatedFields.Revenue,
      adminNotes: updatedFields["Admin Notes"],
      internalNotes: updatedFields["Internal Notes"],
      optionsInclude: Array.isArray(updatedFields["option include"])
        ? updatedFields["option include"]
        : [],
      createdBy: "airtable",
      createdAt: getTodayString(),
      updatedAt: getTodayString(),
      updatedBy: "system",
      tags: [],
      documents: [],
      activityLog: [],
      ownershipHistory: [],
    };

    res.json(company);
  } catch (error) {
    console.error("Error marking company as sold:", error);
    res.status(500).json({ error: "Failed to mark company as sold" });
  }
};

// Helper: Sync company to Airtable (using original table and field mappings)
async function syncCompanyToAirtable(company: CompanyData): Promise<void> {
  const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
  const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q"; // Updated to user's new Airtable base
  const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy"; // Original table ID from user's Airtable

  if (!AIRTABLE_API_TOKEN) {
    console.log("Airtable token not configured, skipping sync");
    return;
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        },
        body: JSON.stringify({
          fields: {
            "Company name": company.companyName,
            "Company number": company.companyNumber,
            Country: company.country,
            "Incorporate date": company.incorporationDate,
            "Incorporate year": company.incorporationYear,
            Price: company.purchasePrice,
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Airtable sync failed:", error);
    }
  } catch (error) {
    console.error("Error syncing to Airtable:", error);
    throw error;
  }
}
