import { RequestHandler } from "express";

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses?: number;
  usedCount: number;
  expiryDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  applicableTo?: "all" | "companies" | "services";
  minOrderValue?: number;
}

// In-memory storage for coupons (can be migrated to Airtable)
let couponsDb: Coupon[] = [
  {
    id: "coupon_1",
    code: "WELCOME10",
    description: "10% off for new customers",
    discountType: "percentage",
    discountValue: 10,
    maxUses: 100,
    usedCount: 5,
    active: true,
    applicableTo: "all",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "coupon_2",
    code: "SAVE50",
    description: "Fixed $50 off on orders over $500",
    discountType: "fixed",
    discountValue: 50,
    minOrderValue: 500,
    usedCount: 12,
    active: true,
    applicableTo: "all",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper to generate unique IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET all coupons
export const getCoupons: RequestHandler = (req, res) => {
  try {
    const activeCoupons = couponsDb.filter((c) => c.active);
    res.json(activeCoupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
};

// GET single coupon
export const getCoupon: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const coupon = couponsDb.find((c) => c.id === id);

    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    res.json(coupon);
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({ error: "Failed to fetch coupon" });
  }
};

// POST validate coupon
export const validateCoupon: RequestHandler = (req, res) => {
  try {
    const { code, orderTotal } = req.body;

    if (!code || orderTotal === undefined) {
      return res.status(400).json({
        valid: false,
        discount: 0,
        discountedTotal: orderTotal,
        message: "Code and order total are required",
      });
    }

    // Find coupon by code (case-insensitive)
    const coupon = couponsDb.find(
      (c) => c.code.toUpperCase() === code.toUpperCase(),
    );

    if (!coupon) {
      return res.status(404).json({
        valid: false,
        discount: 0,
        discountedTotal: orderTotal,
        message: "Coupon code not found",
      });
    }

    // Check if coupon is active
    if (!coupon.active) {
      return res.status(400).json({
        valid: false,
        discount: 0,
        discountedTotal: orderTotal,
        message: "Coupon is no longer active",
      });
    }

    // Check expiration date
    if (coupon.expiryDate) {
      const expiryDate = new Date(coupon.expiryDate);
      if (new Date() > expiryDate) {
        return res.status(400).json({
          valid: false,
          discount: 0,
          discountedTotal: orderTotal,
          message: "Coupon has expired",
        });
      }
    }

    // Check max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        valid: false,
        discount: 0,
        discountedTotal: orderTotal,
        message: "Coupon usage limit reached",
      });
    }

    // Check minimum order value
    if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
      return res.status(400).json({
        valid: false,
        discount: 0,
        discountedTotal: orderTotal,
        message: `Minimum order value of ${coupon.minOrderValue} required`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.round((orderTotal * coupon.discountValue) / 100);
    } else {
      discount = coupon.discountValue;
    }

    const discountedTotal = Math.max(0, orderTotal - discount);

    res.json({
      valid: true,
      coupon,
      discount,
      discountedTotal,
      message: "Coupon applied successfully",
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({
      valid: false,
      discount: 0,
      discountedTotal: req.body.orderTotal,
      message: "Error validating coupon",
    });
  }
};

// POST create coupon (admin)
export const createCoupon: RequestHandler = (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      expiryDate,
      active,
      applicableTo,
      minOrderValue,
    } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({
        error: "Code, discount type, and discount value are required",
      });
    }

    // Check if code already exists
    if (couponsDb.some((c) => c.code.toUpperCase() === code.toUpperCase())) {
      return res.status(409).json({
        error: "Coupon code already exists",
      });
    }

    const newCoupon: Coupon = {
      id: generateId("coupon"),
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      maxUses,
      usedCount: 0,
      expiryDate,
      active: active !== false,
      applicableTo: applicableTo || "all",
      minOrderValue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    couponsDb.push(newCoupon);
    res.status(201).json(newCoupon);
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ error: "Failed to create coupon" });
  }
};

// PATCH update coupon (admin)
export const updateCoupon: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const couponIndex = couponsDb.findIndex((c) => c.id === id);
    if (couponIndex === -1) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    // Check for duplicate code if updating code
    if (
      updates.code &&
      couponsDb.some(
        (c) =>
          c.id !== id && c.code.toUpperCase() === updates.code.toUpperCase(),
      )
    ) {
      return res.status(409).json({
        error: "Coupon code already exists",
      });
    }

    const updatedCoupon: Coupon = {
      ...couponsDb[couponIndex],
      ...updates,
      code: updates.code
        ? updates.code.toUpperCase()
        : couponsDb[couponIndex].code,
      updatedAt: new Date().toISOString(),
    };

    couponsDb[couponIndex] = updatedCoupon;
    res.json(updatedCoupon);
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ error: "Failed to update coupon" });
  }
};

// DELETE coupon (admin)
export const deleteCoupon: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const couponIndex = couponsDb.findIndex((c) => c.id === id);
    if (couponIndex === -1) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    couponsDb.splice(couponIndex, 1);
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ error: "Failed to delete coupon" });
  }
};

// Apply coupon (increment usage count) - called after successful order
export const applyCoupon: RequestHandler = (req, res) => {
  try {
    const { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({ error: "Coupon code is required" });
    }

    const coupon = couponsDb.find(
      (c) => c.code.toUpperCase() === couponCode.toUpperCase(),
    );

    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    coupon.usedCount += 1;
    coupon.updatedAt = new Date().toISOString();

    res.json({
      message: "Coupon applied",
      coupon,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ error: "Failed to apply coupon" });
  }
};
