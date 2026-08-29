import * as Sentry from "@sentry/nextjs";
import { initServerSentry } from "@/lib/sentry";

export function register() {
  initServerSentry();
}

export const onRequestError = Sentry.captureRequestError;
