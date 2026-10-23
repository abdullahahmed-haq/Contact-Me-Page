import { test } from "node:test";
import assert from "node:assert/strict";
import jsQR from "jsqr";
import { createQR } from "../lib/qr";
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
