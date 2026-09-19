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

let initStarted = false;
let posthogPromise: Promise<(typeof import("posthog-js"))["default"]> | null =
  null;

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

export function initAnalytics(): void {
  const key = posthogKey();
  if (!key || typeof window === "undefined" || initStarted) {
    return;
  }

  initStarted = true;
  void loadPosthog().then((posthog) => {
    posthog.init(key, { autocapture: false, capture_pageview: false });
  });
}

export function captureEvent(name: AnalyticsEvent, props: AnalyticsProps = {}) {
  if (!ANALYTICS_EVENTS.includes(name)) {
    console.warn(`[analytics] dropped unknown event: ${String(name)}`);
    return;
  }

  mirrorToWindow(name, props);

  const key = posthogKey();
  if (!key || typeof window === "undefined") {
    return;
  }

  void loadPosthog().then((posthog) => {
    posthog.capture(name, props);
  });
}

export function capturePageview(path: string): void {
  // usePathname() never includes a query, but strip one defensively so Clerk
  // or onboarding parameters can never reach PostHog via a caller mistake.
  const $current_url = path.split("?")[0];
  mirrorToWindow("$pageview", { $current_url });

  const key = posthogKey();
  if (!key || typeof window === "undefined") {
    return;
  }

  void loadPosthog().then((posthog) => {
    posthog.capture("$pageview", { $current_url });
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
