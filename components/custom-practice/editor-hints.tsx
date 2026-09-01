"use client";

import { useSyncExternalStore } from "react";
import { X } from "lucide-react";

const HINTS_KEY = "piano-suite:editor-hints-dismissed-v1";
const HINTS_EVENT = "piano-suite:editor-hints-change";

const HINTS = [
  "Your pages save automatically in this browser.",
  "Press / anywhere to open the shelf of blocks.",
  "Blocks are live — metronomes tick, timers run, drills score.",
];

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(HINTS_KEY) === "true";
  } catch {
    return false;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(HINTS_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(HINTS_EVENT, callback);
  };
}

/**
 * Phase 1.7: the fullscreen onboarding deck is gone; first-run guidance is
 * three dismissible one-line hints on a fresh workshop page instead.
 */
export function EditorHints({ visible }: { visible: boolean }) {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);

  if (!visible || dismissed) return null;

  return (
    <div
      data-testid="editor-hints"
      className="mb-4 flex flex-col gap-1.5 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
    >
      <ul className="space-y-1 sm:space-y-0 sm:space-x-4">
        {HINTS.map((hint) => (
          <li key={hint} className="sm:inline">
            {hint}
          </li>
        ))}
      </ul>
      <button
        type="button"
        aria-label="Dismiss hints"
        onClick={() => {
          try {
            window.localStorage.setItem(HINTS_KEY, "true");
          } catch {
            // Private mode — the session still dismisses via re-render.
          }
          window.dispatchEvent(new Event(HINTS_EVENT));
        }}
        className="self-start rounded-md p-1 text-muted-foreground hover:text-foreground sm:self-center"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
