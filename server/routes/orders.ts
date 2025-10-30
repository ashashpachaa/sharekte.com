import { RequestHandler } from "express";
import { Order, OrderStatus, RefundStatus } from "../../client/lib/orders";

const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
const AIRTABLE_ORDERS_TABLE = "Orders"; // Will be created in Airtable
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

// Helper function to generate unique ID
function generateOrderId(): string {
  return "ord_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Helper function to create demo orders
function getDemoOrders(): Order[] {
  const today = new Date().toISOString().split("T")[0];
  const renewalDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

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
    // If no Airtable token, return demo orders
    if (!AIRTABLE_API_TOKEN) {
      console.log("No Airtable token configured, returning demo orders");
      const demoOrders = getDemoOrders();

      // Apply filters to demo orders
      let filtered = demoOrders;
      const { status, country } = req.query;

      if (status) {
        filtered = filtered.filter((o) => o.status === status);
      }
      if (country) {
        filtered = filtered.filter((o) => o.country === country);
      }

      return res.json(filtered);
    }

    const { status, country, dateFrom, dateTo, priceMin, priceMax } = req.query;
    const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_ORDERS_TABLE}`;

    const params = new URLSearchParams();

    // Build filter formula
    const filters: string[] = [];

    if (status) {
      filters.push(`{status} = "${status}"`);
    }
    if (country) {
      filters.push(`{country} = "${country}"`);
    }
    if (dateFrom) {
      filters.push(`{purchaseDate} >= "${dateFrom}"`);
    }
    if (dateTo) {
      filters.push(`{purchaseDate} <= "${dateTo}"`);
    }
    if (priceMin) {
      filters.push(`{amount} >= ${priceMin}`);
    }
    if (priceMax) {
      filters.push(`{amount} <= ${priceMax}`);
    }

    if (filters.length > 0) {
      const filterFormula = filters.length === 1
        ? filters[0]
        : `AND(${filters.join(", ")})`;
      params.append("filterByFormula", filterFormula);
    }

    params.append("sort[0][field]", "purchaseDate");
    params.append("sort[0][direction]", "desc");

    const response = await fetch(`${url}?${params}`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.warn(`Airtable API returned ${response.status}: ${response.statusText}, falling back to demo orders`);
      // Fall back to demo orders if Airtable fails
      const demoOrders = getDemoOrders();
      let filtered = demoOrders;

      if (status) {
        filtered = filtered.filter((o) => o.status === status);
      }
      if (country) {
        filtered = filtered.filter((o) => o.country === country);
      }

      return res.json(filtered);
    }

    const data: AirtableResponse = await response.json();

    const orders: Order[] = data.records.map((record) => ({
      id: record.id,
      ...(record.fields as Omit<Order, "id">),
    }));

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    // Fall back to demo orders on any error
    try {
      const demoOrders = getDemoOrders();
      const { status, country } = req.query;
      let filtered = demoOrders;

      if (status) {
        filtered = filtered.filter((o) => o.status === status);
      }
      if (country) {
        filtered = filtered.filter((o) => o.country === country);
      }

      return res.json(filtered);
    } catch (fallbackError) {
      console.error("Failed to return demo orders:", fallbackError);
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
  if (!AIRTABLE_API_TOKEN) {
    return res.status(500).json({ error: "Airtable API token not configured" });
  }

  try {
    const orderData = req.body;
    const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_ORDERS_TABLE}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          orderId: orderData.orderId,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          country: orderData.country,
          companyId: orderData.companyId,
          companyName: orderData.companyName,
          companyNumber: orderData.companyNumber,
          paymentMethod: orderData.paymentMethod,
          paymentStatus: orderData.paymentStatus,
          amount: orderData.amount,
          currency: orderData.currency,
          status: orderData.status,
          purchaseDate: orderData.purchaseDate,
          renewalDate: orderData.renewalDate,
          renewalFees: orderData.renewalFees,
          refundStatus: orderData.refundStatus || "none",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: JSON.stringify(orderData.statusHistory || []),
          documents: JSON.stringify(orderData.documents || []),
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
  if (!AIRTABLE_API_TOKEN) {
    return res.status(500).json({ error: "Airtable API token not configured" });
  }

  try {
    const { orderId } = req.params;
    const updates = req.body;
    const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_ORDERS_TABLE}/${orderId}`;

    const updatePayload: Record<string, unknown> = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (Array.isArray(value) || typeof value === "object") {
        updatePayload[key] = JSON.stringify(value);
      } else {
        updatePayload[key] = value;
      }
    });

    updatePayload.updatedAt = new Date().toISOString();

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: updatePayload,
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
    console.error("Failed to update order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
};

/**
 * Update order status
 */
export const updateOrderStatus: RequestHandler = async (req, res) => {
  if (!AIRTABLE_API_TOKEN) {
    return res.status(500).json({ error: "Airtable API token not configured" });
  }

  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;

    // Get current order
    const getUrl = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_ORDERS_TABLE}/${orderId}`;
    const getResponse = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
      },
    });

    if (!getResponse.ok) {
      return res.status(404).json({ error: "Order not found" });
    }

    const currentRecord: AirtableRecord = await getResponse.json();
    const currentOrder = currentRecord.fields as Partial<Order>;

    // Create status history entry
    const statusHistory = (currentOrder.statusHistory as any[] || []);
    statusHistory.push({
      id: `status-${Date.now()}`,
      fromStatus: currentOrder.status,
      toStatus: status,
      changedDate: new Date().toISOString(),
      reason,
    });

    // Update order
    const updateUrl = getUrl;
    const updateResponse = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          status,
          statusChangedDate: new Date().toISOString(),
          statusHistory: JSON.stringify(statusHistory),
          updatedAt: new Date().toISOString(),
        },
      }),
    });

    if (!updateResponse.ok) {
      throw new Error(`Airtable API error: ${updateResponse.statusText}`);
    }

    const record: AirtableRecord = await updateResponse.json();
    const order: Order = {
      id: record.id,
      ...(record.fields as Omit<Order, "id">),
    };

    res.json(order);
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
          "refundApprovedAmount": approvedAmount,
          "refundFee": refundFee || 0,
          "refundNetAmount": netRefund,
          "refundApprovedDate": new Date().toISOString(),
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
