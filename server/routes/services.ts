import { RequestHandler } from "express";
import type { ServiceData, ServiceOrder } from "../../client/lib/services";

// In-memory storage for services and orders
let servicesDb: ServiceData[] = [];
let serviceOrdersDb: ServiceOrder[] = [];

// In-memory storage for service order comments
interface OrderComment {
  id: string;
  orderId: string;
  author: string;
  text: string;
  createdAt: string;
}

let orderCommentsDb: OrderComment[] = [];

// Demo services
const DEMO_SERVICES: ServiceData[] = [
  {
    id: "svc_1",
    name: "Apostille",
    description: "Get your company documents certified with an apostille for international use",
    longDescription:
      "Get your company documents certified with an apostille for international use. Apostille is a form of authentication issued to documents for use in countries that are parties to the Hague Apostille Convention.",
    price: 150,
    currency: "GBP",
    category: "Documents",
    turnaroundDays: 3,
    includes: [
      "Official certification",
      "International recognition",
      "Multiple document copies",
      "Digital delivery",
    ],
    applicationFormFields: [
      {
        id: "field_1",
        name: "company_name",
        label: "Company Name",
        type: "text",
        required: true,
        placeholder: "Enter your company name",
      },
      {
        id: "field_2",
        name: "document_type",
        label: "Document Type",
        type: "select",
        required: true,
        options: [
          { value: "articles", label: "Articles of Association" },
          { value: "memo", label: "Memorandum" },
          { value: "certificate", label: "Certificate of Incorporation" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "field_3",
        name: "copies_needed",
        label: "Number of Copies",
        type: "number",
        required: true,
      },
      {
        id: "field_4",
        name: "delivery_address",
        label: "Delivery Address",
        type: "textarea",
        required: true,
        placeholder: "Enter your delivery address",
      },
    ],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "svc_2",
    name: "Company Registration",
    description: "Register a new company with full compliance support",
    price: 500,
    currency: "USD",
    category: "Setup",
    turnaroundDays: 5,
    includes: [
      "Company name registration",
      "Legal documentation",
      "Tax registration",
      "Bank account setup guidance",
    ],
    applicationFormFields: [
      {
        id: "field_5",
        name: "business_type",
        label: "Business Type",
        type: "select",
        required: true,
        options: [
          { value: "ltd", label: "Limited Company" },
          { value: "llc", label: "LLC" },
          { value: "sole", label: "Sole Proprietor" },
          { value: "partnership", label: "Partnership" },
        ],
      },
      {
        id: "field_6",
        name: "business_address",
        label: "Business Address",
        type: "textarea",
        required: true,
      },
      {
        id: "field_7",
        name: "contact_person",
        label: "Contact Person",
        type: "text",
        required: true,
      },
    ],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initialize with demo services if empty
function initializeDemoServices() {
  if (servicesDb.length === 0) {
    servicesDb = [...DEMO_SERVICES];
  }
}

// Initialize with demo service orders if empty
function initializeDemoOrders() {
  if (serviceOrdersDb.length === 0) {
    serviceOrdersDb = [
      {
        id: "svc_order_001",
        serviceId: "svc_1",
        serviceName: "Apostille",
        customerName: "John Smith",
        customerEmail: "john.smith@example.com",
        customerPhone: "+44 7700 123456",
        amount: 150,
        currency: "GBP",
        status: "pending",
        applicationData: {
          company_name: "Tech Innovations Ltd",
          document_type: "certificate",
          copies_needed: "3",
          delivery_method: "digital",
        },
        purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "svc_order_002",
        serviceId: "svc_2",
        serviceName: "Company Registration",
        customerName: "Sarah Johnson",
        customerEmail: "sarah.johnson@example.com",
        customerPhone: "+1 555 987 6543",
        amount: 500,
        currency: "USD",
        status: "processing",
        applicationData: {
          company_name: "Global Solutions Inc",
          business_type: "technology",
          country: "United States",
          state: "California",
        },
        purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "svc_order_003",
        serviceId: "svc_1",
        serviceName: "Apostille",
        customerName: "Michel Dupont",
        customerEmail: "michel.dupont@example.fr",
        customerPhone: "+33 1 2345 6789",
        amount: 150,
        currency: "GBP",
        status: "completed",
        applicationData: {
          company_name: "France Enterprises SARL",
          document_type: "articles",
          copies_needed: "2",
          delivery_method: "courier",
        },
        purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
}

function generateId(): string {
  return `svc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateOrderId(): string {
  return `svc_ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET /api/services - List all active services
export const getServices: RequestHandler = (req, res) => {
  try {
    initializeDemoServices();
    const activeServices = servicesDb.filter((s) => s.status === "active");
    res.json(activeServices);
  } catch (error) {
    console.error("Error getting services:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
};

// GET /api/services/:id - Get specific service
export const getService: RequestHandler = (req, res) => {
  try {
    initializeDemoServices();
    const service = servicesDb.find((s) => s.id === req.params.id);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json(service);
  } catch (error) {
    console.error("Error getting service:", error);
    res.status(500).json({ error: "Failed to fetch service" });
  }
};

// POST /api/services - Create new service (admin only)
export const createServiceHandler: RequestHandler = (req, res) => {
  try {
    initializeDemoServices();
    const { name, description, price, currency, category, includes, applicationFormFields, status } = req.body;

    if (!name || !description || price === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newService: ServiceData = {
      id: generateId(),
      name,
      description,
      price: parseFloat(price),
      currency: currency || "USD",
      category: category || "Documents",
      includes: includes || [],
      applicationFormFields: applicationFormFields || [],
      status: status || "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    servicesDb.push(newService);
    res.status(201).json(newService);
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ error: "Failed to create service" });
  }
};

// PATCH /api/services/:id - Update service (admin only)
export const updateServiceHandler: RequestHandler = (req, res) => {
  try {
    initializeDemoServices();
    const index = servicesDb.findIndex((s) => s.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: "Service not found" });
    }

    const updated: ServiceData = {
      ...servicesDb[index],
      ...req.body,
      id: servicesDb[index].id,
      createdAt: servicesDb[index].createdAt,
      updatedAt: new Date().toISOString(),
    };

    servicesDb[index] = updated;
    res.json(updated);
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
};

// DELETE /api/services/:id - Delete service (admin only)
export const deleteServiceHandler: RequestHandler = (req, res) => {
  try {
    initializeDemoServices();
    const index = servicesDb.findIndex((s) => s.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: "Service not found" });
    }

    servicesDb.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ error: "Failed to delete service" });
  }
};

// POST /api/service-orders - Create service order
export const createServiceOrderHandler: RequestHandler = (req, res) => {
  try {
    initializeDemoServices();
    const {
      serviceId,
      serviceName,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      currency,
      applicationData,
    } = req.body;

    if (!serviceId || !customerEmail || amount === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newOrder: ServiceOrder = {
      id: generateOrderId(),
      serviceId,
      serviceName: serviceName || "",
      customerName,
      customerEmail,
      customerPhone,
      amount: parseFloat(amount),
      currency: currency || "USD",
      status: "pending",
      applicationData: applicationData || {},
      purchaseDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    serviceOrdersDb.push(newOrder);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error creating service order:", error);
    res.status(500).json({ error: "Failed to create service order" });
  }
};

// GET /api/service-orders - List service orders (with filters)
export const getServiceOrdersHandler: RequestHandler = (req, res) => {
  try {
    initializeDemoOrders();
    let orders = serviceOrdersDb;

    // Apply filters
    if (req.query.status) {
      orders = orders.filter((o) => o.status === req.query.status);
    }
    if (req.query.serviceId) {
      orders = orders.filter((o) => o.serviceId === req.query.serviceId);
    }
    if (req.query.customerEmail) {
      orders = orders.filter((o) =>
        o.customerEmail.toLowerCase().includes(
          (req.query.customerEmail as string).toLowerCase()
        )
      );
    }

    res.json(orders);
  } catch (error) {
    console.error("Error getting service orders:", error);
    res.status(500).json({ error: "Failed to fetch service orders" });
  }
};

// GET /api/service-orders/:id - Get specific order
export const getServiceOrderHandler: RequestHandler = (req, res) => {
  try {
    const order = serviceOrdersDb.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Error getting service order:", error);
    res.status(500).json({ error: "Failed to fetch service order" });
  }
};

// PATCH /api/service-orders/:id - Update order status
export const updateServiceOrderHandler: RequestHandler = (req, res) => {
  try {
    const index = serviceOrdersDb.findIndex((o) => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updated: ServiceOrder = {
      ...serviceOrdersDb[index],
      ...req.body,
      id: serviceOrdersDb[index].id,
      createdAt: serviceOrdersDb[index].createdAt,
      updatedAt: new Date().toISOString(),
    };

    serviceOrdersDb[index] = updated;
    res.json(updated);
  } catch (error) {
    console.error("Error updating service order:", error);
    res.status(500).json({ error: "Failed to update service order" });
  }
};

// GET /api/service-orders/:id/comments - Get order comments
export const getServiceOrderCommentsHandler: RequestHandler = (req, res) => {
  try {
    const comments = orderCommentsDb.filter((c) => c.orderId === req.params.id);
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

// POST /api/service-orders/:id/comments - Add comment to order
export const createServiceOrderCommentHandler: RequestHandler = (req, res) => {
  try {
    const { text, author } = req.body;
    if (!text || !author) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newComment: OrderComment = {
      id: "comment_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      orderId: req.params.id,
      author,
      text,
      createdAt: new Date().toISOString(),
    };

    orderCommentsDb.push(newComment);
    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
};

// PATCH /api/service-orders/:id/status - Update order status
export const updateServiceOrderStatusHandler: RequestHandler = (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const index = serviceOrdersDb.findIndex((o) => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updated: ServiceOrder = {
      ...serviceOrdersDb[index],
      status,
      updatedAt: new Date().toISOString(),
    };

    serviceOrdersDb[index] = updated;
    res.json(updated);
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
};
