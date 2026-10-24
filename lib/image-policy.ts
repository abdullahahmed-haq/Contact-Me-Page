const blobBase =
  "https://t5qu4bksdkvjljiq.public.blob.vercel-storage.com/connect/";

// These are public image locations, never storage credentials.
export function optimizedImageBases(s3PublicUrl?: string): string[] {
  const bases = [blobBase];
  if (s3PublicUrl) {
    const url = new URL(s3PublicUrl);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error("S3_PUBLIC_URL must be a public HTTPS image base");
    url.pathname = url.pathname.replace(/\/$/, "") + "/";
    bases.push(url.href);
  }
  return [...new Set(bases)];
}

export function canOptimizeImage(
  src: string,
  bases: string[] = JSON.parse(
    process.env.NEXT_PUBLIC_OPTIMIZED_IMAGE_BASES || JSON.stringify([blobBase]),
  ),
) {
  if (/\.svg(?:[?#]|$)/i.test(src)) return false;
  if (/^\/assets\/[a-zA-Z0-9._-]+$/.test(src)) return true;
  if (/^\/media\/[a-f0-9-]{36}\/?$/.test(src)) return true;
  try {
    const url = new URL(src);
    if (url.search || url.hash || url.username || url.password) return false;
    return bases.some((base) => {
      const allowed = new URL(base);
      return (
        url.origin === allowed.origin &&
        url.pathname.startsWith(allowed.pathname)
      );
    });
  } catch {
    return false;
  }
}
