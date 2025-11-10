import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { handleDemo } from "./routes/demo";
import { getCountries, getYears } from "./routes/airtable";
import { handleSupportSubmit } from "./routes/support";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  requestRefund,
  approveRefund,
  rejectRefund,
  deleteOrder,
  uploadOrderDocument,
  deleteOrderDocument,
  clearAllOrders,
} from "./routes/orders";
import {
  sendEmailNotification,
  getNotifications,
} from "./routes/notifications";
import { getEmailPreview } from "./routes/email-preview";
import { handleChat, handleSaveSession } from "./routes/chat";
import {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  updateCompanyStatus,
  renewCompany,
  requestRefund as requestCompanyRefund,
  approveRefund as approveCompanyRefund,
  markCompanyAsSold,
  clearCompaniesCache,
} from "./routes/companies";
import {
  getTransferForms,
  getTransferForm,
  createTransferForm,
  updateTransferForm,
  updateFormStatus,
  deleteTransferForm,
  addDirector,
  removeDirector,
  addShareholder,
  addComment,
  uploadAttachment,
  deleteAttachment,
  generatePDF,
  getFormAnalytics,
} from "./routes/transfer-forms";
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  uploadAttachment as uploadInvoiceAttachment,
  deleteAttachment as deleteInvoiceAttachment,
  sendInvoiceEmail,
  generatePDF as generateInvoicePDF,
  bulkUpdateStatus,
  bulkSendEmails,
  exportCSV,
  getAnalyticsSummary as getInvoiceAnalytics,
} from "./routes/invoices";
import {
  getServices,
  getService,
  createServiceHandler,
  updateServiceHandler,
  deleteServiceHandler,
  createServiceOrderHandler,
  getServiceOrdersHandler,
  getServiceOrderHandler,
  updateServiceOrderHandler,
  getServiceOrderCommentsHandler,
  createServiceOrderCommentHandler,
  updateServiceOrderStatusHandler,
} from "./routes/services";
import {
  getCoupons,
  getCoupon,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
} from "./routes/coupons";
import { adminLogin, adminLogout, verifyAdminToken } from "./routes/admin-auth";
import {
  signupHandler,
  loginHandler,
  verifyHandler,
  logoutHandler,
} from "./routes/user-auth";
import {
  getSocialMediaLinksHandler,
  createSocialMediaLinkHandler,
  updateSocialMediaLinkHandler,
  deleteSocialMediaLinkHandler,
  reorderSocialMediaLinksHandler,
  getAvailablePlatformsHandler,
} from "./routes/social-media";
import {
  robotsHandler,
  sitemapHandler,
  sitemapIndexHandler,
  schemaHandler,
  seoStatusHandler,
} from "./routes/seo";
import {
  getUserWalletHandler,
  getAllWalletsHandler,
  addFundsHandler,
  getTransactionsHandler,
  getAllTransactionsHandler,
  freezeWalletHandler,
  unfreezeWalletHandler,
  deductFromWalletHandler,
  getWalletReportHandler,
} from "./routes/wallets";

