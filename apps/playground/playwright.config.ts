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
  projects: [
    { name: "with preflight" },
    // The Figma specs, and the native-controls spec, with Tailwind's preflight taken out of the page
    // (tests/figma.ts, waitForInter), as an app without Tailwind draws the components. Only these
    // measure components: the overrides and motion specs don't measure against Figma, and motion
    // checks a transition that preflight doesn't touch.
    {
      name: "without preflight",
      testMatch: ["*.figma.spec.ts", "*.native-controls.spec.ts"],
      testIgnore: "figma-lint.spec.ts",
    },
  ],
  webServer: {
    command: "pnpm dev --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
