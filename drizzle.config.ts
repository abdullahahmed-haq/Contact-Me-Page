import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
export default defineConfig({
  schema: "./lib/server/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL || "" },
});
