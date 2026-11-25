import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

const lanOrigins = Object.values(networkInterfaces())
  .flatMap((interfaces) => interfaces ?? [])
  .filter((networkInterface) => networkInterface.family === "IPv4" && !networkInterface.internal)
  .map((networkInterface) => networkInterface.address);

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://onrender.com"
    : "http://localhost:5000");

const nextConfig: NextConfig = {
  allowedDevOrigins: lanOrigins,
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
