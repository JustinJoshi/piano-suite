import type { LucideIcon } from "lucide-react";
import { BookOpen, Hand } from "lucide-react";

/**
 * Guided routes: the "zero to playing" starter package.
 *
 * A route is an ordered checklist of steps that mixes short explanations,
 * external setup actions (Anki), in-app drills, and a final workshop seed.
 * This module is pure config + progress math; the guide UI lives in
 * `components/routes/`. Adding or tuning a route is data, not code.
 */

export type RouteStep =
  | {
      kind: "read";
      id: string;
      title: string;
      body: string;
    }
  | {
      kind: "external";
      id: string;
      title: string;
      body: string;
      href: string;
      cta: string;
    }
  | {
      kind: "anki-setup";
      id: string;
      title: string;
      body: string;
    }
  | {
      kind: "tool";
      id: string;
      title: string;
      body: string;
      href: string;
      cta: string;
    }
  | {
      kind: "seed-workshop";
      id: string;
      title: string;
      body: string;
      templateId: string;
    };

export type LearningRoute = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  steps: RouteStep[];
};

export const learningRoutes: LearningRoute[] = [
  {
    id: "music-theory",
    title: "Music theory route",
    tagline: "Understand what you play",
    description:
      "Learn chords through active recall and spaced repetition: set up Anki, drill chord symbols, then chain them into progressions.",
    icon: BookOpen,
    steps: [
      {
        kind: "read",
        id: "why-theory",
        title: "Why theory first",
        body: "Music theory starts with knowing chords by name — what notes they contain and where they come from. We build that memory with active recall (producing the answer from scratch) and spaced repetition (reviewing right before you would forget), the two habits that make everything else faster.",
      },
      {
        kind: "anki-setup",
        id: "anki-setup",
        title: "Set up Anki with the Piano Suite decks",
        body: "Anki is the free spaced-repetition app that schedules your reviews. Install it, add the AnkiConnect bridge, and import the two pre-made Piano Suite chord decks — you only do this once.",
      },
      {
        kind: "external",
        id: "fingering-reference",
        title: "Bookmark a fingering reference",
        body: "When a chord symbol is new, look up its notes and fingering on piano-chords.org. Keep it open while you drill — checking is part of learning.",
        href: "https://www.piano-chords.org/",
        cta: "Open piano-chords.org",
      },
      {
        kind: "tool",
        id: "chord-drill",
        title: "Drill chords in the Chord Drill",
        body: "Turn on Anki Sync in the Chord Drill: it shows the chord your Anki deck schedules next, times your recall, and grades the card automatically. One focused session is enough for today.",
        href: "/tools/chord-drill",
        cta: "Open Chord Drill",
      },
      {
        kind: "tool",
        id: "progression-drill",
        title: "Follow up with chord progressions",
        body: "Chords in isolation become music when they move. The Progression drill times your ii-V-I transitions so the chords start flowing into each other.",
        href: "/tools/progression",
        cta: "Open Progression",
      },
      {
        kind: "seed-workshop",
        id: "seed-workshop",
        title: "Set up your practice page",
        body: "Finish by building your Workshop page: chord practice, a timer, and your MIDI connection status — ready for tomorrow's session.",
        templateId: "music-theory-starter",
      },
    ],
  },
  {
    id: "finger-flexibility",
    title: "Finger flexibility route",
    tagline: "Build hands that can practice",
    description:
      "Get your hands under load safely: care routines, metronome-backed technique sessions, and arpeggio cells that stretch every finger.",
    icon: Hand,
    steps: [
      {
        kind: "read",
        id: "why-hands",
        title: "Hands first",
        body: "Piano puts your hands under repeated load, and stiff, tired hands make every drill slower and riskier. A few minutes of care is not a break from practice — it is practice.",
      },
      {
        kind: "external",
        id: "hand-care",
        title: "Learn a short hand-care routine",
        body: "Pick one stretch routine you can repeat before every session. Two minutes, every time, beats an hour once a week.",
        href: "https://www.youtube.com/watch?v=M9VSpOiwwDU&t=251s",
        cta: "Watch the hand stretches",
      },
      {
        kind: "tool",
        id: "technique-session",
        title: "Log a technique session",
        body: "The Technique tracker pairs a metronome with a streak counter and a 28-day practice grid. Start at a tempo that feels almost too easy and log your first session.",
        href: "/tools/technique",
        cta: "Open Technique tracker",
      },
      {
        kind: "tool",
        id: "arpeggios-drill",
        title: "Stretch out with Arpeggios",
        body: "The Arpeggios drill runs the twelve minor-11th cells — one shape, twelve roots — training independent fingers and smooth thumb-unders at the same time.",
        href: "/tools/arpeggios",
        cta: "Open Arpeggios",
      },
      {
        kind: "seed-workshop",
        id: "seed-workshop",
        title: "Set up your practice page",
        body: "Finish by building your Workshop page: a metronome, a drill timer, and shortcuts to your drills — ready for tomorrow's session.",
        templateId: "finger-flexibility-starter",
      },
    ],
  },
];

export function getLearningRoute(id: string): LearningRoute | null {
  return learningRoutes.find((route) => route.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Progress (device-local; Pro sync lands in a later phase)
// ---------------------------------------------------------------------------

export const ROUTE_PROGRESS_KEY = "piano-suite:route-progress-v1";
const ROUTE_PROGRESS_EVENT = "piano-suite:route-progress-change";

/** routeId -> stepId -> done */
export type RouteProgress = Record<string, Record<string, boolean>>;

export function loadRouteProgress(): RouteProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ROUTE_PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as RouteProgress;
  } catch {
    return {};
  }
}

// Cached snapshot for useSyncExternalStore: getSnapshot must return a
// stable reference between renders, so parsing happens once per save.
let cachedProgress: RouteProgress | null = null;

export function getRouteProgressSnapshot(): RouteProgress {
  if (cachedProgress === null) {
    cachedProgress = loadRouteProgress();
  }
  return cachedProgress;
}

const EMPTY_PROGRESS: RouteProgress = {};

/** Stable server snapshot — useSyncExternalStore requires a cached value. */
export function getServerRouteProgressSnapshot(): RouteProgress {
  return EMPTY_PROGRESS;
}

export function subscribeRouteProgress(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(ROUTE_PROGRESS_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(ROUTE_PROGRESS_EVENT, callback);
  };
}

export function saveRouteProgress(progress: RouteProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROUTE_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Storage may be full or disabled; fail silently.
  }
  cachedProgress = progress;
  window.dispatchEvent(new Event(ROUTE_PROGRESS_EVENT));
}

export function isStepDone(
  progress: RouteProgress,
  routeId: string,
  stepId: string
): boolean {
  return progress[routeId]?.[stepId] === true;
}

/** Pure update: set one step's done flag. */
export function markStep(
  progress: RouteProgress,
  routeId: string,
  stepId: string,
  done: boolean
): RouteProgress {
  const steps = { ...progress[routeId], [stepId]: done };
  return { ...progress, [routeId]: steps };
}

/** First undone step id, or null when the route is complete. */
export function nextStepId(
  route: LearningRoute,
  progress: RouteProgress
): string | null {
  const step = route.steps.find((s) => !isStepDone(progress, route.id, s.id));
  return step?.id ?? null;
}

export function isRouteComplete(
  route: LearningRoute,
  progress: RouteProgress
): boolean {
  return nextStepId(route, progress) === null;
}
