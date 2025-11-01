import path from "path";
import { createServer } from "./index";
import express from "express";
import fs from "fs";

const app = createServer();
const port = process.env.PORT || 8080;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Log startup information
console.log("[startup] Starting Fusion Starter server");
console.log(`[startup] Port: ${port}`);
console.log(`[startup] Node env: ${process.env.NODE_ENV || "development"}`);
console.log(
  `[startup] Airtable configured: ${!!process.env.AIRTABLE_API_TOKEN}`,
);
console.log(`[startup] SPA path: ${distPath}`);
console.log(`[startup] SPA exists: ${fs.existsSync(distPath)}`);

// Serve static files
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log("[startup] ✓ SPA static files configured");
} else {
  console.warn("[startup] ⚠ SPA directory not found at", distPath);
}

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res) => {
  // Skip API routes and other non-SPA routes
  if (
    req.path.startsWith("/api/") ||
    req.path === "/health" ||
    req.path.includes(".")
  ) {
    return res.status(404).json({ error: "Not found" });
  }

  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: "SPA not found" });
  }
});

const server = app.listen(port, () => {
  console.log(`[startup] ✅ Server successfully started`);
  console.log(`[startup] 🚀 Fusion Starter running on port ${port}`);
  console.log(`[startup] 📱 Frontend: http://localhost:${port}`);
  console.log(`[startup] 🔧 API: http://localhost:${port}/api`);
  console.log(`[startup] 💓 Health: http://localhost:${port}/health`);
});

// Error handling for server
server.on("error", (error: any) => {
  console.error("[startup] ❌ Server error:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[shutdown] 🛑 Received SIGTERM, shutting down gracefully");
  server.close(() => {
    console.log("[shutdown] ✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("[shutdown] 🛑 Received SIGINT, shutting down gracefully");
  server.close(() => {
    console.log("[shutdown] ✅ Server closed");
    process.exit(0);
  });
});

// Unhandled promise rejection
process.on("unhandledRejection", (reason: any) => {
  console.error("[error] Unhandled rejection:", reason);
});
