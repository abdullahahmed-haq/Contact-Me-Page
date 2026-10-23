"use client";
import { useEffect, useState } from "react";
import { createQR } from "@/lib/qr";
import { ArrowDownToLine, ScanLine, QrCode } from "lucide-react";
import { downloadBlob, isPublicUrl } from "@/lib/contact";
import type { Dictionary } from "@/lib/i18n";
export function QRCodeCard({ url, t }: { url: string; t: Dictionary }) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setSrc("");
    if (isPublicUrl(url))
      createQR(url)
        .then((v) => {
          if (active) setSrc(v);
        })
        .catch(() => {
          if (active) setError(t.qrError);
        });
    return () => {
      active = false;
    };
  }, [url, t.qrError]);
  async function download(format: "png" | "svg") {
    try {
      if (format === "svg") {
        const svg = await createQR(url, "svg");
        downloadBlob(
          new Blob([svg], { type: "image/svg+xml" }),
          "abdullah-connect-qr.svg",
        );
      } else {
        const blob = await (await fetch(src)).blob();
        downloadBlob(blob, "abdullah-connect-qr.png");
      }
    } catch {
      setError(t.downloadError);
    }
  }
  return (
    <section className="qr-card">
      <div className="qr-copy">
        <ScanLine size={24} aria-hidden="true" />
        <h2>{t.scan}</h2>
        <p>{t.scanSub}</p>
        {src && (
          <div className="qr-downloads">
            <button onClick={() => download("png")} aria-label={t.downloadPng}>
              <ArrowDownToLine size={14} /> PNG
            </button>
            <button onClick={() => download("svg")} aria-label={t.downloadSvg}>
              SVG
            </button>
          </div>
        )}
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
