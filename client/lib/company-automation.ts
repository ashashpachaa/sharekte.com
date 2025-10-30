import {
  CompanyData,
  CompanyStatus,
  calculateRenewalDaysLeft,
  calculateExpiryDate,
  determineStatus,
} from "./company-management";

/**
 * Company Automation & Status Management
 * Handles automated business logic for company status, renewals, and transitions
 */

// Check if company needs renewal soon (within 30 days)
export function isRenewalDueSoon(company: CompanyData): boolean {
  return company.renewalDaysLeft <= 30 && company.renewalDaysLeft > 0;
}

// Check if company is expired
export function isExpired(company: CompanyData): boolean {
  return company.renewalDaysLeft <= 0;
}

// Check if company is active and healthy
export function isHealthy(company: CompanyData): boolean {
  return (
    company.status === "active" &&
    company.paymentStatus === "paid" &&
    company.renewalDaysLeft > 30
  );
}

// Auto-determine status based on dates and current state
export function autoUpdateStatus(company: CompanyData): CompanyData {
  if (company.status === "available" || company.status === "pending") {
    return company;
  }

  const newStatus = determineStatus(company.renewalDate, company.status);

  if (newStatus !== company.status) {
    return {
      ...company,
      status: newStatus,
      updatedAt: new Date().toISOString().split("T")[0],
      activityLog: [
        ...company.activityLog,
        {
          id: `log_auto_${Date.now()}`,
          timestamp: new Date().toISOString().split("T")[0],
          action: "Automatic Status Update",
          performedBy: "system",
          details: `Status automatically changed from ${company.status} to ${newStatus} based on renewal date`,
          previousStatus: company.status,
          newStatus: newStatus,
        },
      ],
    };
  }

  return company;
}

// Process company renewal
export function processRenewal(company: CompanyData): CompanyData {
  if (company.status === "refunded" || company.status === "cancelled") {
    return company;
  }

  const today = new Date().toISOString().split("T")[0];
  const newRenewalDate = calculateExpiryDate(today);
  const newExpiryDate = calculateExpiryDate(newRenewalDate);
  const newRenewalDaysLeft = calculateRenewalDaysLeft(newRenewalDate);

  return {
    ...company,
    renewalDate: newRenewalDate,
    expiryDate: newExpiryDate,
    renewalDaysLeft: newRenewalDaysLeft,
    status: "active",
    paymentStatus: company.paymentStatus === "pending" ? "pending" : "paid",
    updatedAt: today,
    activityLog: [
      ...company.activityLog,
      {
        id: `log_renewal_${Date.now()}`,
        timestamp: today,
        action: "Company Renewed",
        performedBy: "system",
        details: `Company renewed successfully. New renewal date: ${newRenewalDate}. New expiry date: ${newExpiryDate}`,
        newStatus: "active",
      },
    ],
  };
}

// Handle refund and move company back to available
export function processRefund(
  company: CompanyData,
  refundReason: string,
  refundAmount: number
): CompanyData {
  const today = new Date().toISOString().split("T")[0];

  const updated: CompanyData = {
    ...company,
    status: "refunded",
    paymentStatus: "refunded",
    refundStatus: "fully-refunded",
    updatedAt: today,
    activityLog: [
      ...company.activityLog,
      {
        id: `log_refund_${Date.now()}`,
        timestamp: today,
        action: "Company Refunded",
        performedBy: "admin",
        details: `Company refunded. Reason: ${refundReason}. Refund amount: ${refundAmount}`,
        previousStatus: company.status,
        newStatus: "refunded",
      },
    ],
    ownershipHistory: [
      ...company.ownershipHistory,
      {
        id: `history_${Date.now()}`,
        previousOwner: company.clientName,
        newOwner: "System",
        transferDate: today,
        reason: "refund",
        notes: `Refunded to system. Original reason: ${refundReason}`,
      },
    ],
  };

  return updated;
}

// Reactivate refunded/cancelled company back to available
export function reactivateCompany(company: CompanyData): CompanyData {
  if (
    company.status !== "refunded" &&
    company.status !== "cancelled"
  ) {
    return company;
  }

  const today = new Date().toISOString().split("T")[0];

  return {
    ...company,
    status: "available",
    updatedAt: today,
    activityLog: [
      ...company.activityLog,
      {
        id: `log_reactivate_${Date.now()}`,
        timestamp: today,
        action: "Company Reactivated",
        performedBy: "admin",
        details: `Company made available for purchase again`,
        previousStatus: company.status,
        newStatus: "available",
      },
    ],
  };
}

// Handle company cancellation
export function cancelCompany(
  company: CompanyData,
  reason: string
): CompanyData {
  const today = new Date().toISOString().split("T")[0];

  return {
    ...company,
    status: "cancelled",
    updatedAt: today,
    activityLog: [
      ...company.activityLog,
      {
        id: `log_cancel_${Date.now()}`,
        timestamp: today,
        action: "Company Cancelled",
        performedBy: "admin",
        details: `Company cancelled. Reason: ${reason}`,
        previousStatus: company.status,
        newStatus: "cancelled",
      },
    ],
    ownershipHistory: [
      ...company.ownershipHistory,
      {
        id: `history_${Date.now()}`,
        previousOwner: company.clientName,
        newOwner: "System",
        transferDate: today,
        reason: "cancellation",
        notes: `Cancelled. Reason: ${reason}`,
      },
    ],
  };
}

