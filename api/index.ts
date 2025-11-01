import path from "path";
import { fileURLToPath } from "url";
import { IncomingMessage, ServerResponse } from "http";
import express from "express";
import serverless from "serverless-http";
import fs from "fs";
import { createServer } from "../server/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create the Express app using the server factory
const app = createServer();

// In Vercel, serve static SPA files
const distPath = path.join(__dirname, "../dist/spa");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Fallback to index.html for React Router (SPA)
app.get("*", (req, res) => {
  // Skip API routes
  if (!req.path.startsWith("/api/")) {
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  res.status(404).json({ error: "Not found" });
});

const handler = serverless(app);

export default async (req: IncomingMessage, res: ServerResponse) => {
  return handler(req, res);
};
