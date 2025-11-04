import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), ...(command === "serve" ? [expressPlugin()] : [])],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(server) {
      try {
        // Import server module dynamically only during dev serve
        // Use require-style import to avoid vite's module resolution for server code
        const serverModule = await import("./server/index.js").catch(async () => {
          // Fallback: try with .ts
          return await import("./server/index.ts");
        });
        const app = serverModule.createServer();
        server.middlewares.use(app);
      } catch (e) {
        // Silently ignore server loading errors in dev mode
        // The server will be available at runtime
        console.info("Express server deferred to runtime mode");
      }
    },
  };
}
