import { defineConfig, devices } from "@playwright/test";

// Renders playground pages in Chromium and compares the values they are drawn with against
// Figma's (see figma/ and tests/figma.ts).
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
