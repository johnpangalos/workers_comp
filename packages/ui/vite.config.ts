import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };

const external = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];

// Library build: dist/index.js plus one dist/styles.css, the compiled src/tailwind.module.css.
// Types come from tsc (see the build script).
export default defineConfig({
  plugins: [tailwindcss()],
  css: { modules: { generateScopedName: "wc-[local]-[hash:base64:5]" } },
  build: {
    lib: { entry: "src/index.ts", formats: ["es"], fileName: "index", cssFileName: "styles" },
    rolldownOptions: { external: (id) => external.some((dep) => id === dep || id.startsWith(`${dep}/`)) },
    minify: false,
  },
});
