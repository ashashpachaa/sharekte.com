import { defineConfig, Plugin } from "vite";
import path from "path";

// Plugin to externalize imports from client code
const externalizeClientCode: Plugin = {
  name: 'externalize-client-code',
  enforce: 'pre',
  resolveId(id) {
    // Mark any import starting with @ or containing client/ as external
    if (id.includes('@/lib') || id.includes('@/') || id.includes('client/lib')) {
      return { id, external: true };
    }
    return null;
  },
};

// Server build configuration
export default defineConfig({
  plugins: [externalizeClientCode],
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
      external: [
        // Node.js built-ins
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",
        // External dependencies that should not be bundled
        "express",
        "cors",
        // Mark any import with @ symbol as external (all aliases)
        /^@\//,
      ],
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
    // No aliases for server - prevents issues with client-side imports
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
