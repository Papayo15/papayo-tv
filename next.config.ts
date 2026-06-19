import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: '**.iptv-org.github.io' },
      { protocol: 'https', hostname: 'www.thesportsdb.com' },
      { protocol: 'https', hostname: '**.thesportsdb.com' },
      { protocol: 'http', hostname: '**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
