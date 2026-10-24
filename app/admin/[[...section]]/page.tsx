import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { requireOwner } from "@/lib/server/auth";
import { getContent } from "@/lib/server/repository";
import { AdminWorkspace } from "@/components/admin/workspace";
import type { ContentRecord } from "@/lib/admin-types";
const sections = [
  "dashboard",
  "profile",
  "links",
  "whatsapp",
  "messages",
  "featured",
  "assets",
  "qr",
  "contact",
  "appearance",
  "localization",
  "analytics",
  "seo",
  "settings",
  "activity",
  "revisions",
];
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const p = (await params).section;
  if (!p?.length) redirect("/admin/dashboard");
  if (p.length !== 1 || !sections.includes(p[0])) notFound();
  let owner;
  try {
    owner = await requireOwner(await headers());
  } catch {
    redirect("/admin/login");
  }
  const data = JSON.parse(JSON.stringify(await getContent())) as ContentRecord;
  return (
    <AdminWorkspace initial={data} section={p[0]} email={owner.user.email} />
  );
}
