import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Abdullah Ahmed — Let’s connect",
  description:
    "Student, AI automation and cybersecurity. Explore my work and let’s build something great together.",
  ...(process.env.NEXT_PUBLIC_CONNECT_URL
    ? { alternates: { canonical: process.env.NEXT_PUBLIC_CONNECT_URL } }
    : {}),
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fffcf7",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
