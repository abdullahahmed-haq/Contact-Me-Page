import { createQR } from "../qr";
import { qrKey, type InitialQR } from "../qr-data";
import { isPublicUrl } from "../contact";
import type { SiteConfig } from "../config";

// Public, derived PNGs only. Bound memory use and invalidate by the complete QR key.
const rendered = new Map<string, Promise<InitialQR>>();

export async function initialQRCode(
  config: SiteConfig,
): Promise<InitialQR | undefined> {
  if (!config.sections.qr || !isPublicUrl(config.canonicalUrl)) return;
  const key = qrKey(config.canonicalUrl, config.qr);
  let result = rendered.get(key);
  if (!result) {
    result = createQR(config.canonicalUrl, "png", config.qr).then((src) => ({
      key,
      src,
    }));
    rendered.set(key, result);
    if (rendered.size > 16) rendered.delete(rendered.keys().next().value!);
  }
  try {
    return await result;
  } catch {
    if (rendered.get(key) === result) rendered.delete(key);
    // Keep the page available; the client can retry using the existing QR error state.
    return;
  }
}
