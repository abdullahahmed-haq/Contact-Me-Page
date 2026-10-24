export type QRColors = { foreground: string; background: string };
export type InitialQR = { key: string; src: string };

export function qrKey(url: string, colors?: QRColors) {
  return JSON.stringify([
    url,
    colors?.foreground ?? "#111111",
    colors?.background ?? "#ffffff",
  ]);
}
