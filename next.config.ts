import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cms.donl.me" },
      { protocol: "https", hostname: "media.royalhousena.org" },
      { protocol: "https", hostname: "staging.media.royalhousena.org" },
    ],
  },
};

export default nextConfig;