export function createServer() {
  console.log("[createServer] Initializing Express app");
  const app = express();
  console.log("[createServer] Express app created");

  // Middleware
  console.log("[createServer] Setting up middleware");
  app.use(cors());

  // Cache-busting middleware to clear all caches
  app.use((req, res, next) => {
    // Prevent browser caching
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      "Clear-Site-Data": '"cache", "cookies", "storage"',
    });
    next();
  });

  app.use(express.json({ limit: "5gb" }));
  app.use(express.urlencoded({ extended: true, limit: "5gb" }));
  console.log("[createServer] Middleware setup complete");

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Health check endpoint for monitoring
  app.get("/health", (_req, res) => {
    console.log("[health] /health endpoint called");
    res.status(200).json({ status: "ok" });
  });

  // Deep health check with dependencies
  app.get("/api/health", async (_req, res) => {
    try {
      const airtableConfigured = !!process.env.AIRTABLE_API_TOKEN;
      const health = {
        status: "ok",
        timestamp: new Date().toISOString(),
        server: "running",
        airtableConfigured,
        environment: {
          NODE_ENV: process.env.NODE_ENV || "development",
          PORT: process.env.PORT || 8080,
        },
      };
      res.json(health);
    } catch (error) {
      console.error("[/api/health] Error:", error);
      res.status(500).json({
        status: "error",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // SEO routes
  app.get("/robots.txt", robotsHandler);
  app.get("/sitemap.xml", sitemapHandler);
  app.get("/sitemap_index.xml", sitemapIndexHandler);
  app.get("/api/schema.json", schemaHandler);
  app.get("/api/seo/status", seoStatusHandler);

  app.get("/api/demo", handleDemo);

  // Debug endpoint to inspect Airtable field names and values
  app.get("/api/debug/companies-airtable", async (req, res) => {
    try {
      const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
      const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
      const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

      if (!AIRTABLE_API_TOKEN) {
        return res
          .status(500)
          .json({ error: "AIRTABLE_API_TOKEN not configured" });
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=5`,
        {
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        return res
          .status(response.status)
          .json({ error, status: response.status });
      }

      const data = await response.json();

      // Return raw records for debugging
      const debugData = data.records.map((record: any) => ({
        id: record.id,
        fieldNames: Object.keys(record.fields),
        fields: record.fields,
      }));

      res.json({
        totalRecords: data.records.length,
        records: debugData,
        message: "Field names and values from Airtable",
      });
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Company routes
  app.get("/api/companies", getCompanies);
  app.get("/api/companies/:id", getCompany);
  app.post("/api/companies", createCompany);
  app.patch("/api/companies/:id", updateCompany);
  app.delete("/api/companies/:id", deleteCompany);
  app.patch("/api/companies/:id/status", updateCompanyStatus);
  app.post("/api/companies/:id/renew", renewCompany);
  app.post("/api/companies/:id/refund-request", requestCompanyRefund);
  app.post("/api/companies/:id/refund-approve", approveCompanyRefund);
  app.post("/api/companies/:id/mark-sold", markCompanyAsSold);

  // Admin Auth routes
  app.post("/api/admin/login", adminLogin);
  app.post("/api/admin/logout", adminLogout);
  app.get("/api/admin/verify", verifyAdminToken);

  // User Auth routes
  app.post("/api/signup", signupHandler);
  app.post("/api/login", loginHandler);
  app.post("/api/logout", logoutHandler);
  app.get("/api/verify", verifyHandler);

  // Legacy Airtable routes
  app.get("/api/countries", getCountries);
  app.get("/api/years", getYears);

  // Support routes
  app.post("/api/support/submit", handleSupportSubmit);

  // Orders routes - Specific routes before parameterized ones
  app.get("/api/orders", getOrders);
  app.post("/api/orders", createOrder);
  app.delete("/api/orders/clear", clearAllOrders);

  app.get("/api/orders/:orderId", getOrderById);
  app.patch("/api/orders/:orderId", updateOrder);
  app.delete("/api/orders/:orderId", deleteOrder);
  app.patch("/api/orders/:orderId/status", updateOrderStatus);
  app.post("/api/orders/:orderId/refund-request", requestRefund);
  app.post("/api/orders/:orderId/refund-approve", approveRefund);
  app.post("/api/orders/:orderId/refund-reject", rejectRefund);
  app.post("/api/orders/:orderId/documents", uploadOrderDocument);
  app.delete("/api/orders/:orderId/documents/:documentId", deleteOrderDocument);

  // Notification routes
  app.post("/api/notifications/email", sendEmailNotification);
  app.get("/api/notifications", getNotifications);

  // Email preview routes
  app.get("/api/email-preview", getEmailPreview);

  // AI Chat routes
  app.post("/api/chat", handleChat);
  app.post("/api/chat-sessions", handleSaveSession);

  // Test endpoint for transfer form Airtable sync
  app.post("/api/test-transfer-form", async (req, res) => {
    try {
      const testForm = {
        orderId: `test-order-${Date.now()}`,
        companyId: "test-comp-001",
        companyName: "Test Company Ltd",
        companyNumber: "12345678",
        country: "United Kingdom",
        incorporationDate: "2020-01-15",
        incorporationYear: 2020,
        totalShares: 1000,
        totalShareCapital: 10000,
        shareholders: [
          {
            id: "sh-1",
            name: "Test Shareholder",
            email: "test@example.com",
            nationality: "British",
            address: "123 Test St",
            city: "London",
            state: "England",
            postalCode: "SW1A 1AA",
            country: "United Kingdom",
            numberOfShares: 1000,
            levelOfControl: "More than 75%",
          },
        ],
        numberOfShareholders: 1,
        pscList: [],
        numberOfPSCs: 0,
        changeCompanyName: false,
        changeCompanyActivities: false,
        attachments: [],
      };

      // Call the createTransferForm handler with the test data
      const mockRes = {
        status: (code: number) => ({
          json: (data: any) => {
            console.log("[TEST] Response status:", code);
            console.log("[TEST] Response data:", JSON.stringify(data, null, 2));
            res.status(code).json(data);
          },
        }),
        json: (data: any) => res.json(data),
      } as any;

      const mockReq = {
        body: testForm,
        params: {},
        query: {},
      } as any;

      console.log("[TEST] Submitting test form:", testForm.companyName);
      await createTransferForm(mockReq, mockRes);
    } catch (error) {
      console.error("[TEST] Error:", error);
      res
        .status(500)
        .json({ error: "Test form submission failed", details: String(error) });
    }
  });

  // Transfer Form routes - Specific routes before parameterized ones
  app.get("/api/transfer-forms/analytics/summary", getFormAnalytics);
  app.get("/api/transfer-forms/debug/airtable-connection", async (req, res) => {
    try {
      const { fetchFormsFromAirtable } = await import("./utils/airtable-sync");
      console.log("[DEBUG] Testing Airtable connection...");
      const forms = await fetchFormsFromAirtable();
      console.log("[DEBUG] Fetched forms from Airtable:", forms);
      res.json({
        success: true,
        count: forms.length,
        forms: forms,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[DEBUG] Error:", error);
      res.status(500).json({
        success: false,
        error: String(error),
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.get("/api/transfer-forms", getTransferForms);
  app.post("/api/transfer-forms", createTransferForm);

  app.get("/api/transfer-forms/:id", getTransferForm);
  app.patch("/api/transfer-forms/:id", updateTransferForm);
  app.delete("/api/transfer-forms/:id", deleteTransferForm);
  app.patch("/api/transfer-forms/:id/status", updateFormStatus);
  app.post("/api/transfer-forms/:id/directors", addDirector);
  app.delete("/api/transfer-forms/:id/directors/:directorId", removeDirector);
  app.post("/api/transfer-forms/:id/shareholders", addShareholder);
  app.post("/api/transfer-forms/:id/comments", addComment);
  app.post("/api/transfer-forms/:id/attachments", uploadAttachment);
  app.delete(
    "/api/transfer-forms/:id/attachments/:attachmentId",
    deleteAttachment,
  );
  // Handle both GET and POST for PDF generation
  // GET: looks up form from server storage
  // POST: uses form data provided in request body (for multi-instance deployments)
  app.get("/api/transfer-forms/:id/pdf", generatePDF);
  app.post("/api/transfer-forms/:id/pdf", generatePDF);

  // Invoice routes - Specific routes before parameterized ones
  app.get("/api/invoices/analytics/summary", getInvoiceAnalytics);
  app.get("/api/invoices/export/csv", exportCSV);
  app.patch("/api/invoices/bulk/status", bulkUpdateStatus);
  app.post("/api/invoices/bulk/send-emails", bulkSendEmails);

  app.get("/api/invoices", getInvoices);
  app.post("/api/invoices", createInvoice);

  app.get("/api/invoices/:id", getInvoice);
  app.patch("/api/invoices/:id", updateInvoice);
  app.delete("/api/invoices/:id", deleteInvoice);
  app.patch("/api/invoices/:id/status", updateInvoiceStatus);
  app.post("/api/invoices/:id/send-email", sendInvoiceEmail);
  app.get("/api/invoices/:id/pdf", generateInvoicePDF);
  app.post("/api/invoices/:id/attachments", uploadInvoiceAttachment);
  app.delete(
    "/api/invoices/:id/attachments/:attachmentId",
    deleteInvoiceAttachment,
  );

  // Services routes - Specific routes before parameterized ones
  app.get("/api/services", getServices);
  app.post("/api/services", createServiceHandler);

  app.get("/api/services/:id", getService);
  app.patch("/api/services/:id", updateServiceHandler);
  app.delete("/api/services/:id", deleteServiceHandler);

  // Service Orders routes
  app.get("/api/service-orders", getServiceOrdersHandler);
  app.post("/api/service-orders", createServiceOrderHandler);

  app.get("/api/service-orders/:id", getServiceOrderHandler);
  app.patch("/api/service-orders/:id", updateServiceOrderHandler);

  // Service Order Comments & Status Management
  app.get("/api/service-orders/:id/comments", getServiceOrderCommentsHandler);
  app.post(
    "/api/service-orders/:id/comments",
    createServiceOrderCommentHandler,
  );
  app.patch("/api/service-orders/:id/status", updateServiceOrderStatusHandler);

  // Coupon routes
  app.get("/api/coupons", getCoupons);
  app.get("/api/coupons/:id", getCoupon);
  app.post("/api/coupons/validate", validateCoupon);
  app.post("/api/coupons", createCoupon);
  app.patch("/api/coupons/:id", updateCoupon);
  app.delete("/api/coupons/:id", deleteCoupon);
  app.post("/api/coupons/apply", applyCoupon);

  // Social Media Links routes
  app.get(
    "/api/social-media/platforms/available",
    getAvailablePlatformsHandler,
  );
  app.get("/api/social-media", getSocialMediaLinksHandler);
  app.post("/api/social-media", createSocialMediaLinkHandler);
  app.patch("/api/social-media/:id", updateSocialMediaLinkHandler);
  app.delete("/api/social-media/:id", deleteSocialMediaLinkHandler);
  app.post("/api/social-media/reorder", reorderSocialMediaLinksHandler);

  // Wallet routes - IMPORTANT: Specific routes MUST come before parameterized routes
  app.get("/api/wallets/report", getWalletReportHandler); // Specific: admin report
  app.get("/api/wallets/transactions", getAllTransactionsHandler); // Specific: all transactions
  app.get("/api/wallets", getAllWalletsHandler); // General list route
  app.get("/api/wallets/:userId", getUserWalletHandler); // Parameterized routes after
  app.post("/api/wallets/:userId/add-funds", addFundsHandler);
  app.get("/api/wallets/:userId/transactions", getTransactionsHandler); // User-specific transactions
  app.patch("/api/wallets/:userId/freeze", freezeWalletHandler);
  app.patch("/api/wallets/:userId/unfreeze", unfreezeWalletHandler);
  app.post("/api/wallets/:userId/deduct", deductFromWalletHandler);

  console.log("[createServer] ✅ All routes registered successfully");

  // Serve SPA static files and handle fallback to index.html
  const spaPath = findSPAPath();
  if (spaPath) {
    console.log("[createServer] Serving SPA from:", spaPath);

    // Serve static files from SPA directory
    app.use(express.static(spaPath));

    // SPA fallback: serve index.html for all non-API requests
    app.use((req, res) => {
      const indexPath = path.join(spaPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error("[createServer] Error serving index.html:", err);
          res.status(404).json({ error: "index.html not found" });
        }
      });
    });
  } else {
    console.warn(
      "[createServer] ⚠️ SPA path not found, root route will not be available",
    );
  }

  return app;
}

// Helper: Find SPA directory with fallbacks
function findSPAPath(): string | null {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // Try multiple paths
  const candidates = [
    path.resolve(__dirname, "../dist/spa"), // Dev relative
    "/app/code/dist/spa", // Docker
    "/var/www/shareket.com/dist/spa", // Hostinger
    path.resolve(process.cwd(), "dist/spa"), // CWD based
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        console.log("[findSPAPath] Found SPA at:", candidate);
        return candidate;
      }
    } catch (e) {
      // Continue to next candidate
    }
  }

  console.warn("[findSPAPath] No SPA directory found in any candidate path");
  return null;
}
