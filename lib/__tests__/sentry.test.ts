import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SENTRY_TRACES_SAMPLE_RATE,
  initClientSentry,
  initServerSentry,
  sentryDsn,
} from "@/lib/sentry";
import * as Sentry from "@sentry/nextjs";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  captureRequestError: vi.fn(),
}));

const sentryInit = vi.mocked(Sentry.init);

describe("sentry config", () => {
  afterEach(() => {
    delete process.env.SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.VERCEL_ENV;
    vi.clearAllMocks();
  });

  it("keeps a fixed sample rate", () => {
    expect(SENTRY_TRACES_SAMPLE_RATE).toBeGreaterThan(0);
    expect(SENTRY_TRACES_SAMPLE_RATE).toBeLessThanOrEqual(1);
  });

  it("prefers the server DSN over the public one", () => {
    process.env.SENTRY_DSN = "https://server@example.com/1";
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@example.com/2";
    expect(sentryDsn()).toBe("https://server@example.com/1");
  });

  it("never initializes without a DSN", () => {
    initServerSentry();
    initClientSentry();
    expect(sentryInit).not.toHaveBeenCalled();
  });

  it("initializes the server with the DSN and prod environment", () => {
    process.env.SENTRY_DSN = "https://server@example.com/1";
    process.env.VERCEL_ENV = "production";

    initServerSentry();

    expect(sentryInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://server@example.com/1",
        environment: "production",
        tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
        sendDefaultPii: false,
      })
    );
  });

  it("initializes the client only from the public DSN", () => {
    process.env.SENTRY_DSN = "https://server@example.com/1";
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@example.com/2";
    process.env.VERCEL_ENV = "production";

    initClientSentry();

    expect(sentryInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://public@example.com/2",
      })
    );
  });
});
