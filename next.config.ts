import type { NextConfig } from "next";
import { optimizedImageBases } from "./lib/image-policy";
const imageBases = optimizedImageBases(process.env.S3_PUBLIC_URL);
const config: NextConfig = {
  devIndicators: false,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["@electric-sql/pglite", "pg", "sharp"],
  trailingSlash: true,
  env: { NEXT_PUBLIC_OPTIMIZED_IMAGE_BASES: JSON.stringify(imageBases) },
  images: {
    qualities: [80],
    imageSizes: [32, 48, 64, 96, 112, 128, 132, 220, 256, 264, 384, 440],
    localPatterns: [
      { pathname: "/assets/**", search: "" },
      { pathname: "/media/**", search: "" },
    ],
    remotePatterns: imageBases.map((base) => {
      const url = new URL(base);
      return {
        protocol: "https" as const,
        hostname: url.hostname,
        port: url.port,
        pathname: `${url.pathname}**`,
        search: "",
      };
    }),
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'" +
              (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "") +
              "; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'",
          },
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};
export default config;
