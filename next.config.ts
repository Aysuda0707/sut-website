import type { NextConfig } from "next";

/**
 * Directus / object-storage hostnames allowed for next/image.
 * Derived from env so the same build works locally and in production.
 */
function mediaRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

  const directusUrl = process.env.DIRECTUS_URL;
  if (directusUrl) {
    try {
      const u = new URL(directusUrl);
      patterns.push({
        protocol: u.protocol.replace(":", "") as "http" | "https",
        hostname: u.hostname,
        port: u.port || undefined,
        pathname: "/assets/**",
      });
    } catch {
      // Ignore malformed URLs; fall back to no remote patterns.
    }
  }

  const s3Endpoint = process.env.STORAGE_S3_ENDPOINT;
  if (s3Endpoint) {
    try {
      const u = new URL(s3Endpoint);
      patterns.push({
        protocol: u.protocol.replace(":", "") as "http" | "https",
        hostname: u.hostname,
        port: u.port || undefined,
        pathname: "/**",
      });
    } catch {
      // Ignore malformed URLs.
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for the production Docker image.
  output: "standalone",
  // Persian-first: the site is RTL by default. Individual English fragments
  // are marked with dir="ltr" where needed.
  images: {
    remotePatterns: mediaRemotePatterns(),
    formats: ["image/avif", "image/webp"],
  },
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
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
