import { RequestHandler } from "express";
import {
  CompanyData,
  CompanyStatus,
  PaymentStatus,
  calculateExpiryDate,
  calculateRenewalDaysLeft,
  determineStatus,
} from "@/lib/company-management";

// Mock database - In production, use a real database
let companiesDb: CompanyData[] = [];
let idCounter = 1;

// Helper function to generate IDs
function generateId(): string {
  return `company_${idCounter++}`;
}

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

// Get all companies
export const getCompanies: RequestHandler = async (req, res) => {
  try {
    // For demo purposes, return sample data if no data exists
    if (companiesDb.length === 0) {
      const today = getTodayString();
      const expiryDate = calculateExpiryDate(today);

      companiesDb = [
        createNewCompany({
          companyName: "Tech Solutions Ltd",
          companyNumber: "12345678",
          country: "UK",
          type: "LTD",
          incorporationDate: today,
          incorporationYear: new Date().getFullYear(),
          purchasePrice: 500,
          renewalFee: 100,
          currency: "GBP",
          clientName: "John Smith",
          clientEmail: "john@example.com",
          status: "active",
          paymentStatus: "paid",
        }),
        createNewCompany({
          companyName: "Nordic Business AB",
          companyNumber: "98765432",
          country: "Sweden",
          type: "AB",
          incorporationDate: today,
          incorporationYear: new Date().getFullYear(),
          purchasePrice: 450,
          renewalFee: 90,
          currency: "SEK",
          clientName: "Anna Johnson",
          clientEmail: "anna@example.com",
          status: "active",
          paymentStatus: "paid",
        }),
        createNewCompany({
          companyName: "Dubai Trade FZCO",
          companyNumber: "54321098",
          country: "UAE",
          type: "FZCO",
          incorporationDate: today,
          incorporationYear: new Date().getFullYear(),
          purchasePrice: 600,
          renewalFee: 150,
          currency: "AED",
          clientName: "Ahmed Hassan",
          clientEmail: "ahmed@example.com",
          status: "available",
          paymentStatus: "pending",
        }),
      ];
    }

    res.json(companiesDb);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
};

// Get single company
export const getCompany: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const company = companiesDb.find((c) => c.id === id);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

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

    const company = createNewCompany({
      companyName,
      companyNumber,
      country,
      type: type || "LTD",
      incorporationDate:
        incorporationDate || new Date().toISOString().split("T")[0],
      incorporationYear:
        incorporationYear || new Date().getFullYear(),
      purchasePrice: purchasePrice || 0,
      renewalFee: renewalFee || 0,
      currency: currency || "USD",
      clientName,
      clientEmail,
      clientPhone,
      industry,
      revenue,
      adminNotes,
      status: status || "pending",
      paymentStatus: paymentStatus || "pending",
    });

    companiesDb.push(company);

    // Sync to Airtable if configured
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    if (AIRTABLE_API_TOKEN) {
      try {
        await syncCompanyToAirtable(company);
      } catch (airtableError) {
        console.error("Error syncing to Airtable:", airtableError);
        // Don't fail the request if Airtable sync fails
      }
    }

    res.status(201).json(company);
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ error: "Failed to create company" });
  }
};

// Update company
export const updateCompany: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const company = companiesDb.find((c) => c.id === id);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const updates = req.body;
    const updated = {
      ...company,
      ...updates,
      id: company.id,
      createdAt: company.createdAt,
      updatedAt: getTodayString(),
    };

    const index = companiesDb.findIndex((c) => c.id === id);
    companiesDb[index] = updated;

    res.json(updated);
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ error: "Failed to update company" });
  }
};

// Delete company
export const deleteCompany: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const company = companiesDb.find((c) => c.id === id);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    companiesDb = companiesDb.filter((c) => c.id !== id);
    res.json({ message: "Company deleted" });
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

// Helper: Sync company to Airtable
async function syncCompanyToAirtable(company: CompanyData): Promise<void> {
  const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
  const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
  const AIRTABLE_TABLE = "Companies";

  if (!AIRTABLE_API_TOKEN) {
    console.log("Airtable token not configured, skipping sync");
    return;
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        },
        body: JSON.stringify({
          fields: {
            "Company Name": company.companyName,
            "Company Number": company.companyNumber,
            Country: company.country,
            Type: company.type,
            "Incorporation Date": company.incorporationDate,
            "Incorporation Year": company.incorporationYear,
            "Purchase Price": company.purchasePrice,
            "Renewal Fee": company.renewalFee,
            Currency: company.currency,
            "Expiry Date": company.expiryDate,
            "Renewal Date": company.renewalDate,
            Status: company.status,
            "Payment Status": company.paymentStatus,
            "Refund Status": company.refundStatus,
            "Client Name": company.clientName,
            "Client Email": company.clientEmail,
            "Client Phone": company.clientPhone || "",
            Industry: company.industry || "",
            Revenue: company.revenue || "",
            "Admin Notes": company.adminNotes || "",
            "Internal Notes": company.internalNotes || "",
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
