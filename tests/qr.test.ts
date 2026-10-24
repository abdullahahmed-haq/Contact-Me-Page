import { test } from "node:test";
import assert from "node:assert/strict";
import jsQR from "jsqr";
import { createQR } from "../lib/qr";
import { initialQRCode } from "../lib/server/qr";
import { defaultSiteConfig } from "../lib/config";
import { qrKey } from "../lib/qr-data";
// pngjs has no public declaration in this project; use a typed dynamic import.
const png = require("pngjs") as {
  PNG: {
    sync: {
      read: (buffer: Buffer) => { data: Buffer; width: number; height: number };
    };
  };
};
test("generated QR decodes to the exact canonical URL with quiet zone", async () => {
  const url = "https://example.com/connect/";
  const data = await createQR(url);
  const image = png.PNG.sync.read(Buffer.from(data.split(",")[1], "base64"));
  const code = jsQR(
    new Uint8ClampedArray(image.data),
    image.width,
    image.height,
  );
  assert.equal(code?.data, url);
  assert.equal(image.data[0], 255);
  const svg = await createQR(url, "svg");
  assert.match(svg, /<svg/);
  assert.match(svg, /viewBox/);
});
test("QR generator refuses blank, local or insecure canonical URLs", async () => {
  for (const url of ["", "http://example.com", "https://localhost/connect"])
    await assert.rejects(() => createQR(url));
});

test("the public server QR matches the canonical URL and configured colors", async () => {
  const config = structuredClone(defaultSiteConfig);
  config.canonicalUrl = "https://example.com/?source=qr&lang=ar";
  config.qr = { foreground: "#172d50", background: "#ffffff" };
  const initial = await initialQRCode(config);
  assert.equal(initial?.key, qrKey(config.canonicalUrl, config.qr));
  const image = png.PNG.sync.read(
    Buffer.from(initial!.src.split(",")[1], "base64"),
  );
  const code = jsQR(
    new Uint8ClampedArray(image.data),
    image.width,
    image.height,
  );
  assert.equal(code?.data, config.canonicalUrl);
  assert.notEqual(
    initial?.key,
    qrKey("https://example.com/changed", config.qr),
  );
  assert.notEqual(
    initial?.key,
    qrKey(config.canonicalUrl, { ...config.qr, foreground: "#000000" }),
  );
  config.qr.foreground = "#173523";
  const recolored = await initialQRCode(config);
  assert.notEqual(recolored?.src, initial?.src);
  assert.equal(recolored?.key, qrKey(config.canonicalUrl, config.qr));
  config.canonicalUrl = "https://example.com/changed";
  const changed = await initialQRCode(config);
  assert.notEqual(changed?.src, recolored?.src);
  assert.equal(changed?.key, qrKey(config.canonicalUrl, config.qr));
  config.sections.qr = false;
  assert.equal(await initialQRCode(config), undefined);
  config.sections.qr = true;
  config.canonicalUrl = "https://localhost/";
  assert.equal(await initialQRCode(config), undefined);
});
