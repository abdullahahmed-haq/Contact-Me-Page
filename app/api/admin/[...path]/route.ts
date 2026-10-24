import { z } from "zod";
import { requireOwner, checkOrigin } from "@/lib/server/auth";
import {
  getContent,
  mutateContent,
  recentActivity,
  recentRevisions,
  analytics,
  rateLimit,
  logEvent,
} from "@/lib/server/repository";
import { apiError, json, readJson, readBytes } from "@/lib/server/http";
import { HttpError } from "@/lib/server/errors";
import {
  deleteAsset,
  listAssets,
  storageStatus,
  uploadAsset,
} from "@/lib/server/storage";
import { getDB } from "@/lib/server/db";
import { assets } from "@/lib/server/schema";
import { eq } from "drizzle-orm";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handler(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    const s = await requireOwner(request.headers);
    const actor = s.user.email;
    const parts = (await ctx.params).path;
    const p = parts.join("/");
    if (request.method !== "GET") {
      checkOrigin(request);
      await rateLimit(`admin:${s.user.id}`, 120, 60);
    }
    if (request.method === "GET") {
      if (p === "content" || p === "preview") return json(await getContent());
      if (p === "revisions") return json(await recentRevisions());
      if (p === "activity") return json(await recentActivity());
      if (p === "assets") return json(await listAssets());
      if (p === "analytics") {
        const days = z.coerce
          .number()
          .int()
          .min(1)
          .max(365)
          .parse(new URL(request.url).searchParams.get("days") || 30);
        return json(await analytics(days));
      }
      if (p === "status")
        return json({
          database: "connected",
          storage: storageStatus(),
          aiGeneration: "not-configured",
          emailRecovery: "offline-owner-recovery",
          owner: { name: s.user.name, email: actor },
          sessionExpiresAt: s.session.expiresAt,
        });
    }
    if (
      (request.method === "PUT" && p === "content") ||
      (request.method === "POST" &&
        ["publish", "discard", "restore", "import"].includes(p))
    ) {
      const body = z
        .object({
          version: z.number().int().min(1),
          content: z.unknown().optional(),
          revision: z.string().max(100).optional(),
        })
        .parse(await readJson(request));
      return json(
        await mutateContent(
          p === "content" || p === "import"
            ? "save"
            : (p as "publish" | "discard" | "restore"),
          body.version,
          actor,
          body.content,
          body.revision,
        ),
      );
    }
    if (p === "assets" && request.method === "POST") {
      const bytes = await readBytes(request, 6 * 1024 * 1024);
      const form = await new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: bytes,
      }).formData();
      const file = form.get("file");
      if (!(file instanceof File)) throw new HttpError(422, "Select an image");
      const alt = z
        .object({ en: z.string().max(500), ar: z.string().max(500) })
        .parse({ en: form.get("altEn") || "", ar: form.get("altAr") || "" });
      return json(
        await uploadAsset(
          Buffer.from(await file.arrayBuffer()),
          file.name,
          alt,
          actor,
        ),
        201,
      );
    }
    if (parts[0] === "assets" && parts.length === 2) {
      const id = z.uuid().parse(parts[1]);
      if (request.method === "DELETE") {
        await deleteAsset(id, actor);
        return json({ ok: true });
      }
      if (request.method === "PATCH") {
        const body = z
          .object({
            alt: z.object({ en: z.string().max(500), ar: z.string().max(500) }),
          })
          .parse(await readJson(request, 5000));
        const [row] = await getDB()
          .update(assets)
          .set({ alt: body.alt })
          .where(eq(assets.id, id))
          .returning();
        if (!row) throw new HttpError(404, "Image not found");
        await logEvent("asset.alt-updated", actor, id);
        return json(row);
      }
    }
    throw new HttpError(404, "Not found");
  } catch (e) {
    return apiError(e);
  }
}
export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
