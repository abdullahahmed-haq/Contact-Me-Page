import QRCode from "qrcode";
import { isPublicUrl } from "./contact";
export async function createQR(
  url: string,
  format: "png" | "svg" = "png",
  colors = { foreground: "#111111", background: "#ffffff" },
) {
  if (!isPublicUrl(url))
    throw new Error("A public HTTPS Connect URL is required");
  const options = {
    margin: 4,
    errorCorrectionLevel: "M" as const,
    color: { dark: colors.foreground, light: colors.background },
  };
  return format === "svg"
    ? QRCode.toString(url, { ...options, type: "svg" })
    : QRCode.toDataURL(url, { ...options, width: 600 });
}
