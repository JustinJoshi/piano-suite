"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  hasSeenDemoIntro,
  markDemoIntroSeen,
  toolDemoVideoFor,
  type ToolDemoVideo,
} from "@/lib/demo-videos";

/**
 * Collapsed demo-video section for a tool page ("Watch the demo").
 *
 * First visit to the page: an accessible welcome overlay introduces the
 * tool and offers its demo video. Dismissing (CTA, close button, Escape)
 * sets a device-local per-tool flag and the page falls back to this
 * collapsed details section. No autoplay — the drill stays primary and
 * no reduced-motion path is needed (WCAG 2.2.2).
 */
export function ToolDemoVideo({ href }: { href: string }) {
  const demo = toolDemoVideoFor(href);
  const [showIntro, setShowIntro] = useState(false);
  const [checked, setChecked] = useState(false);

  // Mount-time check only — never re-opens mid-drill on a timer.
  useEffect(() => {
    if (demo) setShowIntro(!hasSeenDemoIntro(href));
    setChecked(true);
  }, [demo, href]);

  if (!demo) return null;

  return (
    <>
      {showIntro ? (
        <FirstVisitIntro demo={demo} href={href} onClose={() => setShowIntro(false)} />
      ) : null}
      {checked && !showIntro ? <DemoDetails demo={demo} /> : null}
    </>
  );
}

function DemoDetails({ demo }: { demo: ToolDemoVideo }) {
  return (
    <details className="mt-6 rounded-xl border border-border bg-card">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-foreground">
        {demo.title}
      </summary>
      <div className="px-4 pb-4">
        <video
          className="aspect-[16/10] w-full rounded-xl border border-border bg-background"
          src={demo.mp4}
          controls
          muted
          playsInline
          preload="metadata"
          aria-label={demo.ariaLabel}
        />
      </div>
    </details>
  );
}

/**
 * Welcome overlay. Same dialog semantics as shortcut-help.tsx: focus
 * moves in on open and returns to the page on close, Escape closes on
 * the dialog element, and the open overlay suppresses sibling Workshop
 * shortcuts (they bail when a dialog is open — see practice-page-editor).
 */
function FirstVisitIntro({
  demo,
  href,
  onClose,
}: {
  demo: ToolDemoVideo;
  href: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const dismiss = useCallback(() => {
    markDemoIntroSeen(href);
    onClose();
  }, [href, onClose]);

  useEffect(() => {
    restoreFocusRef.current =
      document.querySelector<HTMLElement>("main") ?? document.body;
    dialogRef.current?.focus();

    return () => {
      restoreFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        "button, [href], video",
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 p-4 pt-10 sm:items-center sm:pt-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-intro-heading"
        aria-describedby="demo-intro-body"
        data-testid="demo-intro-overlay"
        tabIndex={-1}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-lg focus:outline-none sm:p-6"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            dismiss();
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="demo-intro-heading"
            className="text-base font-semibold text-foreground sm:text-lg"
          >
            {demo.introHeadline}
          </h2>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close welcome message"
            data-testid="demo-intro-close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p
          id="demo-intro-body"
          className="mt-3 text-sm leading-relaxed text-muted-foreground"
        >
          {demo.introBody}
        </p>

        <video
          className="mt-4 aspect-[16/10] w-full rounded-lg border border-border bg-background"
          src={demo.mp4}
          controls
          muted
          playsInline
          preload="metadata"
          aria-label={demo.ariaLabel}
        />

        <button
          type="button"
          onClick={dismiss}
          data-testid="demo-intro-cta"
          className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {demo.introCta}
        </button>
      </div>
    </div>
  );
}
