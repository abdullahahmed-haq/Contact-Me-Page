import { PGlite } from "@electric-sql/pglite";
import { drizzle as embeddedDrizzle } from "drizzle-orm/pglite";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import path from "node:path";
import { mkdirSync } from "node:fs";
// Global singleton also survives Next development module reloads. PGlite is development only.
const state = globalThis as unknown as {
  connectDB?: ReturnType<typeof drizzle<typeof schema>>;
  connectPG?: PGlite;
  connectPool?: Pool;
};
export function getDB() {
  if (state.connectDB) return state.connectDB;
  if (process.env.DATABASE_URL) {
    state.connectPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    });
    state.connectDB = drizzle(state.connectPool, { schema });
  } else {
    if (process.env.NODE_ENV === "production")
      throw new Error("DATABASE_URL is required in production");
    mkdirSync(
      path.dirname(
        process.env.LOCAL_DATABASE_DIR ||
          path.join(process.cwd(), ".data/postgres"),
      ),
      { recursive: true },
    );
    state.connectPG = new PGlite(
      process.env.LOCAL_DATABASE_DIR ||
        path.join(process.cwd(), ".data/postgres"),
    );
    // Both drivers use PostgreSQL dialect; only the wire-level result type differs.
    state.connectDB = embeddedDrizzle(state.connectPG, {
      schema,
    }) as unknown as ReturnType<typeof drizzle<typeof schema>>;
  }
  return state.connectDB;
}
export async function closeDB() {
  await state.connectPG?.close();
  await state.connectPool?.end();
  delete state.connectDB;
  delete state.connectPG;
  delete state.connectPool;
}
