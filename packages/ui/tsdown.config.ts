import tailwindcss from "@tailwindcss/postcss";
import { defineConfig } from "tsdown";

// Library build: dist/index.js, its types, and one dist/styles.css, the compiled
// src/tailwind.module.css. dependencies and peerDependencies stay external automatically.
export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  platform: "neutral",
  css: {
    transformer: "postcss",
    postcss: { plugins: [tailwindcss()] },
    modules: { generateScopedName: "wc-[local]-[hash:base64:5]" },
    fileName: "styles.css",
  },
});
