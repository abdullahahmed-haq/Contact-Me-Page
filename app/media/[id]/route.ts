import { localAsset } from "@/lib/server/storage";
export async function GET(
  _r: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const data = await localAsset((await ctx.params).id);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
