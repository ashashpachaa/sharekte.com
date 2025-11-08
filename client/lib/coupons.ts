import { getAPIBaseURL } from "./transfer-form";

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number; // percentage (0-100) or fixed amount
  maxUses?: number;
  usedCount: number;
  expiryDate?: string; // ISO date string
  active: boolean;
  createdAt: string;
  updatedAt: string;
  applicableTo?: "all" | "companies" | "services"; // what the coupon applies to
  minOrderValue?: number; // minimum order value to apply coupon
}

export interface CouponValidationResponse {
  valid: boolean;
  coupon?: Coupon;
  discount: number;
  discountedTotal: number;
  message?: string;
}

// Fetch all coupons
export async function fetchCoupons(): Promise<Coupon[]> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/coupons`);
    if (!response.ok) throw new Error("Failed to fetch coupons");
    return response.json();
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return [];
  }
}

// Validate and apply coupon
export async function validateCoupon(
  code: string,
  orderTotal: number,
): Promise<CouponValidationResponse> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, orderTotal }),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      return {
        valid: false,
        discount: 0,
        discountedTotal: orderTotal,
        message: "Invalid response from server",
      };
    }

    if (!response.ok) {
      return {
        valid: false,
        discount: 0,
        discountedTotal: orderTotal,
        message: data.message || "Invalid coupon code",
      };
    }

    return data;
  } catch (error) {
    console.error("Error validating coupon:", error);
    return {
      valid: false,
      discount: 0,
      discountedTotal: orderTotal,
      message: "Error validating coupon",
    };
  }
}

// Create coupon (admin)
export async function createCoupon(
  coupon: Omit<Coupon, "id" | "createdAt" | "updatedAt" | "usedCount">,
): Promise<Coupon | null> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/coupons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coupon),
    });

    if (!response.ok) throw new Error("Failed to create coupon");
    return response.json();
  } catch (error) {
    console.error("Error creating coupon:", error);
    return null;
  }
}

// Update coupon (admin)
export async function updateCoupon(
  id: string,
  updates: Partial<Coupon>,
): Promise<Coupon | null> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) throw new Error("Failed to update coupon");
    return response.json();
  } catch (error) {
    console.error("Error updating coupon:", error);
    return null;
  }
}

// Delete coupon (admin)
export async function deleteCoupon(id: string): Promise<boolean> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/coupons/${id}`, {
      method: "DELETE",
    });

    return response.ok;
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return false;
  }
}
