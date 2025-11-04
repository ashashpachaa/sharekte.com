import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "./index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

async function startDevServer() {
  console.log("🚀 Starting development server...");

  // Start Express server
  const app = createServer();
  const server = app.listen(PORT, "::", () => {
    console.log(`✓ Express server running on http://localhost:${PORT}`);
    console.log(`✓ API available at http://localhost:${PORT}/api`);
  });

  // Start Vite dev server in a subprocess
  console.log("📦 Starting Vite dev server...");
  const vite = spawn("npm", ["run", "dev:vite"], {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    shell: true,
  });

  // Handle graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n📋 ${signal} received, shutting down...`);
    vite.kill(signal);
    server.close(() => {
      console.log("✓ Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  vite.on("exit", (code) => {
    console.log(`Vite process exited with code ${code}`);
    process.exit(code || 0);
  });
}

startDevServer().catch((error) => {
  console.error("Failed to start dev server:", error);
  process.exit(1);
});
