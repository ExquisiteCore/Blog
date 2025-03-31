import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ooo.0x0.ooo",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
