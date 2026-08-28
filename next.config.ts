import type { NextConfig } from "next";
import { existsSync } from "fs";
import path from "path";

// In a git worktree, node_modules lives in the main repo root while __dirname
// points at the worktree. Resolve the project root by finding the Next.js
// package so Turbopack can locate dependencies both locally and on Vercel.
function resolveProjectRoot(): string {
  if (existsSync(path.join(__dirname, "node_modules", "next"))) {
    return __dirname;
  }
  const mainRepoRoot = path.resolve(__dirname, "../..");
  if (existsSync(path.join(mainRepoRoot, "node_modules", "next"))) {
    return mainRepoRoot;
  }
  return __dirname;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: resolveProjectRoot(),
  },
};

export default nextConfig;
