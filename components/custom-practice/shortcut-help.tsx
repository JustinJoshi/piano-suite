"use client";

import { useEffect, useRef } from "react";
import { WORKSHOP_SHORTCUTS } from "@/lib/keyboard";

type ShortcutHelpProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Keyboard shortcut help. The binding list is the shared
 * WORKSHOP_SHORTCUTS constant — the palette hint renders the same
 * constant, so the two cannot drift.
 */
export function ShortcutHelp({ open, onClose }: ShortcutHelpProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Same dialog semantics as the command palette: focus moves in on open
  // and returns to the trigger on close.
  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    return () => {
      restoreFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusables =
        dialogRef.current.querySelectorAll<HTMLElement>("button, [href]");
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
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/60 p-4 pt-24">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        data-testid="shortcut-help"
        tabIndex={-1}
        className="w-full max-w-md rounded-xl border border-border bg-card p-4 shadow-lg focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <h2 className="text-sm font-semibold text-foreground">
          Keyboard shortcuts
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Unmodified letters play notes — these bindings are safe anywhere
          else.
        </p>
        <table className="mt-3 w-full text-sm">
          <caption className="sr-only">Keyboard shortcuts</caption>
          <tbody>
            {WORKSHOP_SHORTCUTS.map((shortcut) => (
              <tr key={shortcut.id}>
                <th
                  scope="row"
                  className="py-1.5 pr-4 text-left font-mono text-xs font-semibold whitespace-nowrap text-foreground"
                >
                  {shortcut.keys}
                </th>
                <td className="py-1.5 text-muted-foreground">
                  {shortcut.description}
                </td>
              </tr>
            ))}
          </tbody>
          <tbody>
            <tr>
              <td colSpan={2} className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Close
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
