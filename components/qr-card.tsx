"use client";
import { ScanLine, QrCode } from "lucide-react";
import type { SiteConfig } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";
import type { InitialQR } from "@/lib/qr-data";
import { useQRCode } from "./use-qr-code";

export function QRCodeCard({
  url,
  t,
  onOpen,
  qr,
  initialQR,
  busy,
}: {
  url: string;
  qr?: SiteConfig["qr"];
  initialQR?: InitialQR;
  busy?: boolean;
  t: Dictionary;
  onOpen: () => void;
}) {
  const { src, error } = useQRCode(url, t, qr, initialQR);
  return (
    <section className="qr-card">
      <button
        className="card-trigger"
        data-action="qr"
        aria-label={t.scan}
        aria-haspopup="dialog"
        aria-busy={busy || undefined}
        onClick={onOpen}
      />
      <div className="qr-copy">
        <ScanLine size={24} aria-hidden="true" />
        <h2>{t.scan}</h2>
        <p>{t.scanSub}</p>
      </div>
      <div className={`qr-picture ${src ? "" : "qr-empty"}`}>
        {src ? (
          <img src={src} alt={t.scan} width={156} height={156} />
        ) : (
          <>
            <QrCode size={45} aria-hidden="true" />
            <p>{t.qrPending}</p>
          </>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
