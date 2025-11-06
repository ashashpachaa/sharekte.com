/**
 * Renewal System Utilities
 * 
 * Rules:
 * - Renewal Required: 15+ days remaining (days >= 15)
 * - Expired: 0 to -24 days (0 > days >= -24)
 * - Cancelled: -25 or less days (days < -25)
 * - Button visible/enabled: 15 to -25 days
 */

export type RenewalStatus = "renewal-required" | "expired" | "cancelled" | "active";

/**
 * Calculate days remaining until renewal date
 * @param renewalDate ISO date string (YYYY-MM-DD)
 * @returns Number of days remaining (negative if past due)
 */
export function calculateDaysRemaining(renewalDate: string): number {
  try {
    const renewal = new Date(renewalDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    renewal.setHours(0, 0, 0, 0);
    const diffTime = renewal.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    console.error("Error calculating days remaining:", error);
    return 0;
  }
}

/**
 * Determine renewal status based on days remaining
 * @param renewalDate ISO date string
 * @returns RenewalStatus: 'renewal-required', 'expired', 'cancelled', or 'active'
 */
export function calculateRenewalStatus(renewalDate: string): RenewalStatus {
  const daysRemaining = calculateDaysRemaining(renewalDate);
  
  if (daysRemaining >= 15) {
    return "active";
  } else if (daysRemaining >= 0 && daysRemaining < 15) {
    return "renewal-required";
  } else if (daysRemaining > -25 && daysRemaining < 0) {
    return "expired";
  } else {
    return "cancelled";
  }
}

/**
 * Check if renewal button should be visible and enabled
 * Button is enabled when days remaining is between 15 and -25
 * @param renewalDate ISO date string
 * @returns { isVisible: boolean, isEnabled: boolean }
 */
export function getRenewalButtonState(renewalDate: string): {
  isVisible: boolean;
  isEnabled: boolean;
} {
  const daysRemaining = calculateDaysRemaining(renewalDate);
  return {
    isVisible: daysRemaining >= 15 && daysRemaining >= -25,
    isEnabled: daysRemaining >= 15 && daysRemaining >= -25,
  };
}

/**
 * Calculate new renewal date that preserves original month/day
 * 
 * Example:
 * - Original: 21-9-2025 (renewal: 21-9-2026)
 * - Renewed on: 1-10-2026
 * - Next renewal: 21-9-2027 (keeps month/day, advances year)
 * 
 * @param originalRenewalDate The original renewal date (YYYY-MM-DD)
 * @param currentDate Current date for calculation (defaults to today)
 * @returns New renewal date in YYYY-MM-DD format
 */
export function calculateSmartRenewalDate(
  originalRenewalDate: string,
  currentDate: Date = new Date()
): string {
  try {
    const original = new Date(originalRenewalDate);
    
    // Extract month and day from original renewal date
    const originalMonth = original.getMonth(); // 0-11
    const originalDay = original.getDate(); // 1-31
    
    // Get current year
    const currentYear = currentDate.getFullYear();
    
    // Create new date with same month/day but next year
    let newRenewalDate = new Date(currentYear + 1, originalMonth, originalDay);
    
    // If the renewal date is in the past (before today), use the year after that
    if (newRenewalDate < currentDate) {
      newRenewalDate = new Date(currentYear + 2, originalMonth, originalDay);
    }
    
    // Return in YYYY-MM-DD format
    const year = newRenewalDate.getFullYear();
    const month = String(newRenewalDate.getMonth() + 1).padStart(2, "0");
    const day = String(newRenewalDate.getDate()).padStart(2, "0");
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error calculating smart renewal date:", error);
    // Fallback: 1 year from today
    const next = new Date();
    next.setFullYear(next.getFullYear() + 1);
    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, "0");
    const day = String(next.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

/**
 * Get renewal status color and icon config
 */
export function getRenewalStatusConfig(status: RenewalStatus) {
  switch (status) {
    case "active":
      return {
        color: "bg-green-100 text-green-700",
        badgeColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: "CheckCircle",
        label: "Active",
      };
    case "renewal-required":
      return {
        color: "bg-yellow-100 text-yellow-700",
        badgeColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        icon: "AlertCircle",
        label: "Renewal Required",
      };
    case "expired":
      return {
        color: "bg-orange-100 text-orange-700",
        badgeColor: "bg-orange-50",
        borderColor: "border-orange-200",
        icon: "AlertTriangle",
        label: "Expired",
      };
    case "cancelled":
      return {
        color: "bg-red-100 text-red-700",
        badgeColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: "XCircle",
        label: "Cancelled",
      };
  }
}
