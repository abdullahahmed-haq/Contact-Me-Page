import type { SiteConfig } from "./config";
export type ContentRecord = {
  id: number;
  draft: SiteConfig;
  published: SiteConfig;
  version: number;
  publishedAt: string | null;
  updatedAt: string;
};
export type AssetRecord = {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
  alt: { en: string; ar: string };
  createdAt: string;
};
export type AuditRecord = {
  id: string;
  action: string;
  actor: string;
  detail: string;
  createdAt: string;
};
export type RevisionRecord = { id: string; createdAt: string; actor: string };
export type AnalyticsRecord = {
  id: string;
  day: string;
  event: string;
  count: number;
};
