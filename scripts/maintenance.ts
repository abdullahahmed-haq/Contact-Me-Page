import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
import { lt } from "drizzle-orm";
import { getDB, closeDB } from "../lib/server/db";
import {
  session,
  verification,
  limits,
  rateLimit,
  events,
} from "../lib/server/schema";
async function main() {
  const days = Number(process.env.ANALYTICS_RETENTION_DAYS || 365);
  if (!Number.isInteger(days) || days < 1 || days > 3650)
    throw new Error("ANALYTICS_RETENTION_DAYS must be 1–3650");
  const db = getDB(),
    now = new Date();
  await db.transaction(async (tx) => {
    await tx.delete(session).where(lt(session.expiresAt, now));
    await tx.delete(verification).where(lt(verification.expiresAt, now));
    await tx.delete(limits).where(lt(limits.until, now));
    await tx
      .delete(rateLimit)
      .where(lt(rateLimit.lastRequest, Date.now() - 864e5));
    await tx
      .delete(events)
      .where(
        lt(
          events.day,
          new Date(Date.now() - days * 864e5).toISOString().slice(0, 10),
        ),
      );
  });
  await closeDB();
  console.log(
    "Expired security records and analytics outside the configured retention period removed.",
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
