import { defineConfig } from "tsdown";

// dependencies and peerDependencies from package.json stay external automatically.
export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  platform: "neutral",
});
