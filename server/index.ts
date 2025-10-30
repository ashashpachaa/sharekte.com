import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getCompanies, getCountries, getYears } from "./routes/airtable";
import { updateCompanyStatus } from "./routes/update-company";
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

  // Airtable routes
  app.get("/api/companies", getCompanies);
  app.get("/api/countries", getCountries);
  app.get("/api/years", getYears);
  app.patch("/api/companies/:recordId/status", updateCompanyStatus);

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

  return app;
}
