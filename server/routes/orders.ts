import { RequestHandler } from "express";
// Type definitions - copied locally to avoid importing from client code
type OrderStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";
type RefundStatus =
  | "none"
  | "requested"
  | "approved"
  | "rejected"
  | "completed";

interface OrderDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedDate: string;
  uploadedBy: string;
}

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  refundStatus: RefundStatus;
  purchaseDate: string;
  [key: string]: any;
}
import {
  syncOrderToAirtable,
  fetchOrdersFromAirtable,
  updateOrderStatusInAirtable,
} from "../utils/airtable-sync";

const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
const AIRTABLE_ORDERS_TABLE = "tbl01DTvrGtsAaPfZ"; // Orders table
const AIRTABLE_API_URL = "https://api.airtable.com/v0";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

// In-memory storage for orders (when Airtable is not configured)
let inMemoryOrders: Order[] = [];

// File-based persistence for orders
import * as fs from "fs";
import * as path from "path";

const ORDERS_FILE = path.join(process.cwd(), "orders.json");

function loadOrdersFromFile(): Order[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      console.log(`[Orders] Loaded ${parsed.length} orders from file`);
      return parsed;
    }
  } catch (error) {
    console.error("[Orders] Failed to load orders from file:", error);
  }
  return [];
}

function saveOrdersToFile(orders: Order[]): void {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    console.log(`[Orders] Saved ${orders.length} orders to file`);
  } catch (error) {
    console.error("[Orders] Failed to save orders to file:", error);
  }
}

// Load orders from file on startup
inMemoryOrders = loadOrdersFromFile();

