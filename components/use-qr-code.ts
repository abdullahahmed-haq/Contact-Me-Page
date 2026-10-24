"use client";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { isPublicUrl } from "@/lib/contact";
import { qrKey, type InitialQR, type QRColors } from "@/lib/qr-data";

const generated = new Map<string, Promise<string>>();
function generate(url: string, qr?: QRColors) {
  const key = qrKey(url, qr);
  let result = generated.get(key);
  if (!result) {
    result = import("@/lib/qr").then(({ createQR }) =>
      createQR(url, "png", qr),
    );
    generated.set(key, result);
    const pending = result;
    void result.catch(() => {
      if (generated.get(key) === pending) generated.delete(key);
    });
    if (generated.size > 8) generated.delete(generated.keys().next().value!);
  }
  return result;
}

export function useQRCode(
  url: string,
  t: Dictionary,
  qr?: QRColors,
  initialQR?: InitialQR,
) {
  const key = qrKey(url, qr);
  const seeded = initialQR?.key === key ? initialQR.src : "";
  const [result, setResult] = useState<{
    key: string;
    src: string;
    failed?: boolean;
  }>();
  const [downloadError, setDownloadError] = useState<{
    key: string;
    message: string;
  }>();
  const foreground = qr?.foreground;
  const background = qr?.background;
  useEffect(() => {
    if (seeded || !isPublicUrl(url)) return;
    let active = true;
    const colors =
      foreground && background ? { foreground, background } : undefined;
    generate(url, colors).then(
      (src) => {
        if (active) setResult({ key, src });
      },
      () => {
        if (active) setResult({ key, src: "", failed: true });
      },
    );
    return () => {
      active = false;
    };
  }, [url, key, foreground, background, seeded]);
  return {
    src: seeded || (result?.key === key ? result.src : ""),
    error:
      downloadError?.key === key
        ? downloadError.message
        : result?.key === key && result.failed
          ? t.qrError
          : "",
    setError: (message: string) => setDownloadError({ key, message }),
  };
}
