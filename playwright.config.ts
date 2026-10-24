import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    browserName: "chromium",
    actionTimeout: 15000,
    navigationTimeout: 60000,
    trace: "off",
    screenshot: "only-on-failure",
  },
  expect: { timeout: 15000 },
  reporter: [
    ["list"],
    ["json", { outputFile: "artifacts/admin/playwright-results.json" }],
  ],
  timeout: 90000,
});
