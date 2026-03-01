import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 999,
  },
};

export default nextConfig;
