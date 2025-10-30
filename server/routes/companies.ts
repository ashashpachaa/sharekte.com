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
  return "rec_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
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
  }
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
    // Check server cache first
    if (
      serverCache &&
      Date.now() - serverCache.timestamp < SERVER_CACHE_DURATION
    ) {
      res.set("Cache-Control", "public, max-age=120"); // 2 minute cache
      return res.json(serverCache.data);
    }

    // If fetch is already in progress, wait for it
    if (pendingAirtableFetch) {
      const companies = await pendingAirtableFetch;
      res.set("Cache-Control", "public, max-age=120");
      return res.json(companies);
    }

    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
    const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

    if (!AIRTABLE_API_TOKEN) {
      console.error("AIRTABLE_API_TOKEN not configured");
      return res.status(500).json({ error: "Airtable integration not configured" });
    }

    // Create fetch promise to handle concurrent requests
    pendingAirtableFetch = (async () => {
      try {
        // Fetch from Airtable
        const response = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
          {
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
            },
          }
        );

        if (!response.ok) {
          const error = await response.text();
          console.error("Airtable API error:", response.status, error);
          throw new Error(`Airtable API error: ${response.status}`);
        }

        const data = await response.json();
        const companies: CompanyData[] = data.records.map((record: any) => {
          const fields = record.fields;
          const incorporationDate = fields["Incorporate date"] || getTodayString();
          const rawStatus = fields["Status"] || fields["Statues "] || "active";
          const statusValue = rawStatus.toLowerCase() as CompanyStatus;

          return {
            id: record.id,
            companyName: fields["Company name"] || "",
            companyNumber: String(fields["Company number"] || ""),
            country: fields["country"] || "",
            type: "LTD" as any,
            incorporationDate: incorporationDate,
            incorporationYear: parseInt(String(fields["Incorporate Year"] || new Date().getFullYear())),
            purchasePrice: parseFloat(String(fields["Price"] || "0")),
            renewalFee: parseFloat(String(fields["Renewal fees"] || "0")),
            currency: "USD",
            expiryDate: calculateExpiryDate(incorporationDate),
            renewalDate: calculateExpiryDate(incorporationDate),
            renewalDaysLeft: calculateRenewalDaysLeft(calculateExpiryDate(incorporationDate)),
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
            optionsInclude: Array.isArray(fields["option include"]) ? fields["option include"] : [],
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

        // Cache the result
        serverCache = {
          data: companies,
          timestamp: Date.now(),
        };

        return companies;
      } finally {
        // Clear pending fetch
        pendingAirtableFetch = null;
      }
    })();

    const companies = await pendingAirtableFetch;
    res.set("Cache-Control", "public, max-age=120");
    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    pendingAirtableFetch = null;
    res.status(500).json({ error: "Failed to fetch companies" });
  }
};

