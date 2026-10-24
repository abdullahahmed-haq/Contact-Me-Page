"use client";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import type { SiteConfig } from "@/lib/config";
import { createQR } from "@/lib/qr";
import { ArrowDownToLine, ScanLine, QrCode } from "lucide-react";
import { downloadBlob, isPublicUrl } from "@/lib/contact";
import type { Dictionary } from "@/lib/i18n";

function useQRCode(url: string, t: Dictionary, qr?: SiteConfig["qr"]) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setSrc("");
    setError("");
    if (isPublicUrl(url))
      createQR(url, "png", qr)
        .then((v) => {
          if (active) setSrc(v);
        })
        .catch(() => {
          if (active) setError(t.qrError);
        });
    return () => {
      active = false;
    };
  }, [url, t.qrError, qr]);
  return { src, error, setError };
}

export function QRCodeCard({
  url,
  t,
  onOpen,
  qr,
}: {
  url: string;
  qr?: SiteConfig["qr"];
  t: Dictionary;
  onOpen: () => void;
}) {
  const { src, error } = useQRCode(url, t, qr);
  return (
    <section className="qr-card">
      <button
        className="card-trigger"
        data-action="qr"
        aria-label={t.scan}
        aria-haspopup="dialog"
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

export function QRCodeSheetContent({
  url,
  t,
  qr,
}: {
  url: string;
  t: Dictionary;
  qr?: SiteConfig["qr"];
}) {
  const { src, error, setError } = useQRCode(url, t, qr);
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
          await (await fetch(src)).blob(),
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
