import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDB, closeDB } from "../lib/server/db";
import { user, account, owners, session, audit } from "../lib/server/schema";
import { z } from "zod";
async function main() {
  const email = z.email().parse(process.env.OWNER_EMAIL).toLowerCase();
  const password = z
    .string()
    .min(14)
    .max(128)
    .parse(process.env.OWNER_PASSWORD);
  const db = getDB();
  const reset = process.argv.includes("--reset");
  const hashed = await hashPassword(password);
  await db.transaction(async (tx) => {
    const found = await tx.select().from(user).where(eq(user.email, email));
    if (found.length && !reset)
      throw new Error("Owner exists. Use owner:reset for offline recovery.");
    if (!found.length) {
      if ((await tx.select().from(owners)).length)
        throw new Error(
          "An owner already exists; multiple-owner provisioning is disabled.",
        );
      const id = randomUUID();
      await tx
        .insert(user)
        .values({ id, name: "Owner", email, emailVerified: true });
      await tx.insert(owners).values({ userId: id });
      await tx
        .insert(account)
        .values({
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          userId: id,
          password: hashed,
        });
    } else {
      const id = found[0].id;
      const [owner] = await tx
        .select()
        .from(owners)
        .where(eq(owners.userId, id));
      if (!owner) throw new Error("Account is not an owner");
      await tx
        .update(account)
        .set({ password: hashed, updatedAt: new Date() })
        .where(eq(account.userId, id));
      await tx.delete(session).where(eq(session.userId, id));
    }
    await tx
      .insert(audit)
      .values({
        id: randomUUID(),
        actor: email,
        action: reset
          ? "security.offline-recovery"
          : "security.owner-provisioned",
      });
  });
  console.log(
    reset
      ? "Owner password reset; all sessions revoked."
      : "Owner provisioned. Public sign-up remains disabled.",
  );
  await closeDB();
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
