import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import { put, del } from "@vercel/blob";
import { mkdir, writeFile, unlink, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { assets, site, revisions, audit } from "./schema";
import { getDB } from "./db";
import { eq, desc } from "drizzle-orm";
import { HttpError } from "./errors";
import { isPublicUrl } from "../contact";
export function storageStatus() {
  return process.env.S3_BUCKET && process.env.S3_PUBLIC_URL
    ? "object-storage"
    : process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID
      ? "vercel-blob"
      : process.env.NODE_ENV === "production"
        ? "not-configured"
        : "local-development";
}
async function removeStoredImage(
  storage: string,
  key: string,
  url: string,
  id: string,
) {
  if (storage === "vercel-blob") await del(url);
  else if (storage === "object-storage")
    await s3().send(
      new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
    );
  else if (storage === "local-development")
    await unlink(path.join(dir(), `${id}.webp`));
  else throw new HttpError(503, "Image storage is not configured");
}
function s3() {
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  });
}
const dir = () =>
  process.env.LOCAL_ASSET_DIR || path.join(process.cwd(), ".data/media");
export async function processImage(bytes: Buffer) {
  // Leave room for multipart metadata below Vercel's 4.5 MB request limit.
  if (!bytes.length || bytes.length > 4 * 1024 * 1024)
    throw new HttpError(413, "Upload an image smaller than 4 MB");
  try {
    const image = sharp(bytes, { limitInputPixels: 25000000, animated: false });
    const info = await image.metadata();
    if (
      !info.format ||
      !["png", "jpeg", "webp", "avif"].includes(info.format) ||
      !info.width ||
      !info.height
    )
      throw new Error("Unsupported image");
    const result = await image
      .rotate()
      .resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 88 })
      .toBuffer({ resolveWithObject: true });
    return result;
  } catch {
    throw new HttpError(
      422,
      "Use a valid PNG, JPEG, WebP or AVIF image. SVG uploads are restricted to curated project assets.",
    );
  }
}
export async function uploadAsset(
  bytes: Buffer,
  name: string,
  alt: { en: string; ar: string },
  actor: string,
) {
  const { data, info } = await processImage(bytes);
  const id = randomUUID(),
    key = `connect/${id}.webp`;
  let url = "";
  const storage = storageStatus();
  if (storage === "not-configured")
    throw new HttpError(
      503,
      "Configure persistent image storage before uploading in production",
    );
  if (storage === "vercel-blob") {
    const blob = await put(key, data, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 31536000,
    });
    url = blob.url;
  } else if (storage === "object-storage") {
    const base = process.env.S3_PUBLIC_URL!.replace(/\/$/, "");
    if (!isPublicUrl(base))
      throw new HttpError(503, "S3_PUBLIC_URL must be a public HTTPS URL");
    await s3().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: data,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    url = `${base}/${key}`;
  } else {
    await mkdir(dir(), { recursive: true });
    await writeFile(path.join(dir(), `${id}.webp`), data, { flag: "wx" });
    url = `/media/${id}`;
  }
  try {
    return await getDB().transaction(async (tx) => {
      const [row] = await tx
        .insert(assets)
        .values({
          id,
          key,
          url,
          storage,
          name:
            path
              .basename(name)
              .replace(/[^\p{L}\p{N}._ -]/gu, "")
              .slice(0, 120) || "image.webp",
          width: info.width,
          height: info.height,
          bytes: data.length,
          alt,
        })
        .returning();
      await tx.insert(audit).values({
        id: randomUUID(),
        actor,
        action: "asset.upload",
        detail: id,
      });
      return row;
    });
  } catch (e) {
    await removeStoredImage(storage, key, url, id);
    throw e;
  }
}
export async function listAssets() {
  return getDB().select().from(assets).orderBy(desc(assets.createdAt));
}
export async function deleteAsset(id: string, actor: string) {
  const db = getDB();
  await db.transaction(async (tx) => {
    // Share the content lock with publishing/saving to prevent deleting an asset during a save.
    const rows = await tx.select().from(site).for("update");
    const [a] = await tx.select().from(assets).where(eq(assets.id, id));
    if (!a) throw new HttpError(404, "Image not found");
    const history = await tx
      .select({ content: revisions.content })
      .from(revisions);
    if (JSON.stringify([rows, history]).includes(a.url))
      throw new HttpError(
        409,
        "This image is used by draft, published content or a saved revision. Keep it to preserve those versions.",
      );
    await removeStoredImage(a.storage, a.key, a.url, id);
    await tx.delete(assets).where(eq(assets.id, id));
    await tx
      .insert(audit)
      .values({ id: randomUUID(), actor, action: "asset.delete", detail: id });
  });
}
export async function localAsset(id: string) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new HttpError(404, "Not found");
  const [a] = await getDB().select().from(assets).where(eq(assets.id, id));
  if (!a || a.storage !== "local-development")
    throw new HttpError(404, "Not found");
  return readFile(path.join(dir(), `${id}.webp`));
}
