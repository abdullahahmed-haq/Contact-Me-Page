"use client";
import { ArrowDownToLine, QrCode } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import type { SiteConfig } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";
import type { InitialQR } from "@/lib/qr-data";
import { createQR } from "@/lib/qr";
import { downloadBlob } from "@/lib/contact";
import { useQRCode } from "./use-qr-code";

export function QRCodeSheetContent({
  url,
  t,
  qr,
  initialQR,
}: {
  url: string;
  t: Dictionary;
  qr?: SiteConfig["qr"];
  initialQR?: InitialQR;
}) {
  const { src, error, setError } = useQRCode(url, t, qr, initialQR);
  async function download(format: "png" | "svg") {
    try {
      trackEvent("qr_download");
      if (format === "svg")
        downloadBlob(
          new Blob([await createQR(url, "svg", qr)], { type: "image/svg+xml" }),
          "abdullah-connect-qr.svg",
        );
      else
        downloadBlob(
          new Blob(
            [
              Uint8Array.from(atob(src.split(",")[1]), (character) =>
                character.charCodeAt(0),
              ),
            ],
            { type: "image/png" },
          ),
          "abdullah-connect-qr.png",
        );
    } catch {
      setError(t.downloadError);
    }
  }
  return (
    <div className="action-content qr-sheet-content">
      {src ? (
        <>
          <div className="sheet-qr">
            <img src={src} alt={t.scan} width={260} height={260} />
          </div>
          <p className="qr-target">
            <bdi dir="ltr">{url}</bdi>
          </p>
        </>
      ) : (
        <div className="qr-pending">
          <QrCode size={58} aria-hidden="true" />
          <p role="status">{error || t.qrPending}</p>
        </div>
      )}
      <div className="qr-sheet-actions">
        <button
          className="send-button sheet-primary"
          disabled={!src}
          onClick={() => download("png")}
          aria-label={t.downloadPng}
        >
          <ArrowDownToLine size={20} />
          PNG
        </button>
        <button
          className="sheet-secondary"
          disabled={!src}
          onClick={() => download("svg")}
          aria-label={t.downloadSvg}
        >
          <ArrowDownToLine size={20} />
          SVG
        </button>
      </div>
      {src && error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
