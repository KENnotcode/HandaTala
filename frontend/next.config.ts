import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

const lanOrigins = Object.values(networkInterfaces())
  .flatMap((interfaces) => interfaces ?? [])
  .filter((networkInterface) => networkInterface.family === "IPv4" && !networkInterface.internal)
  .map((networkInterface) => networkInterface.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: lanOrigins,
};

export default nextConfig;
