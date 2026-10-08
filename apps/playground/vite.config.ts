import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Point at the ui package's source, not its dist, so edits show up instantly
    // without rebuilding the package.
    alias: {
      "@workers-comp/ui": fileURLToPath(new URL("../../packages/ui/src/index.ts", import.meta.url)),
    },
  },
  // axe-core is a ~660 kB chunk, loaded lazily for the accessibility panel.
  build: { chunkSizeWarningLimit: 700 },
});