// Get single company from Airtable
export const getCompany: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
    const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

    if (!AIRTABLE_API_TOKEN) {
      return res.status(500).json({ error: "Airtable integration not configured" });
    }

    // Fetch from Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${id}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        },
      }
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
      incorporationYear: parseInt(String(fields["Incorporate Year"] || new Date().getFullYear())),
      purchasePrice: parseFloat(String(fields["Price"] || "0")),
      renewalFee: parseFloat(String(fields["Renewal fees"] || "0")),
      currency: "USD",
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: calculateExpiryDate(incorporationDate),
      renewalDaysLeft: calculateRenewalDaysLeft(calculateExpiryDate(incorporationDate)),
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
      return res
        .status(400)
        .json({ error: "Missing required fields" });
    }

    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
    const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

    if (!AIRTABLE_API_TOKEN) {
      return res.status(500).json({ error: "Airtable integration not configured" });
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
                "Incorporate date": incorporationDate || new Date().toISOString().split("T")[0],
                "Incorporate year": incorporationYear || new Date().getFullYear(),
                Price: purchasePrice || 0,
              },
            },
          ],
        }),
      }
    );

    if (!airtableResponse.ok) {
      const error = await airtableResponse.text();
      console.error("Airtable API error:", error);
      return res.status(500).json({ error: "Failed to create company in Airtable" });
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
      incorporationYear: record.fields["Incorporate year"] || new Date().getFullYear(),
      purchasePrice: parseFloat(record.fields.Price || "0"),
      renewalFee: parseFloat(String(record.fields["Renewal fees"] || "0")),
      currency: "USD",
      expiryDate: calculateExpiryDate(record.fields["Incorporate date"] || getTodayString()),
      renewalDate: calculateExpiryDate(record.fields["Incorporate date"] || getTodayString()),
      renewalDaysLeft: calculateRenewalDaysLeft(calculateExpiryDate(record.fields["Incorporate date"] || getTodayString())),
      status: "active" as const,
      paymentStatus: "paid" as const,
      refundStatus: "not-refunded" as const,
      clientName: clientName || "",
      clientEmail: clientEmail || "",
      clientPhone,
      industry,
      revenue,
      adminNotes,
      optionsInclude: Array.isArray(record.fields["option include"]) ? record.fields["option include"] : [],
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
    const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
    const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

    if (!AIRTABLE_API_TOKEN) {
      return res.status(500).json({ error: "Airtable integration not configured" });
    }

    const updates = req.body;
    const airtableFields: any = {};

    // Map fields to Airtable column names
    if (updates.companyName) airtableFields["Company name"] = updates.companyName;
    if (updates.companyNumber) airtableFields["Company number"] = updates.companyNumber;
    if (updates.country) airtableFields.Country = updates.country;
    if (updates.incorporationDate) airtableFields["Incorporate date"] = updates.incorporationDate;
    if (updates.incorporationYear) airtableFields["Incorporate year"] = updates.incorporationYear;
    if (updates.purchasePrice !== undefined) airtableFields.Price = updates.purchasePrice;
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
      }
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
      incorporationYear: parseInt(String(fields["Incorporate Year"] || new Date().getFullYear())),
      purchasePrice: parseFloat(String(fields["Price"] || "0")),
      renewalFee: parseFloat(String(fields["Renewal fees"] || updatedFields["Renewal fees"] || "0")),
      currency: "USD",
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: calculateExpiryDate(incorporationDate),
      renewalDaysLeft: calculateRenewalDaysLeft(calculateExpiryDate(incorporationDate)),
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
      optionsInclude: Array.isArray(fields["option include"]) ? fields["option include"] : [],
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
    const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
    const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

    if (!AIRTABLE_API_TOKEN) {
      return res.status(500).json({ error: "Airtable integration not configured" });
    }

    // Delete from Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        },
      }
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

    // Step 1: Look up company by marketplace ID to get company name
    const allCompanies = await getCompanies();
    const company = allCompanies.find((c) => c.id === id);

    if (!company) {
      return res.status(404).json({ error: "Company not found in database" });
    }

    // Step 2: Search Airtable for record by company name
    const searchUrl = `https://api.airtable.com/v0/app0PK34gyJDizR3Q/tbljtdHPdHnTberDy?filterByFormula={Company%20name}="${encodeURIComponent(
      company.companyName
    )}"`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
      },
    });

    if (!searchResponse.ok) {
      console.error("Airtable search failed:", searchResponse.statusText);
      return res.status(500).json({ error: "Failed to search for company in Airtable" });
    }

    const searchData: any = await searchResponse.json();
    if (searchData.records.length === 0) {
      return res
        .status(404)
        .json({
          error: `Company "${company.companyName}" not found in Airtable`,
        });
    }

    // Step 3: Get the Airtable record ID from search results
    const airtableRecord = searchData.records[0];
    const airtableId = airtableRecord.id;
    const fields = airtableRecord.fields;
    const incorporationDate = fields["Incorporate date"] || getTodayString();
    const previousStatus = fields["Statues "] || "available";
    const newStatus = status || previousStatus;

    console.log(`Updating company status: ${company.companyName} (${airtableId}) from "${previousStatus}" to "${newStatus}"`);

    // Clear cache since we're updating
    serverCache = null;

    // Step 4: Update in Airtable using the found Airtable record ID (use "Statues " field with space as per Airtable table)
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/app0PK34gyJDizR3Q/tbljtdHPdHnTberDy/${airtableId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            "Statues ": newStatus,
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      console.error(
        "Airtable PATCH failed:",
        updateResponse.status,
        updateResponse.statusText
      );
      return res.status(500).json({ error: "Failed to update company status in Airtable" });
    }

    const updatedResponse = await updateResponse.json();
    const updatedFields = updatedResponse.fields;

    const updatedCompany: CompanyData = {
      id: id,
      companyName: updatedFields["Company name"] || "",
      companyNumber: updatedFields["Company number"] || "",
      country: updatedFields.country || updatedFields.Country || "",
      type: "LTD" as any,
      incorporationDate: incorporationDate,
      incorporationYear: parseInt(updatedFields["Incorporate Year"] || new Date().getFullYear()),
      purchasePrice: parseFloat(updatedFields.Price || "0"),
      renewalFee: parseFloat(String(updatedFields["Renewal fees"] || "0")),
      currency: "USD",
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: calculateExpiryDate(incorporationDate),
      renewalDaysLeft: calculateRenewalDaysLeft(calculateExpiryDate(incorporationDate)),
      status: newStatus as CompanyStatus,
      paymentStatus: "paid" as const,
      refundStatus: "not-refunded" as const,
      clientName: updatedFields["Client Name"] || "",
      clientEmail: updatedFields["Client Email"] || "",
      clientPhone: updatedFields["Client Phone"],
      industry: updatedFields.Industry,
      revenue: updatedFields.Revenue,
      adminNotes: updatedFields["Admin Notes"],
      internalNotes: updatedFields["Internal Notes"],
      optionsInclude: Array.isArray(updatedFields["option include"]) ? updatedFields["option include"] : [],
      createdBy: "airtable",
      createdAt: getTodayString(),
      updatedAt: getTodayString(),
      updatedBy: "system",
      tags: [],
      documents: [],
      activityLog: [],
      ownershipHistory: [],
    };

    res.json(updatedCompany);
  } catch (error) {
    console.error("Error updating company status:", error);
    res.status(500).json({ error: "Failed to update company status" });
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
      }
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
      }
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
      incorporationYear: parseInt(updatedFields["Incorporate Year"] || new Date().getFullYear()),
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
      optionsInclude: Array.isArray(updatedFields["option include"]) ? updatedFields["option include"] : [],
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
      }
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
      }
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
      incorporationYear: parseInt(updatedFields["Incorporate Year"] || new Date().getFullYear()),
      purchasePrice: parseFloat(updatedFields.Price || "0"),
      renewalFee: parseFloat(String(updatedFields["Renewal fees"] || "0")),
      currency: "USD",
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: calculateExpiryDate(incorporationDate),
      renewalDaysLeft: calculateRenewalDaysLeft(calculateExpiryDate(incorporationDate)),
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
      optionsInclude: Array.isArray(updatedFields["option include"]) ? updatedFields["option include"] : [],
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
      }
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
      }
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
      incorporationYear: parseInt(updatedFields["Incorporate Year"] || new Date().getFullYear()),
      purchasePrice: parseFloat(updatedFields.Price || "0"),
      renewalFee: parseFloat(String(updatedFields["Renewal fees"] || "0")),
      currency: "USD",
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: calculateExpiryDate(incorporationDate),
      renewalDaysLeft: calculateRenewalDaysLeft(calculateExpiryDate(incorporationDate)),
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
      optionsInclude: Array.isArray(updatedFields["option include"]) ? updatedFields["option include"] : [],
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
    const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
    const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

    if (!AIRTABLE_API_TOKEN) {
      return res.status(500).json({ error: "Airtable integration not configured" });
    }

    // Fetch current company from Airtable
    const getResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${id}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        },
      }
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
      }
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
      incorporationYear: parseInt(String(updatedFields["Incorporate Year"] || new Date().getFullYear())),
      purchasePrice: parseFloat(String(updatedFields["Price"] || "0")),
      renewalFee: parseFloat(String(updatedFields["Renewal fees"] || "0")),
      currency: "USD",
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: calculateExpiryDate(incorporationDate),
      renewalDaysLeft: calculateRenewalDaysLeft(calculateExpiryDate(incorporationDate)),
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
      optionsInclude: Array.isArray(updatedFields["option include"]) ? updatedFields["option include"] : [],
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
  const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
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
      }
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
