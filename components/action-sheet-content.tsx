"use client";
import { useState } from "react";
import { ArrowUpRight, Download } from "lucide-react";
import { buildVCard, downloadBlob } from "@/lib/contact";
import type { SiteConfig } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";

export function LinkSheetContent({
  url,
  action,
  t,
}: {
  url: string;
  action: string;
  t: Dictionary;
}) {
  return (
    <div className="action-content">
      {url ? (
        <p className="destination-preview">
          <bdi dir="ltr">{url}</bdi>
        </p>
      ) : (
        <p className="availability" role="status">
          {t.unconfigured}
        </p>
      )}
      {url ? (
        <a
          className="send-button sheet-primary"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {action}
          <ArrowUpRight size={22} />
        </a>
      ) : (
        <button className="send-button sheet-primary" disabled>
          {action}
          <ArrowUpRight size={22} />
        </button>
      )}
      {url && <p className="handoff-note">{t.externalHint}</p>}
    </div>
  );
}

export function SaveContactSheetContent({
  contact,
  t,
}: {
  contact: SiteConfig["vcard"];
  t: Dictionary;
}) {
  const [error, setError] = useState("");
  function download() {
    try {
      downloadBlob(
        new Blob([buildVCard(contact)], { type: "text/vcard;charset=utf-8" }),
        "abdullah-ahmed.vcf",
      );
    } catch {
      setError(t.downloadError);
    }
  }
  const details = [
    { label: t.fullName, value: contact.fullName },
    { label: t.phone, value: contact.phone },
    { label: t.emailAddress, value: contact.email },
    { label: t.websiteLabel, value: contact.website },
  ].filter((row) => row.value);
  return (
    <div className="action-content">
      <dl className="contact-details">
        {details.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              <bdi dir={row.label === t.fullName ? "auto" : "ltr"}>
                {row.value}
              </bdi>
            </dd>
          </div>
        ))}
      </dl>
      {contact.profiles.length > 0 && (
        <p className="profile-inclusions">
          {t.includedProfiles}:{" "}
          {contact.profiles.map((p) => p.label).join(" · ")}
        </p>
      )}
      <button className="send-button sheet-primary" onClick={download}>
        <Download size={22} />
        {t.vcard}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <p className="handoff-note">{t.contactHint}</p>
    </div>
  );
}
