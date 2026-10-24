import { getAuth, checkOrigin, requireOwner } from "@/lib/server/auth";
import { logEvent, rateLimit } from "@/lib/server/repository";
import { HttpError } from "@/lib/server/errors";
import { readJson } from "@/lib/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handler(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/\/$/, "");
  const pathname = url.pathname;
  request = new Request(url, request);
  // Deliberately expose only the owner flows used by the UI. No registration or OAuth linking.
  const allowed = [
    "sign-in/email",
    "sign-out",
    "get-session",
    "change-password",
    "list-sessions",
    "revoke-session",
    "revoke-other-sessions",
  ];
  if (!allowed.some((p) => pathname === `/api/auth/${p}`))
    return Response.json({ error: "Not found" }, { status: 404 });
  try {
    let actor = "authentication";
    let payload: unknown;
    if (request.method !== "GET") {
      checkOrigin(request);
      payload = await readJson(request, 5000);
      request = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(payload),
      });
    }
    if (
      !pathname.endsWith("/sign-in/email") &&
      !pathname.endsWith("/get-session")
    )
      actor = (await requireOwner(request.headers)).user.email;
    if (pathname.endsWith("/sign-in/email") && request.method === "POST") {
      const body = payload as { email?: string };
      // Account-based limit is independent of client-provided IP headers.
      const email =
        typeof body.email === "string"
          ? body.email.toLowerCase().slice(0, 254)
          : "invalid";
      await rateLimit("login-global", 60, 60);
      await rateLimit(`login:${email}`, 10, 900);
      request = new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(body),
      });
    }
    const response = await getAuth().handler(request);
    if (pathname.endsWith("/sign-in/email"))
      await logEvent(
        response.ok ? "security.login" : "security.login-failed",
        "authentication",
      );
    if (
      response.ok &&
      request.method === "POST" &&
      !pathname.endsWith("/sign-in/email")
    )
      await logEvent(`security.${pathname.split("/").pop()}`, actor);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof HttpError
            ? e.message
            : "Authentication is unavailable. Check server configuration.",
      },
      { status: e instanceof HttpError ? e.status : 503 },
    );
  }
}
export { handler as GET, handler as POST };
