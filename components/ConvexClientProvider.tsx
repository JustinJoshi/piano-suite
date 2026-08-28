"use client";

import { ReactNode, useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { EnsureSignedInUser } from "@/components/ensure-signed-in-user";

let convexClient: ConvexReactClient | null = null;
let placeholderClient: ConvexReactClient | null = null;

const PLACEHOLDER_URL = "https://placeholder.convex.cloud";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    // Use a placeholder client so hooks like useQuery have a ConvexProvider
    // during static generation. At runtime the connection will fail loudly
    // unless a real URL is configured, which is the correct behavior for a
    // misconfigured deployment.
    if (!placeholderClient) {
      placeholderClient = new ConvexReactClient(PLACEHOLDER_URL);
    }
    return placeholderClient;
  }

  if (!convexClient) {
    convexClient = new ConvexReactClient(url);
  }

  return convexClient;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => getConvexClient(), []);

  if (convex === placeholderClient && typeof window !== "undefined") {
    console.error(
      "Piano Suite: NEXT_PUBLIC_CONVEX_URL is not set. Convex sync will not work."
    );
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <EnsureSignedInUser />
      {children}
    </ConvexProviderWithClerk>
  );
}
