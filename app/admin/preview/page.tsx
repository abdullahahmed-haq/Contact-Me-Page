import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/server/auth";
import { getContent } from "@/lib/server/repository";
import { DraftPreview } from "@/components/admin/preview";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Draft preview · Connect",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  try {
    await requireOwner(await headers());
  } catch {
    redirect("/admin/login");
  }
  const row = await getContent();
  return (
    <DraftPreview
      initial={row.draft}
      locale={(await searchParams).lang === "ar" ? "ar" : "en"}
    />
  );
}
