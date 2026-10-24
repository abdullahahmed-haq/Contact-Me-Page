import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  bigint,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { SiteConfig } from "../config";
const time = (name: string) => timestamp(name, { withTimezone: true });
export const user = pgTable("admin_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: time("created_at").notNull().defaultNow(),
  updatedAt: time("updated_at").notNull().defaultNow(),
});
export const session = pgTable("admin_session", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: time("expires_at").notNull(),
  createdAt: time("created_at").notNull().defaultNow(),
  updatedAt: time("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});
export const account = pgTable(
  "admin_account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: time("access_token_expires_at"),
    refreshTokenExpiresAt: time("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: time("created_at").notNull().defaultNow(),
    updatedAt: time("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("account_provider_unique").on(t.providerId, t.accountId)],
);
export const verification = pgTable("admin_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: time("expires_at").notNull(),
  createdAt: time("created_at").notNull().defaultNow(),
  updatedAt: time("updated_at").notNull().defaultNow(),
});
export const rateLimit = pgTable("auth_rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
export const site = pgTable("site_content", {
  id: integer("id").primaryKey(),
  draft: jsonb("draft").$type<SiteConfig>().notNull(),
  published: jsonb("published").$type<SiteConfig>().notNull(),
  version: integer("version").notNull().default(1),
  publishedAt: time("published_at"),
  updatedAt: time("updated_at").notNull().defaultNow(),
});
export const revisions = pgTable("revisions", {
  id: text("id").primaryKey(),
  content: jsonb("content").$type<SiteConfig>().notNull(),
  createdAt: time("created_at").notNull().defaultNow(),
  actor: text("actor").notNull(),
});
export const audit = pgTable("audit_events", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  actor: text("actor").notNull(),
  detail: text("detail").notNull().default(""),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const assets = pgTable("assets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  key: text("key").notNull(),
  storage: text("storage").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  bytes: integer("bytes").notNull(),
  alt: jsonb("alt").$type<{ en: string; ar: string }>().notNull(),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const events = pgTable("daily_events", {
  id: text("id").primaryKey(),
  day: text("day").notNull(),
  event: text("event").notNull(),
  count: integer("count").notNull().default(0),
});
export const limits = pgTable("request_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  until: time("until").notNull(),
});
export const owners = pgTable("owners", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
});