// Helper function to generate unique ID
function generateOrderId(): string {
  return (
    "ord_" +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
}

// Helper function to create demo orders
function getDemoOrders(): Order[] {
  const today = new Date().toISOString().split("T")[0];
  const renewalDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return [
    {
      id: "rec_demo_1",
      orderId: "ORD-2024-001",
      customerName: "John Smith",
      customerEmail: "john@techsolutions.com",
      customerPhone: "+44 20 7946 0958",
      billingAddress: "123 Tech Street, London",
      country: "United Kingdom",
      companyId: "comp_1",
      companyName: "Tech Solutions Ltd",
      companyNumber: "12345678",
      paymentMethod: "credit_card",
      paymentStatus: "completed",
      transactionId: "txn_2024_001",
      amount: 500,
      currency: "GBP",
      paymentDate: today,
      status: "completed",
      statusChangedDate: today,
      statusHistory: [
        {
          id: "hist_1",
          fromStatus: "pending-payment",
          toStatus: "completed",
          changedDate: today,
          changedBy: "system",
          notes: "Payment processed successfully",
        },
      ],
      purchaseDate: today,
      lastUpdateDate: today,
      renewalDate,
      renewalFees: 50,
      refundStatus: "none",
      documents: [],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "rec_demo_2",
      orderId: "ORD-2024-002",
      customerName: "Jane Doe",
      customerEmail: "jane@nordicsolutions.se",
      customerPhone: "+46 8 123 45 67",
      billingAddress: "456 Innovation Way, Stockholm",
      country: "Sweden",
      companyId: "comp_2",
      companyName: "Nordic Business AB",
      companyNumber: "987654321",
      paymentMethod: "bank_transfer",
      paymentStatus: "completed",
      transactionId: "txn_2024_002",
      amount: 450,
      currency: "SEK",
      paymentDate: today,
      status: "transfer-form-pending",
      statusChangedDate: today,
      statusHistory: [
        {
          id: "hist_2",
          fromStatus: "pending-payment",
          toStatus: "paid",
          changedDate: today,
          changedBy: "system",
        },
        {
          id: "hist_3",
          fromStatus: "paid",
          toStatus: "transfer-form-pending",
          changedDate: today,
          changedBy: "admin",
          notes: "Awaiting transfer form submission",
        },
      ],
      purchaseDate: today,
      lastUpdateDate: today,
      renewalDate,
      renewalFees: 45,
      refundStatus: "none",
      documents: [],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "rec_demo_3",
      orderId: "ORD-2024-003",
      customerName: "Ahmed Al-Mansouri",
      customerEmail: "ahmed@dubaibiz.ae",
      customerPhone: "+971 4 123 4567",
      billingAddress: "789 Business Park, Dubai",
      country: "United Arab Emirates",
      companyId: "comp_3",
      companyName: "Dubai Trade FZCO",
      companyNumber: "FZ-123456",
      paymentMethod: "credit_card",
      paymentStatus: "pending",
      transactionId: "",
      amount: 600,
      currency: "AED",
      paymentDate: today,
      status: "pending-payment",
      statusChangedDate: today,
      statusHistory: [
        {
          id: "hist_4",
          fromStatus: "pending-payment",
          toStatus: "pending-payment",
          changedDate: today,
          changedBy: "system",
          notes: "Order created",
        },
      ],
      purchaseDate: today,
      lastUpdateDate: today,
      renewalDate,
      renewalFees: 60,
      refundStatus: "none",
      documents: [],
      createdAt: today,
      updatedAt: today,
    },
  ];
}

/**
 * Get all orders
 */
export const getOrders: RequestHandler = async (req, res) => {
  try {
    let allOrders: Order[] = [];

    // Try to fetch from Airtable first
    if (AIRTABLE_API_TOKEN) {
      console.log("[getOrders] Attempting to fetch from Airtable...");
      try {
        allOrders = await fetchOrdersFromAirtable();
        console.log(
          `[getOrders] Successfully fetched ${allOrders.length} orders from Airtable`,
        );
      } catch (airtableError) {
        console.error("[getOrders] Airtable fetch failed:", airtableError);
        // Continue to fallback
        allOrders = [];
      }
    } else {
      console.log(
        "[getOrders] AIRTABLE_API_TOKEN not configured, using fallback",
      );
    }

    // If Airtable is not configured or empty, use demo + in-memory
    if (allOrders.length === 0) {
      console.log("[getOrders] Using demo orders + in-memory orders");
      const demoOrders = getDemoOrders();
      allOrders = [...demoOrders, ...inMemoryOrders];
    } else {
      // Merge in-memory orders with Airtable orders
      // In-memory orders take priority (they have the latest documents and updates)
      const mergedOrders = [...allOrders];
      for (const inMemOrder of inMemoryOrders) {
        const existingIndex = mergedOrders.findIndex(
          (o) => o.orderId === inMemOrder.orderId || o.id === inMemOrder.id,
        );
        if (existingIndex >= 0) {
          // Replace Airtable order with in-memory version (which has latest documents)
          console.log(
            `[getOrders] Merging in-memory order into Airtable result: ${inMemOrder.orderId}`,
          );
          mergedOrders[existingIndex] = inMemOrder;
        } else {
          // Add new in-memory order
          mergedOrders.push(inMemOrder);
        }
      }
      allOrders = mergedOrders;
      console.log(
        `[getOrders] Merged ${inMemoryOrders.length} in-memory orders with ${allOrders.length - inMemoryOrders.length} Airtable orders`,
      );
    }

    // Apply filters
    let filtered = allOrders;
    const { status, country } = req.query;

    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }
    if (country) {
      filtered = filtered.filter((o) => o.country === country);
    }

    console.log(
      `[getOrders] Returning ${filtered.length} orders (filtered from ${allOrders.length} total)`,
    );
    res.json(filtered);
  } catch (error) {
    console.error("[getOrders] Unexpected error:", error);
    try {
      console.log("[getOrders] Falling back to demo + in-memory orders");
      const demoOrders = getDemoOrders();
      let allOrders = [...demoOrders, ...inMemoryOrders];
      const { status, country } = req.query;

      if (status) {
        allOrders = allOrders.filter((o) => o.status === status);
      }
      if (country) {
        allOrders = allOrders.filter((o) => o.country === country);
      }

      console.log(`[getOrders] Fallback returning ${allOrders.length} orders`);
      return res.json(allOrders);
    } catch (fallbackError) {
      console.error(
        "[getOrders] Failed to return demo + in-memory orders:",
        fallbackError,
      );
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  }
};

/**
 * Get single order by ID
 */
export const getOrderById: RequestHandler = async (req, res) => {
  if (!AIRTABLE_API_TOKEN) {
    return res.status(500).json({ error: "Airtable API token not configured" });
  }

  try {
    const { orderId } = req.params;
    const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_ORDERS_TABLE}/${orderId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      return res.status(404).json({ error: "Order not found" });
    }

    const record: AirtableRecord = await response.json();
    const order: Order = {
      id: record.id,
      ...(record.fields as Omit<Order, "id">),
    };

    res.json(order);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

/**
 * Create new order
 */
export const createOrder: RequestHandler = async (req, res) => {
  try {
    const orderData = req.body;
    const now = new Date().toISOString();

    // Prepare order with timestamps
    const order: Order = {
      id: `ord-${Date.now()}`,
      ...orderData,
      createdAt: orderData.createdAt || now,
      updatedAt: orderData.updatedAt || now,
    };

    console.log(
      "[createOrder] Creating order:",
      order.orderId,
      "- Amount:",
      order.amount,
      order.currency,
    );

    // Always store in in-memory first (primary persistence for documents)
    inMemoryOrders.push(order);
    saveOrdersToFile(inMemoryOrders);
    console.log("[createOrder] ✓ Stored order in-memory and saved to file");

    // Sync to Airtable immediately (wait for completion)
    if (AIRTABLE_API_TOKEN) {
      try {
        const airtableId = await syncOrderToAirtable(order);
        if (airtableId) {
          order.airtableId = airtableId;
          console.log(
            "[createOrder] ✓ Order synced to Airtable with ID:",
            airtableId,
          );
        }
      } catch (airtableError) {
        console.error(
          "[createOrder] Warning - Airtable sync failed:",
          airtableError,
        );
        // Don't fail the request, order is safe in-memory
      }
    } else {
      console.log(
        "[createOrder] Note: AIRTABLE_API_TOKEN not set, order stored in-memory only",
      );
    }

    res.status(201).json(order);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

/**
 * Update order
 */
export const updateOrder: RequestHandler = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;
    const now = new Date().toISOString();

    // Find the order (from Airtable or in-memory)
    let allOrders = [...getDemoOrders(), ...inMemoryOrders];
    if (AIRTABLE_API_TOKEN) {
      const airtableOrders = await fetchOrdersFromAirtable();
      allOrders = [...airtableOrders, ...inMemoryOrders];
    }

    const existingOrder = allOrders.find(
      (o) => o.id === orderId || o.orderId === orderId,
    );
    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Prepare updated order
    const updatedOrder: Order = {
      ...existingOrder,
      ...updates,
      updatedAt: now,
    };

    // Sync to Airtable if configured
    if (existingOrder.airtableId && AIRTABLE_API_TOKEN) {
      await syncOrderToAirtable(updatedOrder, existingOrder.airtableId);
    } else if (AIRTABLE_API_TOKEN) {
      const airtableId = await syncOrderToAirtable(updatedOrder);
      if (airtableId) {
        updatedOrder.airtableId = airtableId;
      }
    }

    // Update in-memory if exists
    const inMemIndex = inMemoryOrders.findIndex(
      (o) => o.id === orderId || o.orderId === orderId,
    );
    if (inMemIndex >= 0) {
      inMemoryOrders[inMemIndex] = updatedOrder;
      saveOrdersToFile(inMemoryOrders);
      console.log("[updateOrder] ✓ Order updated and saved to file");
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Failed to update order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
};

/**
 * Update order status
 */
export const updateOrderStatus: RequestHandler = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;
    const now = new Date().toISOString();

    // Find the order
    let allOrders = [...getDemoOrders(), ...inMemoryOrders];
    if (AIRTABLE_API_TOKEN) {
      const airtableOrders = await fetchOrdersFromAirtable();
      allOrders = [...airtableOrders, ...inMemoryOrders];
    }

    const currentOrder = allOrders.find(
      (o) => o.id === orderId || o.orderId === orderId,
    );
    if (!currentOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Create status history entry
    const statusHistory = [
      ...(currentOrder.statusHistory || []),
      {
        id: `status-${Date.now()}`,
        fromStatus: currentOrder.status as OrderStatus,
        toStatus: status as OrderStatus,
        changedDate: now,
        changedBy: "system",
        reason,
        notes: `Status changed from ${currentOrder.status} to ${status}`,
      },
    ];

    // Update order
    const updatedOrder: Order = {
      ...currentOrder,
      status: status as OrderStatus,
      statusChangedDate: now,
      statusHistory,
      lastUpdateDate: now,
      updatedAt: now,
    };

    // Sync to Airtable if configured
    if (currentOrder.airtableId && AIRTABLE_API_TOKEN) {
      await updateOrderStatusInAirtable(currentOrder.airtableId, status, now);
      await syncOrderToAirtable(updatedOrder, currentOrder.airtableId);
    } else if (AIRTABLE_API_TOKEN) {
      const airtableId = await syncOrderToAirtable(updatedOrder);
      if (airtableId) {
        updatedOrder.airtableId = airtableId;
      }
    }

    // Update in-memory if exists
    const inMemIndex = inMemoryOrders.findIndex(
      (o) => o.id === orderId || o.orderId === orderId,
    );
    if (inMemIndex >= 0) {
      inMemoryOrders[inMemIndex] = updatedOrder;
      saveOrdersToFile(inMemoryOrders);
      console.log(
        "[updateOrderStatus] ✓ Order status updated and saved to file",
      );
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Failed to update order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

/**
 * Request refund
 */
export const requestRefund: RequestHandler = async (req, res) => {
  if (!AIRTABLE_API_TOKEN) {
    return res.status(500).json({ error: "Airtable API token not configured" });
  }

  try {
    const { orderId } = req.params;
    const { reason, requestedAmount } = req.body;

    const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_ORDERS_TABLE}/${orderId}`;

    const refundRequest = {
      id: `refund-${Date.now()}`,
      requestDate: new Date().toISOString(),
      reason,
      status: "requested" as RefundStatus,
      requestedAmount,
    };

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          refundStatus: "requested",
          refundRequest: JSON.stringify(refundRequest),
          updatedAt: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const record: AirtableRecord = await response.json();
    const order: Order = {
      id: record.id,
      ...(record.fields as Omit<Order, "id">),
    };

    res.json(order);
  } catch (error) {
    console.error("Failed to request refund:", error);
    res.status(500).json({ error: "Failed to request refund" });
  }
};

/**
 * Approve refund
 */
export const approveRefund: RequestHandler = async (req, res) => {
  if (!AIRTABLE_API_TOKEN) {
    return res.status(500).json({ error: "Airtable API token not configured" });
  }

  try {
    const { orderId } = req.params;
    const { approvedAmount, refundFee } = req.body;

    const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_ORDERS_TABLE}/${orderId}`;
    const netRefund = approvedAmount - (refundFee || 0);

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          refundStatus: "approved",
          refundApprovedAmount: approvedAmount,
          refundFee: refundFee || 0,
          refundNetAmount: netRefund,
          refundApprovedDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const record: AirtableRecord = await response.json();
    const order: Order = {
      id: record.id,
      ...(record.fields as Omit<Order, "id">),
    };

    res.json(order);
  } catch (error) {
    console.error("Failed to approve refund:", error);
    res.status(500).json({ error: "Failed to approve refund" });
  }
};

/**
 * Reject refund
 */
export const rejectRefund: RequestHandler = async (req, res) => {
  if (!AIRTABLE_API_TOKEN) {
    return res.status(500).json({ error: "Airtable API token not configured" });
  }

  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_ORDERS_TABLE}/${orderId}`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          refundStatus: "rejected",
          refundRejectionReason: reason,
          updatedAt: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const record: AirtableRecord = await response.json();
    const order: Order = {
      id: record.id,
      ...(record.fields as Omit<Order, "id">),
    };

    res.json(order);
  } catch (error) {
    console.error("Failed to reject refund:", error);
    res.status(500).json({ error: "Failed to reject refund" });
  }
};

/**
 * Delete order
 */
export const deleteOrder: RequestHandler = async (req, res) => {
  if (!AIRTABLE_API_TOKEN) {
    return res.status(500).json({ error: "Airtable API token not configured" });
  }

  try {
    const { orderId } = req.params;
    const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_ORDERS_TABLE}/${orderId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
};

/**
 * Upload document to order
 */
/**
 * Helper function to get the latest merged order
 * In-memory orders take priority as they have the most recent updates
 */
async function getLatestOrder(orderId: string): Promise<Order | undefined> {
  try {
    // First, check in-memory (most recent)
    let currentOrder = inMemoryOrders.find(
      (o) => o.id === orderId || o.orderId === orderId,
    );
    if (currentOrder) {
      console.log(
        `[getLatestOrder] Found in in-memory storage: ${currentOrder.orderId}`,
      );
      return currentOrder;
    }

    // Then try Airtable
    if (AIRTABLE_API_TOKEN) {
      try {
        const airtableOrders = await fetchOrdersFromAirtable();
        currentOrder = airtableOrders.find(
          (o) => o.id === orderId || o.orderId === orderId,
        );
        if (currentOrder) {
          console.log(
            `[getLatestOrder] Found in Airtable: ${currentOrder.orderId}`,
          );
          return currentOrder;
        }
      } catch (airtableError) {
        console.error(
          "[getLatestOrder] Failed to fetch from Airtable:",
          airtableError,
        );
      }
    }

    // Finally, check demo orders
    const demoOrders = getDemoOrders();
    currentOrder = demoOrders.find(
      (o) => o.id === orderId || o.orderId === orderId,
    );
    if (currentOrder) {
      console.log(
        `[getLatestOrder] Found in demo orders: ${currentOrder.orderId}`,
      );
    }

    return currentOrder;
  } catch (error) {
    console.error("[getLatestOrder] Error fetching order:", error);
    return undefined;
  }
}

export const uploadOrderDocument: RequestHandler = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      file,
      fileName,
      fileType,
      fileSize,
      visibility = "both",
    } = req.body;

    console.log(
      `[uploadOrderDocument] Uploading document for order: ${orderId}, file: ${fileName}`,
    );

    if (!file || !fileName) {
      console.error("[uploadOrderDocument] Missing file or fileName:", {
        file: !!file,
        fileName,
      });
      return res.status(400).json({ error: "No file provided" });
    }

    if (!file.trim()) {
      console.error("[uploadOrderDocument] File data is empty");
      return res.status(400).json({ error: "File data is empty" });
    }

    // Get the latest version of the order
    const currentOrder = await getLatestOrder(orderId);
    if (!currentOrder) {
      console.error(`[uploadOrderDocument] Order not found: ${orderId}`);
      console.error(
        `[uploadOrderDocument] Available order IDs:`,
        allOrders.map((o) => o.id || o.orderId),
      );
      return res.status(404).json({ error: "Order not found" });
    }

    console.log(`[uploadOrderDocument] Found order: ${currentOrder.orderId}`);

    // Create document object with base64 file data
    const document: OrderDocument = {
      id: `doc_${Date.now()}`,
      name: fileName,
      type: fileType || "application/octet-stream",
      size: fileSize || 0,
      fileData: file, // Store base64 encoded file data
      uploadedDate: new Date().toISOString(),
      uploadedBy: "admin",
      visibility: visibility as "admin" | "user" | "both",
      version: 1,
    };

    // Add document to order
    const updatedOrder: Order = {
      ...currentOrder,
      documents: [...(currentOrder.documents || []), document],
      status: "completed", // Auto-complete order when documents are uploaded
      updatedAt: new Date().toISOString(),
    };

    console.log(
      `[uploadOrderDocument] Added document to order. Total documents: ${updatedOrder.documents.length}`,
    );
    console.log(
      `[uploadOrderDocument] Automatically changing order status to "completed" due to document upload`,
    );

    // Update in-memory storage FIRST (this is our source of truth for persistence)
    const inMemIndex = inMemoryOrders.findIndex(
      (o) => o.id === orderId || o.orderId === orderId,
    );
    if (inMemIndex >= 0) {
      // Update existing in-memory order
      inMemoryOrders[inMemIndex] = updatedOrder;
      console.log(`[uploadOrderDocument] Updated existing in-memory order`);
    } else {
      // Add new in-memory order if not found
      inMemoryOrders.push(updatedOrder);
      console.log(`[uploadOrderDocument] Added new in-memory order`);
    }

    // Sync to Airtable if configured and record exists
    let airtableSyncSuccess = false;
    if (currentOrder.airtableId && AIRTABLE_API_TOKEN) {
      try {
        const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_ORDERS_TABLE}/${currentOrder.airtableId}`;
        console.log(`[uploadOrderDocument] Syncing to Airtable: ${url}`);

        const airtableResponse = await fetch(url, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              documents: JSON.stringify(
                updatedOrder.documents.map((d) => ({
                  id: d.id,
                  name: d.name,
                  type: d.type,
                  size: d.size,
                  uploadedDate: d.uploadedDate,
                  visibility: d.visibility,
                })),
              ),
              Status: "completed", // Sync the automatic status change to Airtable
              "Status Changed Date": new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        });

        if (airtableResponse.ok) {
          console.log(`[uploadOrderDocument] ✓ Synced to Airtable`);
          airtableSyncSuccess = true;
        } else {
          console.error(
            `[uploadOrderDocument] Airtable sync failed: ${airtableResponse.status} ${airtableResponse.statusText}`,
          );
        }
      } catch (airtableError) {
        console.error(
          "[uploadOrderDocument] Failed to sync document to Airtable:",
          airtableError,
        );
        // Document is safe in in-memory, don't fail the request
      }
    }

    console.log(`[uploadOrderDocument] ✓ Document uploaded successfully`);
    res.json(updatedOrder);
  } catch (error) {
    console.error("[uploadOrderDocument] Error:", error);
    res
      .status(500)
      .json({ error: "Failed to upload document", details: String(error) });
  }
};

