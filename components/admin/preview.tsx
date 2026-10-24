"use client";
import { useEffect, useState } from "react";
import { ConnectPage } from "../connect-page";
import { siteConfigSchema, type SiteConfig, type Locale } from "@/lib/config";
export function DraftPreview({
  initial,
  locale,
}: {
  initial: SiteConfig;
  locale: Locale;
}) {
  const [config, setConfig] = useState(initial);
  const [lang, setLang] = useState(locale);
  useEffect(() => {
    function update(e: MessageEvent) {
      if (
        e.origin !== location.origin ||
        e.source !== window.parent ||
        e.data?.type !== "connect-preview"
      )
        return;
      const parsed = siteConfigSchema.safeParse(e.data.content);
      if (parsed.success) {
        setConfig(parsed.data);
        setLang(e.data.locale === "ar" ? "ar" : "en");
      }
    }
    window.addEventListener("message", update);
    window.parent.postMessage(
      { type: "connect-preview-ready" },
      location.origin,
    );
    return () => window.removeEventListener("message", update);
  }, []);
  return (
    <ConnectPage key={lang} config={config} initialLocale={lang} preview />
  );
}
