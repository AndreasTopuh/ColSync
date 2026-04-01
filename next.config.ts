import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['jspdf', 'fflate'],
};

export default nextConfig;

