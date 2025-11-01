import "dotenv/config";
import express from "express";
import cors from "cors";
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
} from "./routes/orders";
import {
  sendEmailNotification,
  getNotifications,
} from "./routes/notifications";
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

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "5gb" }));
  app.use(express.urlencoded({ extended: true, limit: "5gb" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

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

  // Legacy Airtable routes
  app.get("/api/countries", getCountries);
  app.get("/api/years", getYears);

  // Support routes
  app.post("/api/support/submit", handleSupportSubmit);

  // Orders routes - Specific routes before parameterized ones
  app.get("/api/orders", getOrders);
  app.post("/api/orders", createOrder);

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

  app.get("/api/transfer-forms", getTransferForms);
  app.post("/api/transfer-forms", createTransferForm);

  // Debug endpoint - Test Airtable connection
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
  app.get("/api/transfer-forms/:id/pdf", generatePDF);

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

  return app;
}
