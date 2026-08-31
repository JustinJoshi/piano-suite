import * as Sentry from "@sentry/nextjs";
import { initClientSentry } from "@/lib/sentry";
import { shouldLoadTracking } from "@/lib/age-gate";

// COPPA: client error tracking waits for the age gate, exactly like PostHog.
if (shouldLoadTracking()) {
  initClientSentry();
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
