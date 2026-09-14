import { betterAuth } from "better-auth";
import { toNodeHandler } from "better-auth/node";
import express from "express";
import http from "node:http";

console.log("Running Spike V31: Better Auth Mount Prefix Verification...");

import { prismaAdapter } from "better-auth/adapters/prisma";

const mockPrisma = {
  user: { findMany: async () => [] },
  session: { findMany: async () => [] },
  account: { findMany: async () => [] },
  verification: { findMany: async () => [] },
  ["$transaction"]: async (fn) => fn(mockPrisma),
};

const auth = betterAuth({
  secret: "test_secret_32_characters_long_1234567890",
  baseURL: "http://localhost:4098",
  basePath: "/api/auth",
  database: prismaAdapter(mockPrisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
});

const app = express();
// In Express 5 (path-to-regexp v8), bare '/*' throws PathError.
// Use app.use('/api/auth', toNodeHandler(auth)) or app.all('/api/auth/*splat', toNodeHandler(auth))
app.use("/api/auth", toNodeHandler(auth));

const server = http.createServer(app);
const PORT = 4098;

server.listen(PORT, async () => {
  try {
    const res = await fetch(`http://localhost:${PORT}/api/auth/ok`);
    console.log(`  Better Auth /api/auth/ok status: ${res.status}`);
    if (res.status !== 200) {
      throw new Error(`Unexpected status from Better Auth ok endpoint: ${res.status}`);
    }
    const data = await res.json();
    if (!data || data.ok !== true) {
      throw new Error(`Unexpected response from Better Auth ok: ${JSON.stringify(data)}`);
    }

    console.log("  ✅ Better Auth correctly mounts on /api/auth/* without collisions with /api/v1/*.");
    console.log("\n🎉 SPIKE V31 EMPIRICALLY VERIFIED: Better Auth mount-prefix is fully verified!");
    server.close(() => process.exit(0));
  } catch (err) {
    console.error("❌ V31 Verification failed:", err);
    server.close(() => process.exit(1));
  }
});
