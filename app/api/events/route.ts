import { checkOrigin } from "@/lib/server/auth";
import { getPublished, rateLimit, recordEvent } from "@/lib/server/repository";
import { readJson } from "@/lib/server/http";
import { z } from "zod";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const c = await getPublished();
    if (!c.settings.enabled || !c.settings.analytics)
      return new Response(null, { status: 204 });
    const b = z
      .object({ event: z.string().max(100) })
      .parse(await readJson(request, 1000));
    const allowed = [
      "page_view",
      "qr_referral",
      "website_click",
      "website_open",
      "save_open",
      "contact_download",
      "qr_open",
      "qr_download",
      "whatsapp_outbound",
      "email_outbound",
      ...c.contacts
        .filter((x) => x.enabled)
        .flatMap((x) => [`${x.id}_open`, `${x.id}_click`]),
    ];
    if (!allowed.includes(b.event)) return new Response(null, { status: 400 });
    await rateLimit("analytics-global", 3000, 60);
    await recordEvent(b.event);
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
