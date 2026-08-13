import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Allow phone/LAN access to the Next.js dev server (e.g. Expo Web or device on Wi‑Fi).
  allowedDevOrigins: ["172.20.10.4"],
}

export default nextConfig
