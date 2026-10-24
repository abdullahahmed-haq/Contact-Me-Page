import assert from "node:assert/strict";
import { createInterface } from "node:readline";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const base = new URL(process.argv[2] || "https://connect.abdo-ahmed.online")
  .origin;
const origin = new URL(process.argv[3] || base).origin;
if (!base.startsWith("https:") || !origin.startsWith("https:"))
  throw new Error("Production verification requires HTTPS");
console.log("Ready for owner password on hidden stdin.");
const input = createInterface({ input: process.stdin, terminal: false });
const password = await new Promise((resolve) => input.once("line", resolve));
input.close();
const results = [];
let cookie = "",
  uploaded;
async function request(
  path,
  { method = "GET", body, authenticated = true, requestOrigin = origin } = {},
) {
  const headers = { Origin: requestOrigin };
  if (authenticated && cookie) headers.Cookie = cookie;
  if (body && !(body instanceof FormData))
    headers["Content-Type"] = "application/json";
  return fetch(`${base}${path}`, {
    method,
    headers,
    ...(body
      ? { body: body instanceof FormData ? body : JSON.stringify(body) }
      : {}),
    signal: AbortSignal.timeout(60000),
  });
}
async function check(name, action) {
  await action();
  results.push({ name, passed: true });
  console.log(`PASS ${name}`);
}
try {
  await check(
    "Public routes and both languages respond over HTTPS",
    async () => {
      for (const route of ["/", "/connect/"])
        for (const locale of ["en", "ar"]) {
          const response = await request(`${route}?lang=${locale}`);
          assert.equal(response.status, 200);
          const html = await response.text();
          assert.ok(html.includes('rel="canonical"'));
          assert.ok(html.includes("https://connect.abdo-ahmed.online/"));
          assert.ok(response.headers.get("content-security-policy"));
        }
    },
  );
  await check("Unauthenticated administration is blocked", async () => {
    assert.equal(
      (await request("/api/admin/content/", { authenticated: false })).status,
      401,
    );
    const login = await request("/admin/login/", { authenticated: false });
    assert.equal(login.status, 200);
    assert.match(login.headers.get("x-robots-tag") || "", /noindex/);
  });
  await check("Owner sign-in sets a Secure HttpOnly cookie", async () => {
    const response = await request("/api/auth/sign-in/email/", {
      method: "POST",
      authenticated: false,
      body: { email: "abdullah.ahmed.haq@gmail.com", password },
    });
    assert.equal(response.status, 200);
    const cookies = response.headers.getSetCookie();
    assert.ok(
      cookies.some((value) => /HttpOnly/i.test(value) && /Secure/i.test(value)),
    );
    cookie = cookies.map((value) => value.split(";")[0]).join("; ");
  });
  await check(
    "Managed database, Blob storage and dashboard are reachable",
    async () => {
      const response = await request("/api/admin/status/");
      assert.equal(response.status, 200);
      const status = await response.json();
      assert.equal(status.database, "connected");
      assert.equal(status.storage, "vercel-blob");
      assert.equal((await request("/admin/dashboard/")).status, 200);
    },
  );
  await check("Cross-origin mutations are rejected", async () => {
    assert.equal(
      (
        await request("/api/admin/publish/", {
          method: "POST",
          body: { version: 1 },
          requestOrigin: "https://invalid.example",
        })
      ).status,
      403,
    );
  });
  await check(
    "Processed image uploads are publicly served as WebP",
    async () => {
      const bytes = await sharp({
        create: { width: 12, height: 12, channels: 3, background: "#fffcf7" },
      })
        .png()
        .toBuffer();
      const form = new FormData();
      form.set(
        "file",
        new Blob([bytes], { type: "image/png" }),
        "deployment-verification.png",
      );
      form.set("altEn", "Temporary deployment verification");
      const response = await request("/api/admin/assets/", {
        method: "POST",
        body: form,
      });
      assert.equal(response.status, 201);
      uploaded = await response.json();
      const image = await fetch(uploaded.url);
      assert.equal(image.status, 200);
      assert.equal(
        (await sharp(Buffer.from(await image.arrayBuffer())).metadata()).format,
        "webp",
      );
    },
  );
  await check(
    "Saving and publishing preserve approved content; stale writes fail",
    async () => {
      const content = await (await request("/api/admin/content/")).json();
      const saved = await request("/api/admin/content/", {
        method: "PUT",
        body: { version: content.version, content: content.draft },
      });
      assert.equal(saved.status, 200);
      const draft = await saved.json();
      const published = await request("/api/admin/publish/", {
        method: "POST",
        body: { version: draft.version },
      });
      assert.equal(published.status, 200);
      assert.deepEqual((await published.json()).published, content.draft);
      assert.equal(
        (
          await request("/api/admin/content/", {
            method: "PUT",
            body: { version: content.version, content: content.draft },
          })
        ).status,
        409,
      );
      const publicContent = await (
        await request("/api/public/connect/", { authenticated: false })
      ).json();
      assert.deepEqual(publicContent, content.draft);
    },
  );
  await check(
    "Deleted Blob images cannot return through a stale draft",
    async () => {
      const url = uploaded.url;
      assert.equal(
        (
          await request(`/api/admin/assets/${uploaded.id}/`, {
            method: "DELETE",
          })
        ).status,
        200,
      );
      uploaded = undefined;
      const content = await (await request("/api/admin/content/")).json();
      content.draft.profile.avatar = url;
      assert.equal(
        (
          await request("/api/admin/content/", {
            method: "PUT",
            body: { version: content.version, content: content.draft },
          })
        ).status,
        422,
      );
    },
  );
  await check("Signing out revokes the verification session", async () => {
    assert.equal(
      (await request("/api/auth/sign-out/", { method: "POST", body: {} }))
        .status,
      200,
    );
    assert.equal((await request("/api/admin/content/")).status, 401);
    cookie = "";
  });
} finally {
  if (uploaded && cookie)
    await request(`/api/admin/assets/${uploaded.id}/`, { method: "DELETE" });
  if (cookie)
    await request("/api/auth/sign-out/", { method: "POST", body: {} });
  await mkdir("artifacts/admin", { recursive: true });
  await writeFile(
    "artifacts/admin/production-smoke-results.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        base,
        configuredOrigin: origin,
        results,
      },
      null,
      2,
    ) + "\n",
  );
}
