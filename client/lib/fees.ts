export type FeeType = "fixed" | "percentage";

export interface Fee {
  id: string;
  name: string;
  description?: string;
  type: FeeType; // "fixed" or "percentage"
  amount: number; // Amount in base currency or percentage
  currency?: string; // For fixed fees: USD, AED, etc.
  enabled: boolean;
  order: number; // Display order in checkout
  createdAt: string;
  updatedAt: string;
}

export interface FeesConfig {
  fees: Fee[];
  lastUpdated: string;
}

// Get all enabled fees
export function getEnabledFees(): Fee[] {
  try {
    const config = localStorage.getItem("feesConfig");
    if (!config) return [];
    const parsed = JSON.parse(config) as FeesConfig;
    return parsed.fees.filter((f) => f.enabled).sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

// Calculate fee amount
export function calculateFeeAmount(
  fee: Fee,
  subtotal: number,
): number {
  if (fee.type === "fixed") {
    return fee.amount;
  } else {
    // Percentage
    return (subtotal * fee.amount) / 100;
  }
}

// Calculate total fees for subtotal
export function calculateTotalFees(subtotal: number): number {
  const enabledFees = getEnabledFees();
  return enabledFees.reduce((total, fee) => {
    return total + calculateFeeAmount(fee, subtotal);
  }, 0);
}

// Format fee display
export function formatFeeDisplay(fee: Fee): string {
  if (fee.type === "fixed") {
    return `${fee.name}: ${fee.currency || "USD"} ${fee.amount.toFixed(2)}`;
  } else {
    return `${fee.name}: ${fee.amount.toFixed(2)}%`;
  }
}

// Save fees config
export function saveFeesConfig(fees: Fee[]): void {
  const config: FeesConfig = {
    fees: fees.sort((a, b) => a.order - b.order),
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem("feesConfig", JSON.stringify(config));
}

// Get all fees (enabled and disabled)
export function getAllFees(): Fee[] {
  try {
    const config = localStorage.getItem("feesConfig");
    if (!config) return [];
    const parsed = JSON.parse(config) as FeesConfig;
    return parsed.fees.sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

// Add a new fee
export function addFee(fee: Omit<Fee, "id" | "createdAt" | "updatedAt">): Fee {
  const newFee: Fee = {
    ...fee,
    id: `fee-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const allFees = getAllFees();
  saveFeesConfig([...allFees, newFee]);
  return newFee;
}

// Update a fee
export function updateFee(id: string, updates: Partial<Fee>): Fee | null {
  const allFees = getAllFees();
  const index = allFees.findIndex((f) => f.id === id);
  if (index === -1) return null;

  const updated: Fee = {
    ...allFees[index],
    ...updates,
    id: allFees[index].id,
    createdAt: allFees[index].createdAt,
    updatedAt: new Date().toISOString(),
  };
  allFees[index] = updated;
  saveFeesConfig(allFees);
  return updated;
}

// Delete a fee
export function deleteFee(id: string): boolean {
  const allFees = getAllFees();
  const filtered = allFees.filter((f) => f.id !== id);
  if (filtered.length === allFees.length) return false;
  saveFeesConfig(filtered);
  return true;
}

// Toggle fee enabled status
export function toggleFeeEnabled(id: string): Fee | null {
  const allFees = getAllFees();
  const fee = allFees.find((f) => f.id === id);
  if (!fee) return null;
  return updateFee(id, { enabled: !fee.enabled });
}
