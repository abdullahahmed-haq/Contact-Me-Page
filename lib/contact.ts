// Enforce the textarea UTF-16 limit without cutting an emoji surrogate pair.
export function limitMessage(value: string, limit = 500): string {
  let result = "";
  for (const character of value) {
    if (result.length + character.length > limit) break;
    result += character;
  }
  return result;
}
import type { SiteConfig } from "./config";
export function buildWhatsAppUrl(
  number: string,
  message: string,
  limit = 500,
): string {
  if (!/^[1-9]\d{7,14}$/.test(number))
    throw new Error("Invalid WhatsApp number");
  if (!message.trim() || message.length > limit || limit > 500 || limit < 1)
    throw new Error("Message must contain 1–500 characters");
  return `https://wa.me/${number}?text=${encodeURIComponent(message.trim())}`;
}
const escapeVCard = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n?|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
// Fold by UTF-8 octets, preserving Unicode code points and RFC 6350 continuation lines.
function fold(line: string) {
  let result = "",
    count = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (count + size > 75) {
      result += "\r\n ";
      count = 1;
    }
    result += char;
    count += size;
  }
  return result;
}
export function buildVCard(contact: SiteConfig["vcard"]): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(contact.fullName)}`,
    `N:${escapeVCard(contact.familyName)};${escapeVCard(contact.givenName)};;;`,
  ];
  if (contact.phone) lines.push(`TEL;TYPE=CELL:${escapeVCard(contact.phone)}`);
  if (contact.email) lines.push(`EMAIL:${escapeVCard(contact.email)}`);
  if (contact.website) lines.push(`URL:${escapeVCard(contact.website)}`);
  if (contact.organization)
    lines.push(`ORG:${escapeVCard(contact.organization)}`);
  if (contact.title) lines.push(`TITLE:${escapeVCard(contact.title)}`);
  if (contact.fullNameAr) lines.push(`NOTE:${escapeVCard(contact.fullNameAr)}`);
  for (const p of contact.profiles)
    lines.push(
      `X-SOCIALPROFILE;TYPE=${p.label.replace(/[^a-z0-9]/gi, "")}:${escapeVCard(p.url)}`,
    );
  return [...lines, "END:VCARD"].map(fold).join("\r\n") + "\r\n";
}
export function downloadBlob(blob: Blob, name: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
export function isPublicUrl(value: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !/[\u0000-\u0020]/.test(value) &&
      !/^(localhost|127\.|169\.254\.|0\.|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
        u.hostname,
      ) &&
      u.hostname.includes(".") &&
      !u.hostname.endsWith(".local") &&
      !u.hostname.endsWith(".internal") &&
      !u.hostname.endsWith(".localhost")
    );
  } catch {
    return false;
  }
}
