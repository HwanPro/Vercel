// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wolf-gym.s3.us-east-1.amazonaws.com",
        pathname: "/**", // o "/uploads/**" si prefieres restringir
      },
    ],
  },
};

export default nextConfig;
