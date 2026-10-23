import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://localhost:3000", browserName: "chromium" },
  reporter: "list",
  timeout: 30000,
});
