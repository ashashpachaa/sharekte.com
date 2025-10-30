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
} from "./routes/orders";
import { sendEmailNotification, getNotifications } from "./routes/notifications";
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

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  // Legacy Airtable routes
  app.get("/api/countries", getCountries);
  app.get("/api/years", getYears);

  // Support routes
  app.post("/api/support/submit", handleSupportSubmit);

  // Orders routes
  app.get("/api/orders", getOrders);
  app.get("/api/orders/:orderId", getOrderById);
  app.post("/api/orders", createOrder);
  app.patch("/api/orders/:orderId", updateOrder);
  app.patch("/api/orders/:orderId/status", updateOrderStatus);
  app.post("/api/orders/:orderId/refund-request", requestRefund);
  app.post("/api/orders/:orderId/refund-approve", approveRefund);
  app.post("/api/orders/:orderId/refund-reject", rejectRefund);
  app.delete("/api/orders/:orderId", deleteOrder);

  // Notification routes
  app.post("/api/notifications/email", sendEmailNotification);
  app.get("/api/notifications", getNotifications);

  return app;
}
