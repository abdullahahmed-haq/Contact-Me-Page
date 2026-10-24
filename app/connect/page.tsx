import type { Metadata } from "next";
import { getPublished } from "@/lib/server/repository";
import { ConnectPage } from "@/components/connect-page";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const c = await getPublished();
  const requestedLocale = (await searchParams).lang;
  const locale =
    requestedLocale === "ar" || requestedLocale === "en"
      ? requestedLocale
      : c.settings.defaultLocale;
  const image = c.seo.sharingImage || c.seo.image;
  return {
    title: c.seo.title[locale],
    description: c.seo.description[locale],
    alternates: c.canonicalUrl ? { canonical: c.canonicalUrl } : undefined,
    robots: {
      index: c.settings.enabled && c.seo.index,
      follow: c.settings.enabled && c.seo.index,
    },
    icons: c.seo.favicon ? { icon: c.seo.favicon } : undefined,
    openGraph: {
      title: c.seo.title[locale],
      description: c.seo.description[locale],
      ...(c.canonicalUrl ? { url: c.canonicalUrl } : {}),
      ...(c.seo.image ? { images: [c.seo.image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: c.seo.title[locale],
      description: c.seo.description[locale],
      ...(image ? { images: [image] } : {}),
    },
  };
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const c = await getPublished();
  if (!c.settings.enabled) notFound();
  const lang = (await searchParams).lang;
  return (
    <ConnectPage
      config={c}
      initialLocale={lang === "ar" || lang === "en" ? lang : undefined}
    />
  );
}
