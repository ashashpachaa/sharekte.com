import { defineConfig } from "vite";
import path from "path";

// Server build configuration
export default defineConfig({
  build: {
    lib: {
      entry: "server/node-build.ts",
      name: "server",
      fileName: "node-build",
      formats: ["es"],
    },
    outDir: "dist/server",
    target: "node22",
    ssr: true,
    rollupOptions: {
      external: (id) => {
        // Mark as external if it's:
        // 1. A node built-in
        // 2. In node_modules
        // 3. A relative path starting with ../client or client/
        const nodeBuiltins = ['fs', 'path', 'url', 'http', 'https', 'os', 'crypto', 'stream', 'util', 'events', 'buffer', 'querystring', 'child_process'];
        if (nodeBuiltins.includes(id)) return true;
        if (id.includes('/node_modules/')) return true;
        if (id.includes('../client') || id.startsWith('client/')) return true;
        if (id.startsWith('./client') || id.startsWith('@/')) return true;
        return false;
      },
      output: {
        format: "es",
        entryFileNames: "[name].mjs",
      },
    },
    minify: false, // Keep readable for debugging
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
