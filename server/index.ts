import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getCompanies, getCountries, getYears } from "./routes/airtable";
import { updateCompanyStatus } from "./routes/update-company";

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

  return app;
}
