import QRCode from "qrcode";
import { isPublicUrl } from "./contact";
export async function createQR(url: string, format: "png" | "svg" = "png") {
  if (!isPublicUrl(url))
    throw new Error("A public HTTPS Connect URL is required");
  const options = {
    margin: 4,
    errorCorrectionLevel: "M" as const,
    color: { dark: "#111111", light: "#ffffff" },
  };
  return format === "svg"
    ? QRCode.toString(url, { ...options, type: "svg" })
    : QRCode.toDataURL(url, { ...options, width: 600 });
}
