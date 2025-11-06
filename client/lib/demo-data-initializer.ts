/**
 * Demo Data Initializer
 * Creates sample purchased companies with amendment status for testing
 * Run this on first login to populate demo data
 */

import { PurchasedCompanyData } from "./user-data";

/**
 * Initialize demo purchased companies for the current user
 * This adds a company with "amend-required" status to show amendment comments
 */
export function initializeDemoPurchasedCompanies(userEmail: string): void {
  const storageKey = `companies_${userEmail}`;
  const existingCompanies = localStorage.getItem(storageKey);

  // Only initialize if no companies exist for this user
  if (existingCompanies) {
    console.log("[Demo Data] Companies already exist for user, skipping init");
    return;
  }

  // Create demo companies
  const demoPurchasedCompanies: PurchasedCompanyData[] = [
    {
      id: "comp_2",
      name: "Nordic Business AB",
      number: "87654321",
      price: 3500,
      incorporationDate: "2019-06-20",
      incorporationYear: "2019",
      country: "Sweden",
      purchasedDate: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      renewalDate: new Date(
        Date.now() + 240 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      renewalFees: 1250,
      status: "amend-required",
      statusLabel: "Amendment Required",
      renewalStatus: "active",
      documents: [],
      transferFormAttachments: [],
      transferFormFilled: true,
      transferFormData: {
        directorName: "Per Johansson",
        directorEmail: "per@nordic.se",
        shareholderName: "Erik Svensson",
        shareholderEmail: "erik@nordic.se",
        companyAddress: "Stockholm, Sweden",
      },
      // These admin comments and status history will be fetched from the transfer form
      // But we store them locally so they persist immediately
      adminComments:
        "Please provide detailed information about all shareholders. We need names, nationalities, and ownership percentages for each shareholder.",
      statusHistory: [
        {
          id: "log_1",
          fromStatus: "under-review",
          toStatus: "amend-required",
          changedDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          changedBy: "admin",
          notes:
            "Please provide detailed information about all shareholders. We need names, nationalities, and ownership percentages for each shareholder.",
        },
        {
          id: "log_2",
          fromStatus: "amend-required",
          toStatus: "amend-required",
          changedDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          changedBy: "admin",
          notes:
            "Also, please update the company activities list. The current description is too vague. We need specific NACE codes and detailed business operations.",
        },
      ],
      renewalHistory: [
        {
          id: "renewal_1",
          renewalDate: new Date(
            Date.now() + 240 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          renewedDate: new Date().toISOString(),
          isLate: false,
          daysLate: 0,
          status: "pending",
        },
      ],
    },
    {
      id: "comp_1",
      name: "Tech Solutions Ltd",
      number: "12345678",
      price: 2500,
      incorporationDate: "2020-01-15",
      incorporationYear: "2020",
      country: "UK",
      purchasedDate: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      renewalDate: new Date(
        Date.now() + 150 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      renewalFees: 800,
      status: "completed",
      statusLabel: "Active",
      renewalStatus: "active",
      documents: [],
      transferFormAttachments: [],
      transferFormFilled: true,
      renewalHistory: [],
    },
    {
      id: "comp_3",
      name: "Dubai Trade FZCO",
      number: "FZCO123",
      price: 4000,
      incorporationDate: "2021-03-10",
      incorporationYear: "2021",
      country: "UAE",
      purchasedDate: new Date(
        Date.now() - 10 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      renewalDate: new Date(
        Date.now() + 300 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      renewalFees: 1500,
      status: "pending-transfer",
      statusLabel: "Pending Transfer",
      renewalStatus: "active",
      documents: [],
      transferFormAttachments: [],
      transferFormFilled: false,
      renewalHistory: [],
    },
  ];

  // Store in localStorage
  localStorage.setItem(storageKey, JSON.stringify(demoPurchasedCompanies));
  console.log(
    `[Demo Data] ✓ Initialized ${demoPurchasedCompanies.length} demo purchased companies`,
  );
  console.log(
    "[Demo Data] ✓ Company 'Nordic Business AB' has status 'amend-required' with amendment comments",
  );
}

/**
 * Check if demo data exists and return the status
 */
export function hasDemoData(userEmail: string): boolean {
  const storageKey = `companies_${userEmail}`;
  return !!localStorage.getItem(storageKey);
}

/**
 * Clear all demo data for a user
 */
export function clearDemoData(userEmail: string): void {
  const storageKey = `companies_${userEmail}`;
  localStorage.removeItem(storageKey);
  console.log("[Demo Data] ✓ Cleared demo data for user");
}
