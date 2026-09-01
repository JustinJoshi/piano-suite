import type { NextConfig } from "next";
import { existsSync } from "fs";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

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
  // The Workshop is the core of the app: /tools lands on it. Ready-made
  // drills remain direct routes and are linked from the Workshop page and
  // sidebar. Temporary (307) so the destination can evolve without cached
  // client redirects.
  //
  // Route renames (audit 2026-09, Phase 0.3): the community gallery lives at
  // /marketplace and the Workshop component picker at /tools/workshop/blocks,
  // so "marketplace" means exactly one thing. Old paths redirect.
  async redirects() {
    return [
      {
        source: "/tools",
        destination: "/tools/workshop",
        permanent: false,
      },
      {
        source: "/workshop",
        destination: "/marketplace",
        permanent: false,
      },
      {
        source: "/workshop/:path*",
        destination: "/marketplace/:path*",
        permanent: false,
      },
      {
        source: "/tools/workshop/marketplace",
        destination: "/tools/workshop/blocks",
        permanent: false,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Skip source-map upload wherever the token is absent (dev, CI, preview);
  // it switches on automatically once SENTRY_AUTH_TOKEN is provisioned.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  disableLogger: true,
});
