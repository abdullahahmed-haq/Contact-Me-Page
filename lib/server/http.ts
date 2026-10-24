import { ZodError } from "zod";
import { HttpError } from "./errors";
export async function readBytes(request: Request, max: number) {
  if (Number(request.headers.get("content-length")) > max)
    throw new HttpError(413, "Request is too large");
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > max) {
        await reader.cancel();
        throw new HttpError(413, "Request is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const out = new Uint8Array(length);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}
export async function readJson(
  request: Request,
  max = 300000,
): Promise<unknown> {
  try {
    return JSON.parse(new TextDecoder().decode(await readBytes(request, max)));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, "Invalid JSON");
  }
}
export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export function apiError(e: unknown) {
  if (e instanceof ZodError)
    return json(
      {
        error: "Please correct the highlighted values.",
        issues: e.issues.map((x) => ({
          path: x.path.join("."),
          message: x.message,
        })),
      },
      422,
    );
  if (e instanceof HttpError) return json({ error: e.message }, e.status);
  console.error(
    "CMS request failed",
    e instanceof Error ? e.message : "Unknown error",
  );
  return json(
    {
      error:
        "The request failed. Check the server configuration and try again.",
    },
    503,
  );
}