/**
 * Delete order document
 */
export const deleteOrderDocument: RequestHandler = async (req, res) => {
  try {
    const { orderId, documentId } = req.params;

    console.log(
      `[deleteOrderDocument] Deleting document ${documentId} from order ${orderId}`,
    );

    // Find the order - check in-memory first since it has the latest state
    let currentOrder = inMemoryOrders.find(
      (o) => o.id === orderId || o.orderId === orderId,
    );

    // If not in-memory, try Airtable
    if (!currentOrder && AIRTABLE_API_TOKEN) {
      try {
        const airtableOrders = await fetchOrdersFromAirtable();
        currentOrder = airtableOrders.find(
          (o) => o.id === orderId || o.orderId === orderId,
        );
      } catch (airtableError) {
        console.error(
          "[deleteOrderDocument] Failed to fetch from Airtable:",
          airtableError,
        );
      }
    }

    // Fallback to demo orders
    if (!currentOrder) {
      const demoOrders = getDemoOrders();
      currentOrder = demoOrders.find(
        (o) => o.id === orderId || o.orderId === orderId,
      );
    }

    if (!currentOrder) {
      console.error(`[deleteOrderDocument] Order not found: ${orderId}`);
      return res.status(404).json({ error: "Order not found" });
    }

    console.log(`[deleteOrderDocument] Found order: ${currentOrder.orderId}`);

    // Remove document from order
    const updatedOrder: Order = {
      ...currentOrder,
      documents: (currentOrder.documents || []).filter(
        (d) => d.id !== documentId,
      ),
      updatedAt: new Date().toISOString(),
    };

    // Update in-memory storage FIRST (primary persistence)
    const inMemIndex = inMemoryOrders.findIndex(
      (o) => o.id === orderId || o.orderId === orderId,
    );
    if (inMemIndex >= 0) {
      inMemoryOrders[inMemIndex] = updatedOrder;
      console.log(`[deleteOrderDocument] Updated in-memory order`);
    } else {
      // Add to in-memory if not found
      inMemoryOrders.push(updatedOrder);
      console.log(`[deleteOrderDocument] Added order to in-memory storage`);
    }

    // Sync to Airtable if configured and record exists
    if (currentOrder.airtableId && AIRTABLE_API_TOKEN) {
      try {
        const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_ORDERS_TABLE}/${currentOrder.airtableId}`;
        console.log(`[deleteOrderDocument] Syncing to Airtable: ${url}`);

        const airtableResponse = await fetch(url, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              documents: JSON.stringify(updatedOrder.documents),
              updatedAt: new Date().toISOString(),
            },
          }),
        });

        if (airtableResponse.ok) {
          console.log(`[deleteOrderDocument] ✓ Synced to Airtable`);
        } else {
          console.error(
            `[deleteOrderDocument] Airtable sync failed: ${airtableResponse.status}`,
          );
        }
      } catch (airtableError) {
        console.error(
          "[deleteOrderDocument] Failed to sync document deletion to Airtable:",
          airtableError,
        );
        // Don't fail the request if Airtable sync fails - document is safe in-memory
      }
    }

    console.log(`[deleteOrderDocument] ✓ Document deleted successfully`);
    res.json(updatedOrder);
  } catch (error) {
    console.error("[deleteOrderDocument] Error:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
};

/**
 * Clear all orders from in-memory and file-based storage
 * Admin only action to reset orders to zero
 */
export const clearAllOrders: RequestHandler = async (req, res) => {
  try {
    console.log("[clearAllOrders] Starting clear all orders operation");

    // Clear in-memory orders
    inMemoryOrders = [];
    console.log("[clearAllOrders] ✓ In-memory orders cleared");

    // Clear persistent file storage
    saveOrdersToFile([]);
    console.log("[clearAllOrders] ✓ Orders file cleared");

    // Note: Airtable records can be cleared separately if needed
    // This would require fetching all records and deleting them individually
    // For now, we just clear local storage

    res.status(200).json({
      success: true,
      message:
        "All orders cleared successfully. System is now starting from zero orders.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[clearAllOrders] Error clearing orders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear orders",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
