import type { NextConfig } from "next";
import http from "http";

// Defensive wrapper on http.OutgoingMessage.prototype.setHeader to prevent non-ASCII characters from crashing Link header
const origSetHeader = http.OutgoingMessage.prototype.setHeader;
http.OutgoingMessage.prototype.setHeader = function (
  name: string,
  value: number | string | readonly string[]
) {
  if (String(name).toLowerCase() === "link") {
    try {
      return origSetHeader.call(this, name, value);
    } catch {
      if (typeof value === "string") {
        const sanitized = value.replace(/[^\x00-\x7F]/g, "");
        return origSetHeader.call(this, name, sanitized);
      }
      return this;
    }
  }
  return origSetHeader.call(this, name, value);
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.loca.lt",
    "*.lhr.life",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
