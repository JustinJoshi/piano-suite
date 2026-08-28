export const ANALYTICS_EVENTS = [
  "drill_started",
  "drill_completed",
  "pro_waitlist_click",
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

function mirrorToWindow(name: AnalyticsEvent, props: AnalyticsProps) {
  if (typeof window === "undefined") {
    return;
  }

  const host = window as unknown as Record<string, unknown>;
  const log = (host.__analyticsEvents ?? []) as Array<{
    name: AnalyticsEvent;
    props: AnalyticsProps;
    ts: number;
  }>;

  log.push({ name, props, ts: Date.now() });
  host.__analyticsEvents = log;
}
