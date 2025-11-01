import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "./index";
import express from "express";
import fs from "fs";

// Set up global error handlers FIRST
process.on("uncaughtException", (error) => {
  console.error("[FATAL] Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled rejection:", reason);
  process.exit(1);
});

// Ensure environment is production
process.env.NODE_ENV = process.env.NODE_ENV || "production";

console.log("[startup] STARTING SERVER");

// Get port
const port = process.env.PORT || 8080;
console.log("[startup] Port:", port);

// Create server
let app;
try {
  console.log("[startup] Creating Express app...");
  app = createServer();
  console.log("[startup] Express app created successfully");
} catch (error) {
  console.error("[startup] FATAL: Failed to create server:", error);
  process.exit(1);
}

// In production, serve the built SPA files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, "../dist/spa");

console.log("[startup] SPA path:", distPath);
console.log("[startup] SPA exists:", fs.existsSync(distPath));

// Serve static files
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log("[startup] ✓ SPA static files configured");
}

// Handle React Router - serve index.html for all non-API routes
app.get("/*", (req, res) => {
  // Skip API routes and other non-SPA routes
  if (req.path.startsWith("/api/") || req.path.includes(".")) {
    return res.status(404).json({ error: "Not found" });
  }

  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: "SPA not found" });
  }
});

console.log("[startup] About to listen on port", port);

// Start server
let server;
try {
  server = app.listen(port, "0.0.0.0", () => {
    console.log(`[startup] ✅ SERVER LISTENING ON PORT ${port}`);
    console.log(`[startup] Health check: http://localhost:${port}/health`);
    console.log(`[startup] API: http://localhost:${port}/api`);
  });

  server.on("error", (error) => {
    console.error("[startup] Server error:", error);
    process.exit(1);
  });
} catch (error) {
  console.error("[startup] FATAL: Failed to start server:", error);
  process.exit(1);
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[shutdown] Received SIGTERM");
  server?.close(() => {
    console.log("[shutdown] Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("[shutdown] Received SIGINT");
  server?.close(() => {
    console.log("[shutdown] Server closed");
    process.exit(0);
  });
});
