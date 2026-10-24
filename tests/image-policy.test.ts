import { test } from "node:test";
import assert from "node:assert/strict";
import { canOptimizeImage, optimizedImageBases } from "../lib/image-policy";

test("image optimization only accepts the configured public storage paths", () => {
  const bases = optimizedImageBases("https://media.example.com/profile");
  assert.equal(
    canOptimizeImage("https://media.example.com/profile/avatar.webp", bases),
    true,
  );
  for (const src of [
    "https://media.example.com/other/avatar.webp",
    "https://media.example.com.evil.test/profile/avatar.webp",
    "https://media.example.com/profile/../private/avatar.webp",
    "https://media.example.com/profile/avatar.webp?token=secret",
    "https://user:password@media.example.com/profile/avatar.webp",
    "http://media.example.com/profile/avatar.webp",
    "https://unknown.example.com/avatar.webp",
    "data:image/png;base64,abc",
    "//localhost/private.png",
  ])
    assert.equal(canOptimizeImage(src, bases), false, src);
});

test("curated SVG stays direct while local raster and media images can resize", () => {
  assert.equal(
    canOptimizeImage("/assets/abdullah-illustrated-avatar.webp"),
    true,
  );
  assert.equal(
    canOptimizeImage("/media/12345678-1234-1234-1234-123456789abc/"),
    true,
  );
  assert.equal(canOptimizeImage("/assets/website-preview.svg"), false);
  assert.equal(
    canOptimizeImage(
      "https://t5qu4bksdkvjljiq.public.blob.vercel-storage.com/connect/test.SVG",
    ),
    false,
  );
  assert.equal(canOptimizeImage("/api/admin/assets/"), false);
  assert.throws(() => optimizedImageBases("http://localhost/images"));
  assert.throws(() =>
    optimizedImageBases("https://user:secret@example.com/images"),
  );
});
