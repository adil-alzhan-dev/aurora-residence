import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    // AVIF is about a third lighter than WebP for the renders; browsers without it get WebP.
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    // The meta tag only reaches crawlers that render HTML; the header covers everything else.
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/admin", headers: noindex },
      { source: "/admin/:path*", headers: noindex },
    ];
  },
};

export default nextConfig;