// Transfer company ownership
export function transferOwnership(
  company: CompanyData,
  newOwnerName: string,
  newOwnerEmail: string,
  transferReason: string
): CompanyData {
  const today = new Date().toISOString().split("T")[0];

  return {
    ...company,
    clientName: newOwnerName,
    clientEmail: newOwnerEmail,
    updatedAt: today,
    activityLog: [
      ...company.activityLog,
      {
        id: `log_transfer_${Date.now()}`,
        timestamp: today,
        action: "Ownership Transferred",
        performedBy: "admin",
        details: `Ownership transferred from ${company.clientName} to ${newOwnerName}. Reason: ${transferReason}`,
      },
    ],
    ownershipHistory: [
      ...company.ownershipHistory,
      {
        id: `history_${Date.now()}`,
        previousOwner: company.clientName,
        newOwner: newOwnerName,
        transferDate: today,
        reason: "sale",
        notes: `Transferred to ${newOwnerName} (${newOwnerEmail}). Reason: ${transferReason}`,
      },
    ],
  };
}

// Get companies needing immediate attention
export function getCompaniesNeedingAttention(
  companies: CompanyData[]
): CompanyData[] {
  return companies.filter(
    (c) =>
      isExpired(c) ||
      (isRenewalDueSoon(c) && c.paymentStatus !== "paid") ||
      c.paymentStatus === "failed" ||
      c.paymentStatus === "pending"
  );
}

// Get renewal notifications
export interface RenewalNotification {
  companyId: string;
  companyName: string;
  daysLeft: number;
  renewalDate: string;
  type: "urgent" | "warning" | "info";
  message: string;
}

export function getRenewalNotifications(
  companies: CompanyData[]
): RenewalNotification[] {
  return companies
    .filter((c) => c.status === "active" && c.renewalDaysLeft > 0)
    .map((c) => {
      let type: "urgent" | "warning" | "info" = "info";
      let message = "";

      if (c.renewalDaysLeft <= 7) {
        type = "urgent";
        message = `Company renewal due in ${c.renewalDaysLeft} days - URGENT`;
      } else if (c.renewalDaysLeft <= 30) {
        type = "warning";
        message = `Company renewal due in ${c.renewalDaysLeft} days`;
      } else {
        type = "info";
        message = `Company renewal due on ${c.renewalDate}`;
      }

      return {
        companyId: c.id,
        companyName: c.companyName,
        daysLeft: c.renewalDaysLeft,
        renewalDate: c.renewalDate,
        type,
        message,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

// Batch update company statuses
export function batchAutoUpdateStatuses(
  companies: CompanyData[]
): CompanyData[] {
  return companies.map((c) => autoUpdateStatus(c));
}

// Get company health score (0-100)
export function getCompanyHealthScore(company: CompanyData): number {
  let score = 100;

  // Payment status
  if (company.paymentStatus === "pending") score -= 20;
  if (company.paymentStatus === "failed") score -= 40;
  if (company.paymentStatus === "refunded") score -= 50;

  // Renewal status
  if (company.renewalDaysLeft <= 0) score -= 30;
  if (company.renewalDaysLeft <= 7) score -= 20;
  if (company.renewalDaysLeft <= 30) score -= 10;

  // Company status
  if (company.status === "expired") score -= 30;
  if (company.status === "cancelled") score -= 50;
  if (company.status === "refunded") score -= 40;

  return Math.max(0, score);
}

// Get company status color based on health
export function getHealthColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

// Generate renewal reminders
export function generateRenewalReminders(
  companies: CompanyData[]
): string[] {
  const reminders: string[] = [];

  companies.forEach((c) => {
    if (c.status !== "active") return;

    if (c.renewalDaysLeft === 30) {
      reminders.push(`30-day renewal reminder: ${c.companyName} (${c.companyNumber})`);
    } else if (c.renewalDaysLeft === 14) {
      reminders.push(`2-week renewal reminder: ${c.companyName} (${c.companyNumber})`);
    } else if (c.renewalDaysLeft === 7) {
      reminders.push(`7-day renewal reminder: ${c.companyName} (${c.companyNumber})`);
    } else if (c.renewalDaysLeft === 1) {
      reminders.push(`URGENT: ${c.companyName} renews tomorrow!`);
    } else if (c.renewalDaysLeft === 0) {
      reminders.push(`CRITICAL: ${c.companyName} renewal due today!`);
    } else if (c.renewalDaysLeft < 0) {
      reminders.push(`OVERDUE: ${c.companyName} renewal overdue by ${Math.abs(c.renewalDaysLeft)} days!`);
    }
  });

  return reminders;
}
