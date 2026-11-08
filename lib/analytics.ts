export const ANALYTICS_EVENTS = [
  "drill_started",
  "drill_completed",
  "pro_waitlist_click",
  "door_clicked",
  "page_created",
  "block_added",
  "page_published",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsProps = Record<string, unknown>;

// First-party reverse proxy configured in next.config.ts. Requests never leave
// for *.posthog.com from the browser, so ad blockers see a same-origin path.
export const POSTHOG_API_HOST = "/ingest";
export const POSTHOG_UI_HOST = "https://us.posthog.com";

type PostHogClient = (typeof import("posthog-js"))["default"];

let initStarted = false;
let posthogPromise: Promise<PostHogClient> | null = null;

function posthogKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  return key ? key : undefined;
}

function loadPosthog() {
  if (!posthogPromise) {
    posthogPromise = import("posthog-js").then((mod) => mod.default);
  }
  return posthogPromise;
}

/**
 * Initialize once and hand back the client. Capture, identify and reset all
 * route through here so an event fired before the provider's mount effect still
 * lands after init instead of being dropped by an uninitialized SDK.
 */
function analyticsClient(): Promise<PostHogClient> | null {
  const key = posthogKey();
  if (!key || typeof window === "undefined") {
    return null;
  }

  return loadPosthog().then((posthog) => {
    if (!initStarted) {
      initStarted = true;
      posthog.init(key, {
        // Same-origin reverse proxy (next.config.ts rewrites /ingest/*).
        api_host: POSTHOG_API_HOST,
        // Real PostHog app, used for "open in PostHog" links.
        ui_host: POSTHOG_UI_HOST,

        // Full product analytics: clicks (autocapture), pageviews (manual,
        // below), pageleaves, heatmaps, dead/rage clicks, exceptions.
        autocapture: true,
        capture_pageview: false,
        capture_pageleave: true,
        capture_heatmaps: true,
        capture_dead_clicks: true,
        capture_exceptions: true,

        // Session recordings with every form input masked. No typed values
        // ever reach PostHog.
        disable_session_recording: false,
        session_recording: {
          maskAllInputs: true,
        },
      });
    }
    return posthog;
  });
}

export function initAnalytics(): void {
  void analyticsClient();
}

export function captureEvent(name: AnalyticsEvent, props: AnalyticsProps = {}) {
  if (!ANALYTICS_EVENTS.includes(name)) {
    console.warn(`[analytics] dropped unknown event: ${String(name)}`);
    return;
  }

  mirrorToWindow(name, props);

  const client = analyticsClient();
  if (!client) {
    return;
  }

  void client.then((posthog) => {
    posthog.capture(name, props);
  });
}

export function capturePageview(path: string): void {
  // usePathname() never includes a query, but strip one defensively so Clerk
  // or onboarding parameters can never reach PostHog via a caller mistake.
  const $current_url = path.split("?")[0];
  mirrorToWindow("$pageview", { $current_url });

  const client = analyticsClient();
  if (!client) {
    return;
  }

  void client.then((posthog) => {
    posthog.capture("$pageview", { $current_url });
  });
}

/** Tie anonymous events to the signed-in Clerk user. */
export function identifyUser(userId: string): void {
  const client = analyticsClient();
  if (!client) {
    return;
  }

  void client.then((posthog) => {
    posthog.identify(userId);
  });
}

/** Start a fresh anonymous person after sign-out. */
export function resetAnalytics(): void {
  const client = analyticsClient();
  if (!client) {
    return;
  }

  void client.then((posthog) => {
    posthog.reset();
  });
}

function mirrorToWindow(name: string, props: AnalyticsProps) {
  if (typeof window === "undefined") {
    return;
  }

  const host = window as unknown as Record<string, unknown>;
  const log = (host.__analyticsEvents ?? []) as Array<{
    name: string;
    props: AnalyticsProps;
    ts: number;
  }>;

  log.push({ name, props, ts: Date.now() });
  host.__analyticsEvents = log;
}

/**
 * An event to emit later, returned from a pure store function so the caller
 * can fire it once, outside any React state updater (StrictMode double-invokes
 * updaters, which would double-count inline events). See `capturePending`.
 */
export type PendingAnalyticsEvent = {
  event: AnalyticsEvent;
  properties?: Record<string, unknown>;
};

export function capturePending(
  pending: PendingAnalyticsEvent | null | undefined
): void {
  if (pending) captureEvent(pending.event, pending.properties);
}
