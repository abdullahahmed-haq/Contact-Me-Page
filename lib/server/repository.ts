import { eq, desc, gte, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDB } from "./db";
import { site, revisions, audit, events, limits, assets } from "./schema";
import { siteConfigSchema, type SiteConfig } from "../config";
import { HttpError } from "./errors";
export async function getContent() {
  const [row] = await getDB().select().from(site).where(eq(site.id, 1));
  if (!row) throw new Error("Run npm run db:migrate before starting the CMS");
  return row;
}
export async function getPublished() {
  return siteConfigSchema.parse((await getContent()).published);
}
export async function logEvent(action: string, actor: string, detail = "") {
  await getDB()
    .insert(audit)
    .values({ id: randomUUID(), action, actor, detail: detail.slice(0, 500) });
}
export async function mutateContent(
  action: "save" | "publish" | "discard" | "restore",
  version: number,
  actor: string,
  input?: unknown,
  revision?: string,
) {
  const db = getDB();
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(site)
      .where(eq(site.id, 1))
      .for("update");
    if (!row || row.version !== version)
      throw new HttpError(
        409,
        "Another session changed this content. Reload before saving.",
      );
    let draft = row.draft,
      published = row.published,
      publishedAt = row.publishedAt;
    if (action === "save") draft = siteConfigSchema.parse(input);
    if (action === "discard") draft = published;
    if (action === "restore") {
      const [r] = await tx
        .select()
        .from(revisions)
        .where(eq(revisions.id, revision || ""));
      if (!r) throw new HttpError(404, "Revision not found");
      draft = siteConfigSchema.parse(r.content);
    }
    // Serialize reference validation with asset deletion using the content-row lock.
    const media = [
      draft.profile.avatar,
      draft.featured.image,
      draft.seo.image,
      draft.seo.sharingImage,
      draft.seo.favicon,
    ];
    const objectPrefix =
      process.env.S3_PUBLIC_URL?.replace(/\/$/, "") + "/connect/";
    const blobStoreId = (
      process.env.BLOB_STORE_ID?.replace(/^store_/, "") ||
      process.env.BLOB_READ_WRITE_TOKEN?.match(
        /^vercel_blob_rw_([^_]+)_/,
      )?.[1] ||
      ""
    ).toLowerCase();
    const blobPrefix = `https://${blobStoreId}.public.blob.vercel-storage.com/connect/`;
    const managed = media.filter(
      (url) =>
        url.startsWith("/media/") ||
        (blobStoreId && url.startsWith(blobPrefix)) ||
        (process.env.S3_PUBLIC_URL && url.startsWith(objectPrefix)),
    );
    if (managed.length) {
      const library = await tx.select({ url: assets.url }).from(assets);
      const existing = new Set(library.map((a) => a.url));
      if (managed.some((url) => !existing.has(url)))
        throw new HttpError(
          422,
          "A selected image no longer exists. Refresh the asset library and choose an available image.",
        );
    }
    if (action === "publish") {
      published = siteConfigSchema.parse(draft);
      publishedAt = new Date();
      // Preserve the previous published snapshot, including the original seed, for rollback.
      await tx
        .insert(revisions)
        .values({ id: randomUUID(), content: row.published, actor });
    }
    const [updated] = await tx
      .update(site)
      .set({
        draft,
        published,
        publishedAt,
        version: version + 1,
        updatedAt: new Date(),
      })
      .where(eq(site.id, 1))
      .returning();
    await tx.insert(audit).values({
      id: randomUUID(),
      action: `content.${action}`,
      actor,
      detail: revision || "",
    });
    return updated;
  });
}
export async function recentActivity() {
  return getDB().select().from(audit).orderBy(desc(audit.createdAt)).limit(100);
}
export async function recentRevisions() {
  return getDB()
    .select({
      id: revisions.id,
      createdAt: revisions.createdAt,
      actor: revisions.actor,
    })
    .from(revisions)
    .orderBy(desc(revisions.createdAt))
    .limit(50);
}
export async function analytics(days = 30) {
  const since = new Date(Date.now() - (days - 1) * 864e5)
    .toISOString()
    .slice(0, 10);
  return getDB()
    .select()
    .from(events)
    .where(gte(events.day, since))
    .orderBy(events.day);
}
export async function recordEvent(event: string) {
  const day = new Date().toISOString().slice(0, 10);
  await getDB()
    .insert(events)
    .values({ id: `${day}:${event}`, day, event, count: 1 })
    .onConflictDoUpdate({
      target: events.id,
      set: { count: sql`${events.count}+1` },
    });
}
export async function rateLimit(key: string, max: number, seconds: number) {
  const now = new Date(),
    until = new Date(now.getTime() + seconds * 1000);
  const [row] = await getDB()
    .insert(limits)
    .values({ key, count: 1, until })
    .onConflictDoUpdate({
      target: limits.key,
      set: {
        count: sql`case when ${limits.until} < ${now} then 1 else ${limits.count}+1 end`,
        until: sql`case when ${limits.until} < ${now} then ${until} else ${limits.until} end`,
      },
    })
    .returning();
  if (row.count > max)
    throw new HttpError(429, "Too many requests. Please wait and try again.");
}
