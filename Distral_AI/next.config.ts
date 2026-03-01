import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 999,
  },
};

export default nextConfig;
