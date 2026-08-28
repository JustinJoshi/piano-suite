import * as Sentry from "@sentry/nextjs";

export const SENTRY_TRACES_SAMPLE_RATE = 0.1;

function environment(): string {
  return process.env.VERCEL_ENV ?? "development";
}

export function sentryDsn(): string | undefined {
  return process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
}

function initWith(dsn: string): void {
  Sentry.init({
    dsn,
    environment: environment(),
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
  });
}

export function initServerSentry(): void {
  const dsn = sentryDsn();
  if (!dsn) {
    return;
  }
  initWith(dsn);
}

export function initClientSentry(): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return;
  }
  initWith(dsn);
}
