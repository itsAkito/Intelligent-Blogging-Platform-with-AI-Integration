import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // disable to avoid double-render warnings that slow dev
  // SWC minification is the default in Next.js 15, no config needed.
  // Serve static assets with long-lived cache headers, preventing 404 on stale chunks
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/:path*\\.{png,jpg,jpeg,webp,avif,svg,ico,woff,woff2}",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
  // Compress responses
  compress: true,
  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 3600,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  // Suppress build warnings about missing packages
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
