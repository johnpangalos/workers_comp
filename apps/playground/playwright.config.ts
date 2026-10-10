import { defineConfig, devices } from "@playwright/test";

// Pixel tests: render playground pages in Chromium and compare them with Figma exports
// (see figma/ and tests/figma.ts). 1x device scale, because the exports are 1x.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:5173",
    deviceScaleFactor: 1,
  },
  webServer: {
    command: "pnpm dev --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
