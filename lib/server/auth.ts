import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getDB } from "./db";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { HttpError } from "./errors";
export function appOrigin() {
  const value =
    process.env.BETTER_AUTH_URL ||
    (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "");
  if (!value) throw new Error("BETTER_AUTH_URL is required");
  const u = new URL(value);
  if (process.env.NODE_ENV === "production" && u.protocol !== "https:")
    throw new Error("Production requires HTTPS");
  return u.origin;
}
function secret() {
  if (process.env.BETTER_AUTH_SECRET) {
    if (process.env.BETTER_AUTH_SECRET.length < 32)
      throw new Error(
        "Use at least 32 random characters for BETTER_AUTH_SECRET",
      );
    return process.env.BETTER_AUTH_SECRET;
  }
  if (process.env.NODE_ENV === "production")
    throw new Error("BETTER_AUTH_SECRET is required");
  const dir = process.env.LOCAL_DATABASE_DIR
    ? path.dirname(process.env.LOCAL_DATABASE_DIR)
    : path.join(process.cwd(), ".data");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "auth-secret");
  try {
    return readFileSync(file, "utf8");
  } catch {
    const s = randomBytes(48).toString("base64url");
    writeFileSync(file, s, { mode: 0o600, flag: "wx" });
    return s;
  }
}
function createAuth() {
  return betterAuth({
    appName: "Connect Studio",
    baseURL: appOrigin(),
    secret: secret(),
    database: drizzleAdapter(getDB(), { provider: "pg", schema }),
    trustedOrigins: [appOrigin()],
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 14,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    session: {
      expiresIn: 60 * 60 * 12,
      updateAge: 60 * 60,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 900, max: 5 },
        "/change-password": { window: 900, max: 5 },
      },
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      cookiePrefix: "connect",
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" },
      ipAddress: {
        ipAddressHeaders: process.env.TRUSTED_IP_HEADER
          ? [process.env.TRUSTED_IP_HEADER]
          : [],
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (s) => {
            const [owner] = await getDB()
              .select()
              .from(schema.owners)
              .where(eq(schema.owners.userId, s.userId));
            if (!owner) return false;
            return { data: { ...s, ipAddress: null, userAgent: null } };
          },
        },
      },
    },
  });
}
type Auth = ReturnType<typeof createAuth>;
const state = globalThis as unknown as { connectAuth?: Auth };
export function getAuth() {
  return (state.connectAuth ||= createAuth());
}
export async function requireOwner(headers: Headers) {
  const s = await getAuth().api.getSession({ headers });
  if (!s) throw new HttpError(401, "Please sign in again.");
  const [owner] = await getDB()
    .select()
    .from(schema.owners)
    .where(eq(schema.owners.userId, s.user.id));
  if (!owner) throw new HttpError(403, "Owner access required.");
  return s;
}
export function checkOrigin(request: Request) {
  if (
    request.headers.get("origin") !== appOrigin() ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new HttpError(403, "Request origin is not allowed.");
}
