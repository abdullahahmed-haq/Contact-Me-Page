import { getPublished } from "@/lib/server/repository";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const c = await getPublished();
    if (!c.settings.enabled)
      return Response.json({ error: "Page unavailable" }, { status: 404 });
    return Response.json(c, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Content is unavailable" }, { status: 503 });
  }
}
