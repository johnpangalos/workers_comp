import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { tailwindModules } from "./build/tailwind-modules.ts";

export default defineConfig({
  plugins: [tailwindModules(), react()],
  css: { modules: { generateScopedName: "wc-[local]-[hash:base64:5]" } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: { include: /.+/, modules: { classNameStrategy: "scoped" } },
  },
});
