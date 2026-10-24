import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDB, closeDB } from "../lib/server/db";
import { defaultSiteConfig } from "../lib/config";
import { site } from "../lib/server/schema";
async function main() {
  const db = getDB();
  await migrate(db, { migrationsFolder: "db/migrations" });
  await db
    .insert(site)
    .values({ id: 1, draft: defaultSiteConfig, published: defaultSiteConfig })
    .onConflictDoNothing();
  await db.execute(sql`select 1`);
  console.log(
    "Migrations applied; approved content seeded without overwriting existing data.",
  );
  await closeDB();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
