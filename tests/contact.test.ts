import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildWhatsAppUrl,
  limitMessage,
  buildVCard,
  isPublicUrl,
} from "../lib/contact";
import { getSiteConfig, siteConfigSchema } from "../lib/config";
test("WhatsApp preserves Arabic, emoji and reserved characters through URL encoding", () => {
  const msg = "أهلًا 👋 & let’s collaborate? #AI";
  const url = new URL(buildWhatsAppUrl("201034243496", msg));
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, "/201034243496");
  assert.equal(url.searchParams.get("text"), msg);
});
test("WhatsApp rejects blank, long messages and unsafe phone values", () => {
  for (const [n, m] of [
    ["201034243496", "  "],
    ["201034243496", "a".repeat(501)],
    ["+2010", "hello"],
    ["javascript:alert(1)", "hi"],
  ])
    assert.throws(() => buildWhatsAppUrl(n, m));
});
test("vCard contains real configured details with safe UTF-8 escaping and folding", async () => {
  const c = await getSiteConfig();
  const v = buildVCard({
    ...c.vcard,
    fullName: "عبدالله أحمد; AI, Security\nHello " + "ع".repeat(80),
  });
  assert.match(v, /BEGIN:VCARD\r\nVERSION:3.0/);
  assert.match(v, /TEL;TYPE=CELL:\+201034243496/);
  assert.match(v, /GitHub/);
  assert.match(v, /Instagram/);
  assert.ok(!v.includes("EMAIL:"));
  assert.match(v, /\\; AI\\, Security\\nHello/);
  for (const line of v.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75);
});
test("private and development URLs never produce production QR targets", () => {
  for (const u of [
    "",
    "http://localhost:3000/connect",
    "https://localhost/connect",
    "https://127.0.0.1/connect",
    "https://192.168.1.5/connect",
    "https://test.local/connect",
  ])
    assert.equal(isPublicUrl(u), false);
  assert.equal(isPublicUrl("https://example.com/connect"), true);
});
test("configuration rejects unsafe links and has six ordered cards and localized presets", async () => {
  const c = await getSiteConfig();
  assert.equal(c.contacts.length, 6);
  assert.equal(c.quickMessages.length, 4);
  assert.throws(() =>
    siteConfigSchema.parse({
      ...c,
      featured: { ...c.featured, url: "javascript:alert(1)" },
    }),
  );
  assert.equal(c.whatsappNumber, "201034243496");
});

test("message truncation preserves complete emoji at the 500-unit boundary", () => {
  const value = limitMessage("x".repeat(499) + "👋");
  assert.equal(value.length, 499);
  assert.doesNotThrow(() => buildWhatsAppUrl("201034243496", value));
  assert.equal(limitMessage("x".repeat(498) + "👋").length, 500);
  assert.equal(limitMessage("👋".repeat(251)), "👋".repeat(250));
});
