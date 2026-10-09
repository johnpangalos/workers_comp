import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { tailwindModules } from "../../packages/ui/build/tailwind-modules.ts";

export default defineConfig({
  plugins: [tailwindModules(), tailwindcss(), reactRouter()],
  resolve: {
    // Point at the ui package's source, not its dist, so edits show up instantly
    // without rebuilding the package.
    alias: {
      "@workers-comp/ui": fileURLToPath(new URL("../../packages/ui/src/index.ts", import.meta.url)),
    },
  },
});
