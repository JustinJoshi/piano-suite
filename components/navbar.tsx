"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SignInButton, Show } from "@clerk/nextjs";
import { AppUserButton } from "@/components/app-user-button";
import { useRollSound } from "@/hooks/useRollSound";
import { ROLL_LANES, ROLL_LOW } from "@/lib/roll-music";
import { ROLL_NOTE_OFF, ROLL_NOTE_ON } from "@/lib/roll-audio";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Workshop", href: "/tools/workshop" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Routes", href: "/routes" },
  { label: "Articles", href: "/articles" },
  { label: "Pricing", href: "/pricing" },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const NOTE_ON_EVENTS = ["midi-note-on", "music-note-on", ROLL_NOTE_ON];
const NOTE_OFF_EVENTS = ["midi-note-off", "music-note-off", ROLL_NOTE_OFF];

/**
 * The tracker bar: the public header, and the bar a player-piano roll feeds
 * past. Its brass rail has one slot per semitone from C3 to C6, lined up with
 * the lanes of the roll below; a slot lights whenever its note sounds —
 * a key pressed, a MIDI keyboard, a hole passing, a song in the music player.
 * The wordmark's three holes are a C major chord and light for C, E and G.
 *
 * Lighting is written straight to the DOM (`data-lit`), not React state: a
 * fast scroll can start and stop dozens of notes a second.
 */
export function Navbar({ sound = false }: { sound?: boolean }) {
  const pathname = usePathname() ?? "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const rollSound = useRollSound();
  const slotsRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 900px)");
    const close = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    query.addEventListener("change", close);
    return () => query.removeEventListener("change", close);
  }, []);

  // Escape closes the menu (a disclosure, not a dialog, so no focus trap).
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    const slots = slotsRef.current ? Array.from(slotsRef.current.children) : [];
    const marks = markRef.current ? Array.from(markRef.current.children) : [];
    const noteCount = new Map<number, number>();
    const pcCount = new Map<number, number>();

    const bump = (note: number, delta: number) => {
      const n = Math.max(0, (noteCount.get(note) ?? 0) + delta);
      noteCount.set(note, n);
      const slot = slots[note - ROLL_LOW];
      if (slot) slot.toggleAttribute("data-lit", n > 0);
      const pc = ((note % 12) + 12) % 12;
      const p = Math.max(0, (pcCount.get(pc) ?? 0) + delta);
      pcCount.set(pc, p);
      for (const mark of marks) {
        if (Number((mark as HTMLElement).dataset.pc) === pc) mark.toggleAttribute("data-lit", p > 0);
      }
    };
    const on = (event: Event) => {
      const note = (event as CustomEvent<{ note: number }>).detail?.note;
      if (typeof note === "number") bump(note, 1);
    };
    const off = (event: Event) => {
      const note = (event as CustomEvent<{ note: number }>).detail?.note;
      if (typeof note === "number") bump(note, -1);
    };
    NOTE_ON_EVENTS.forEach((name) => window.addEventListener(name, on));
    NOTE_OFF_EVENTS.forEach((name) => window.addEventListener(name, off));
    return () => {
      NOTE_ON_EVENTS.forEach((name) => window.removeEventListener(name, on));
      NOTE_OFF_EVENTS.forEach((name) => window.removeEventListener(name, off));
    };
  }, []);

  return (
    <header className="tone-roll roll-tracker roll-on-case">
      <a
        href="#main-content"
        className="sr-only rounded-full bg-paper px-4 py-2 text-sm font-medium text-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60]"
      >
        Skip to content
      </a>
      <div className="roll-sheet">
        <div className="roll-tracker-row">
          <Link href="/" className="roll-wordmark" aria-label="Piano Suite home">
            <span className="roll-mark" aria-hidden="true" ref={markRef}>
              <i data-pc="0" />
              <i data-pc="4" />
              <i data-pc="7" />
            </span>
            <span>Piano Suite</span>
          </Link>

          <nav aria-label="Primary" className="roll-tracker-nav">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="roll-tracker-link"
                aria-current={isActivePath(pathname, link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="roll-tracker-controls">
            {sound ? (
              <button
                type="button"
                className="roll-sound"
                aria-pressed={rollSound.on}
                onClick={rollSound.toggle}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" />
                  <path className="wave" d="M15.5 9.2a4 4 0 0 1 0 5.6" />
                  <path className="wave wave-far" d="M18.3 6.6a7.6 7.6 0 0 1 0 10.8" />
                  <path className="mute" d="M16 9.5l5 5M21 9.5l-5 5" />
                </svg>
                <span className="roll-sound-text">
                  Sound<span aria-hidden="true"> {rollSound.on ? "on" : "off"}</span>
                </span>
              </button>
            ) : null}
            <Show when="signed-out">
              <SignInButton>
                <button type="button" className="roll-tracker-signin">
                  Sign in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <AppUserButton />
            </Show>
            <Link href="/start" className="roll-btn roll-btn-paper roll-btn-sm">
              Start playing
            </Link>
            <button
              type="button"
              className="roll-tracker-menu"
              aria-expanded={menuOpen}
              aria-controls="roll-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav id="roll-menu" aria-label="Primary (mobile)" className="roll-tracker-drawer">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActivePath(pathname, link.href) ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {link.label}
              </Link>
            ))}
            <Show when="signed-out">
              <SignInButton>
                <button
                  type="button"
                  className="roll-tracker-signin"
                  style={{ display: "block", padding: "12px 0", fontSize: 16 }}
                  onClick={() => setMenuOpen(false)}
                >
                  Sign in
                </button>
              </SignInButton>
            </Show>
          </nav>
        ) : null}

        <div className="roll-row roll-rail" data-roll-rail aria-hidden="true">
          <span className="roll-railcap" />
          <div className="roll-lanes roll-slots" ref={slotsRef}>
            {Array.from({ length: ROLL_LANES }, (_, i) => (
              <span key={i} className="roll-slot" style={{ "--i": i } as React.CSSProperties} />
            ))}
          </div>
        </div>
      </div>
      <p className={cn("roll-toast")} role="status" aria-live="polite" data-shown={rollSound.message ? "" : undefined}>
        {rollSound.message}
      </p>
    </header>
  );
}
