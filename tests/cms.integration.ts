import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID, randomBytes } from "node:crypto";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { getDB, closeDB } from "../lib/server/db";
import { getAuth, requireOwner, checkOrigin } from "../lib/server/auth";
import * as schema from "../lib/server/schema";
import { defaultSiteConfig, siteConfigSchema } from "../lib/config";
import {
  getContent,
  getPublished,
  mutateContent,
  recentRevisions,
  recordEvent,
  analytics,
  rateLimit,
} from "../lib/server/repository";
import { processImage, uploadAsset, deleteAsset } from "../lib/server/storage";
import {
  GET as adminGET,
  PUT as adminPUT,
} from "../app/api/admin/[...path]/route";
let temp: string, cookie: string;
const ownerId = randomUUID();
const password = randomBytes(24).toString("base64url");
const origin = "http://localhost:3000";
const headers = () =>
  new Headers({
    Origin: origin,
    Cookie: cookie || "",
    "Content-Type": "application/json",
  });
async function auth(p: string, body?: unknown, cookies = true) {
  return getAuth().handler(
    new Request(`${origin}/api/auth/${p}`, {
      method: body ? "POST" : "GET",
      headers: cookies
        ? headers()
        : { Origin: origin, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  );
}
before(async () => {
  temp = await mkdtemp(path.join(os.tmpdir(), "connect-integration-"));
  delete process.env.DATABASE_URL;
  process.env.LOCAL_DATABASE_DIR = path.join(temp, "pg");
  process.env.LOCAL_ASSET_DIR = path.join(temp, "media");
  process.env.BETTER_AUTH_URL = origin;
  process.env.BETTER_AUTH_SECRET = randomBytes(48).toString("base64url");
  const db = getDB();
  await migrate(db, { migrationsFolder: "db/migrations" });
  await db
    .insert(schema.site)
    .values({ id: 1, draft: defaultSiteConfig, published: defaultSiteConfig });
  await db.insert(schema.user).values({
    id: ownerId,
    name: "Test Owner",
    email: "owner@example.test",
    emailVerified: true,
  });
  await db.insert(schema.owners).values({ userId: ownerId });
  await db.insert(schema.account).values({
    id: randomUUID(),
    userId: ownerId,
    accountId: ownerId,
    providerId: "credential",
    password: await hashPassword(password),
  });
});
after(async () => {
  await closeDB();
  await rm(temp, { recursive: true, force: true });
});
test("unauthenticated routes reject reads and writes; origin check rejects CSRF", async () => {
  await assert.rejects(() => requireOwner(new Headers()));
  for (const f of [adminGET, adminPUT]) {
    const r = await f(
      new Request(origin + "/api/admin/content", {
        method: f === adminGET ? "GET" : "PUT",
      }),
      { params: Promise.resolve({ path: ["content"] }) },
    );
    assert.equal(r.status, 401);
  }
  assert.throws(() =>
    checkOrigin(
      new Request(origin, {
        method: "POST",
        headers: { Origin: "https://attacker.example" },
      }),
    ),
  );
  assert.throws(() => checkOrigin(new Request(origin, { method: "POST" })));
});
test("real Better Auth login rejects invalid credentials and public registration; sets HttpOnly session", async () => {
  let r = await auth(
    "sign-up/email",
    { email: "stranger@example.test", password, name: "Stranger" },
    false,
  );
  assert.ok(r.status >= 400);
  r = await auth(
    "sign-in/email",
    { email: "owner@example.test", password: "incorrect-password" },
    false,
  );
  assert.equal(r.status, 401);
  r = await auth(
    "sign-in/email",
    { email: "owner@example.test", password },
    false,
  );
  assert.equal(r.status, 200, await r.clone().text());
  const cookies = r.headers.getSetCookie();
  assert.ok(
    cookies.some((v) => /HttpOnly/i.test(v) && /SameSite=Lax/i.test(v)),
  );
  cookie = cookies.map((v) => v.split(";")[0]).join("; ");
  assert.equal((await requireOwner(headers())).user.id, ownerId);
  const [s] = await getDB().select().from(schema.session);
  assert.equal(s.ipAddress, null);
});
test("owner membership is checked independently on protected API", async () => {
  await getDB().delete(schema.owners).where(eq(schema.owners.userId, ownerId));
  await assert.rejects(
    () => requireOwner(headers()),
    (e) => (e as { status: number }).status === 403,
  );
  await getDB().insert(schema.owners).values({ userId: ownerId });
});
test("drafts stay private, stale saves fail, publishing is atomic, revisions restore as drafts", async () => {
  let row = await getContent();
  const draft = structuredClone(row.draft);
  draft.profile.name = { en: "Updated Owner", ar: "المالك المحدّث" };
  draft.contacts.reverse();
  draft.contacts.forEach((c, i) => (c.order = i));
  draft.contacts[0].enabled = false;
  draft.quickMessages[0].text = { en: "Custom greeting", ar: "تحية مخصصة" };
  draft.theme.radius = "32px";
  row = await mutateContent("save", row.version, "test", draft);
  assert.equal(
    (await getPublished()).profile.name.en,
    defaultSiteConfig.profile.name.en,
  );
  await assert.rejects(
    () => mutateContent("publish", row.version - 1, "test"),
    (e) => (e as { status: number }).status === 409,
  );
  row = await mutateContent("publish", row.version, "test");
  assert.equal((await getPublished()).profile.name.ar, "المالك المحدّث");
  assert.equal((await getPublished()).contacts[0].enabled, false);
  const revisions = await recentRevisions();
  assert.equal(revisions.length, 1);
  row = await mutateContent(
    "restore",
    row.version,
    "test",
    undefined,
    revisions[0].id,
  );
  assert.equal(row.draft.profile.name.en, defaultSiteConfig.profile.name.en);
  assert.equal((await getPublished()).profile.name.en, "Updated Owner");
  row = await mutateContent("publish", row.version, "test");
  assert.equal(
    (await getPublished()).profile.name.en,
    defaultSiteConfig.profile.name.en,
  );
});
test("server APIs reject unsafe URLs, CSS injection, duplicates and invalid translations", async () => {
  for (const mutate of [
    (c: typeof defaultSiteConfig) => (c.featured.url = "javascript:alert(1)"),
    (c: typeof defaultSiteConfig) => (c.theme.radius = "1px;background:red"),
    (c: typeof defaultSiteConfig) => c.contacts.push(c.contacts[0]),
    (c: typeof defaultSiteConfig) =>
      (c.canonicalUrl = "https://localhost/connect"),
  ]) {
    const c = structuredClone(defaultSiteConfig);
    mutate(c);
    const r = await adminPUT(
      new Request(origin + "/api/admin/content", {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          version: (await getContent()).version,
          content: c,
        }),
      }),
      { params: Promise.resolve({ path: ["content"] }) },
    );
    assert.equal(r.status, 422);
  }
  const normalized = siteConfigSchema.parse({
    ...defaultSiteConfig,
    whatsappNumber: "+20 (103) 424-3496",
  });
  assert.equal(normalized.whatsappNumber, "201034243496");
});
test("uploads inspect actual format, strip metadata, persist images, and protect referenced assets", async () => {
  await assert.rejects(() =>
    processImage(Buffer.from('<svg onload="alert(1)"></svg>')),
  );
  await assert.rejects(() => processImage(Buffer.alloc(4 * 1024 * 1024 + 1)));
  const png = await sharp({
    create: { width: 64, height: 48, channels: 3, background: "#cceeaa" },
  })
    .png()
    .toBuffer();
  const a = await uploadAsset(
    png,
    "../../avatar.png",
    { en: "Avatar", ar: "صورة" },
    "test",
  );
  assert.equal(a.name, "avatar.png");
  assert.equal(a.width, 64);
  assert.ok(a.bytes > 0);
  let row = await getContent();
  const c = structuredClone(row.draft);
  c.profile.avatar = a.url;
  row = await mutateContent("save", row.version, "test", c);
  await assert.rejects(
    () => deleteAsset(a.id, "test"),
    (e) => (e as { status: number }).status === 409,
  );
  await mutateContent("discard", row.version, "test");
  await deleteAsset(a.id, "test");
  const current = await getContent();
  await assert.rejects(
    () => mutateContent("save", current.version, "test", c),
    (e) => (e as { status: number }).status === 422,
  );
  const previousStore = process.env.BLOB_STORE_ID;
  try {
    process.env.BLOB_STORE_ID = "store_ExampleStore";
    const staleBlob = structuredClone(current.draft);
    staleBlob.profile.avatar =
      "https://examplestore.public.blob.vercel-storage.com/connect/deleted.webp";
    await assert.rejects(
      () => mutateContent("save", current.version, "test", staleBlob),
      (e) => (e as { status: number }).status === 422,
    );
  } finally {
    if (previousStore === undefined) delete process.env.BLOB_STORE_ID;
    else process.env.BLOB_STORE_ID = previousStore;
  }
});
test("analytics stores real daily aggregates and persisted request limits reject abuse", async () => {
  assert.equal((await analytics()).length, 0);
  await recordEvent("page_view");
  await recordEvent("page_view");
  const rows = await analytics();
  assert.equal(rows[0].count, 2);
  assert.equal(Object.hasOwn(rows[0], "ip"), false);
  await rateLimit("test", 1, 60);
  await assert.rejects(
    () => rateLimit("test", 1, 60),
    (e) => (e as { status: number }).status === 429,
  );
});
test("expired sessions and logout revoke access", async () => {
  const [s] = await getDB().select().from(schema.session);
  await getDB()
    .update(schema.session)
    .set({ expiresAt: new Date(Date.now() - 1000) })
    .where(eq(schema.session.id, s.id));
  await assert.rejects(() => requireOwner(headers()));
  const r = await auth(
    "sign-in/email",
    { email: "owner@example.test", password },
    false,
  );
  assert.equal(r.status, 200);
  cookie = r.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ");
  assert.equal((await auth("sign-out", {})).status, 200);
  await assert.rejects(() => requireOwner(headers()));
});
