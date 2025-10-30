import { RequestHandler } from "express";
import {
  CompanyData,
  CompanyStatus,
  PaymentStatus,
  calculateExpiryDate,
  calculateRenewalDaysLeft,
  determineStatus,
} from "@/lib/company-management";

// All company data comes from Airtable - no local in-memory storage
// Airtable provides persistent storage and real-time synchronization

// Helper function to get today's date as string
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
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

// Get all companies from Airtable
export const getCompanies: RequestHandler = async (req, res) => {
  try {
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
    const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

    if (!AIRTABLE_API_TOKEN) {
      console.error("AIRTABLE_API_TOKEN not configured");
      return res.status(500).json({ error: "Airtable integration not configured" });
    }

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
      console.error("Airtable API error:", error);
      return res.status(500).json({ error: "Failed to fetch from Airtable" });
    }

    const data = await response.json();
    const companies: CompanyData[] = data.records.map((record: any) => {
      const fields = record.fields;
      const incorporationDate = fields["Incorporate date"] || getTodayString();

      return {
        id: record.id,
        companyName: fields["Company name"] || "",
        companyNumber: fields["Company number"] || "",
        country: fields.Country || "",
        type: "LTD" as any,
        incorporationDate: incorporationDate,
        incorporationYear: parseInt(fields["Incorporate year"] || new Date().getFullYear()),
        purchasePrice: parseFloat(fields.Price || "0"),
        renewalFee: 0,
        currency: "GBP",
        expiryDate: calculateExpiryDate(incorporationDate),
        renewalDate: calculateExpiryDate(incorporationDate),
        renewalDaysLeft: calculateRenewalDaysLeft(calculateExpiryDate(incorporationDate)),
        status: "active" as const,
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
    });

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

    const company: CompanyData = {
      id: record.id,
      companyName: fields["Company name"] || "",
      companyNumber: fields["Company number"] || "",
      country: fields.Country || "",
      type: "LTD" as any,
      incorporationDate: incorporationDate,
      incorporationYear: parseInt(fields["Incorporate year"] || new Date().getFullYear()),
      purchasePrice: parseFloat(fields.Price || "0"),
      renewalFee: 0,
      currency: "GBP",
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: calculateExpiryDate(incorporationDate),
      renewalDaysLeft: calculateRenewalDaysLeft(calculateExpiryDate(incorporationDate)),
      status: "active" as const,
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
      renewalFee: 0,
      currency: "GBP",
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

    const company: CompanyData = {
      id: record.id,
      companyName: fields["Company name"] || "",
      companyNumber: fields["Company number"] || "",
      country: fields.Country || "",
      type: "LTD" as any,
      incorporationDate: incorporationDate,
      incorporationYear: parseInt(fields["Incorporate year"] || new Date().getFullYear()),
      purchasePrice: parseFloat(fields.Price || "0"),
      renewalFee: 0,
      currency: "GBP",
      expiryDate: calculateExpiryDate(incorporationDate),
      renewalDate: calculateExpiryDate(incorporationDate),
      renewalDaysLeft: calculateRenewalDaysLeft(calculateExpiryDate(incorporationDate)),
      status: "active" as const,
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

// Update company status
export const updateCompanyStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const company = companiesDb.find((c) => c.id === id);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const previousStatus = company.status;
    const newStatus = determineStatus(company.renewalDate, status);

    const updated: CompanyData = {
      ...company,
      status: newStatus as CompanyStatus,
      updatedAt: getTodayString(),
      activityLog: [
        ...company.activityLog,
        {
          id: `log_${Date.now()}`,
          timestamp: getTodayString(),
          action: `Status Changed to ${newStatus}`,
          performedBy: "admin",
          details: notes || `Status changed from ${previousStatus} to ${newStatus}`,
          previousStatus: previousStatus,
          newStatus: newStatus,
        },
      ],
    };

    const index = companiesDb.findIndex((c) => c.id === id);
    companiesDb[index] = updated;

    res.json(updated);
  } catch (error) {
    console.error("Error updating company status:", error);
    res.status(500).json({ error: "Failed to update company status" });
  }
};

// Renew company
export const renewCompany: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const company = companiesDb.find((c) => c.id === id);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const newRenewalDate = calculateExpiryDate(getTodayString());
    const newExpiryDate = calculateExpiryDate(newRenewalDate);

    const updated: CompanyData = {
      ...company,
      renewalDate: newRenewalDate,
      expiryDate: newExpiryDate,
      renewalDaysLeft: calculateRenewalDaysLeft(newRenewalDate),
      status: "active",
      updatedAt: getTodayString(),
      activityLog: [
        ...company.activityLog,
        {
          id: `log_${Date.now()}`,
          timestamp: getTodayString(),
          action: "Company Renewed",
          performedBy: "admin",
          details: notes || `Company renewed. New renewal date: ${newRenewalDate}`,
        },
      ],
    };

    const index = companiesDb.findIndex((c) => c.id === id);
    companiesDb[index] = updated;

    res.json(updated);
  } catch (error) {
    console.error("Error renewing company:", error);
    res.status(500).json({ error: "Failed to renew company" });
  }
};

// Request refund
export const requestRefund: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    const company = companiesDb.find((c) => c.id === id);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const updated: CompanyData = {
      ...company,
      refundStatus: "partially-refunded",
      updatedAt: getTodayString(),
      activityLog: [
        ...company.activityLog,
        {
          id: `log_${Date.now()}`,
          timestamp: getTodayString(),
          action: "Refund Requested",
          performedBy: "customer",
          details: `Refund requested. Reason: ${reason}. ${notes || ""}`,
        },
      ],
    };

    const index = companiesDb.findIndex((c) => c.id === id);
    companiesDb[index] = updated;

    res.json(updated);
  } catch (error) {
    console.error("Error requesting refund:", error);
    res.status(500).json({ error: "Failed to request refund" });
  }
};

// Approve refund
export const approveRefund: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundAmount, notes } = req.body;

    const company = companiesDb.find((c) => c.id === id);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const updated: CompanyData = {
      ...company,
      status: "refunded",
      refundStatus: "fully-refunded",
      paymentStatus: "refunded",
      updatedAt: getTodayString(),
      activityLog: [
        ...company.activityLog,
        {
          id: `log_${Date.now()}`,
          timestamp: getTodayString(),
          action: "Refund Approved",
          performedBy: "admin",
          details: `Refund of ${refundAmount} approved. ${notes || ""}`,
        },
      ],
    };

    const index = companiesDb.findIndex((c) => c.id === id);
    companiesDb[index] = updated;

    res.json(updated);
  } catch (error) {
    console.error("Error approving refund:", error);
    res.status(500).json({ error: "Failed to approve refund" });
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
