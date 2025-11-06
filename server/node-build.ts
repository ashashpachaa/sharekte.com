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
// Try multiple possible paths for SPA directory (works in all environments)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const possiblePaths = [
  // Path 1: Relative to server directory (dist/server/../spa = dist/spa)
  path.resolve(__dirname, "../spa"),
  // Path 2: Relative to cwd (for Docker and production deployments)
  path.resolve(process.cwd(), "dist/spa"),
  // Path 3: Absolute path for Hostinger production
  path.resolve("/var/www/sharekte.com/dist/spa"),
];

let spaDir = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    spaDir = p;
    console.log(`[startup] ✓ Found SPA at: ${p}`);
    break;
  }
}

console.log("[startup] NODE_ENV:", process.env.NODE_ENV);
console.log("[startup] CWD:", process.cwd());
console.log("[startup] Tried SPA paths:", possiblePaths);
console.log("[startup] SPA directory found:", spaDir ? "YES" : "NO");

// Serve static assets
if (spaDir && fs.existsSync(spaDir)) {
  const spaContents = fs.readdirSync(spaDir);
  console.log("[startup] SPA contents:", spaContents);

  app.use(
    express.static(spaDir, {
      maxAge: "1d",
      etag: false,
    }),
  );
  console.log("[startup] ✓ SPA static files configured");
} else {
  console.warn("[startup] ⚠️  SPA directory not found!");
  console.warn("[startup] Tried paths:", possiblePaths);
}

// Handle React Router - serve index.html for all non-API routes
app.get(/.*/, (req, res) => {
  // Skip API routes and other non-SPA routes
  if (req.path.startsWith("/api/") || req.path.includes(".")) {
    return res.status(404).json({ error: "Not found" });
  }

  if (!spaDir) {
    console.error("[get/*] SPA directory not found!");
    return res.status(503).json({ error: "SPA directory not configured" });
  }

  const indexPath = path.join(spaDir, "index.html");
  console.log(`[get/${req.path}] Serving SPA from: ${indexPath}`);

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error("[get/*] index.html not found at:", indexPath);
    console.error("[get/*] SPA directory contents:", fs.readdirSync(spaDir));
    res.status(404).json({ error: "SPA index.html not found at " + indexPath });
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
