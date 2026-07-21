import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to this app (sibling lockfiles under PnP Vibes
  // can otherwise inflate watch/compile memory when using `npm run dev:turbo`).
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    // Soft ceiling so Turbopack restarts before the whole machine swaps to death.
    // Only applies to `npm run dev:turbo` (ignored by webpack).
    turbopackMemoryLimit: 2048 * 1024 * 1024,
  },
};

export default nextConfig;
