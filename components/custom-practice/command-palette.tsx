"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { featureRegistry } from "@/lib/feature-blocks/registry";
import {
  OPEN_TILE_SETTINGS_EVENT,
  WORKSHOP_SHORTCUTS,
} from "@/lib/keyboard";
import {
  appendBlockToPage,
  type PracticePage,
  type PracticePageStore,
} from "@/lib/custom-practice-storage";
import { cn } from "@/lib/utils";

export type PaletteCommand = {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
};

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  store: PracticePageStore;
  page: PracticePage;
  updatePage: (updater: (prev: PracticePage) => PracticePage) => void;
  onSwitchPage: (pageId: string) => void;
  onOpenBlockLibrary: () => void;
};

function matches(query: string, command: PaletteCommand): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    command.label.toLowerCase().includes(q) ||
    (command.hint?.toLowerCase().includes(q) ?? false)
  );
}

export function CommandPalette({
  open,
  onClose,
  store,
  page,
  updatePage,
  onSwitchPage,
  onOpenBlockLibrary,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const commands = useMemo<PaletteCommand[]>(() => {
    const addCommands = Object.values(featureRegistry).map((def) => ({
      id: `add:${def.type}`,
      label: `Add ${def.label}`,
      hint: def.description,
      run: () => {
        // appendBlockToPage enforces maxPerPage and rejects unknown types.
        updatePage((prev) => appendBlockToPage(prev, def.type));
        onClose();
      },
    }));

    const switchCommands = store.pages
      .filter((p) => p.id !== store.activePageId)
      .map((p) => ({
        id: `switch:${p.id}`,
        label: `Switch to ${p.title.trim() || "Untitled"}`,
        hint: `${p.blocks.length} block${p.blocks.length === 1 ? "" : "s"}`,
        run: () => {
          onSwitchPage(p.id);
          onClose();
        },
      }));

    const tileCommands = page.blocks.flatMap((block) => {
      const def = featureRegistry[block.type as keyof typeof featureRegistry];
      const label = def?.label ?? block.type;
      return [
        {
          id: `settings:${block.id}`,
          label: `Settings for ${label}`,
          hint: "Open this tile's gear panel",
          run: () => {
            window.dispatchEvent(
              new CustomEvent(OPEN_TILE_SETTINGS_EVENT, {
                detail: { tileId: block.id },
              })
            );
            onClose();
          },
        },
        {
          id: `focus:${block.id}`,
          label: `Focus ${label}`,
          hint: "Move keyboard focus to this tile",
          run: () => {
            document.querySelector<HTMLElement>(
              `[data-tile-id="${block.id}"]`
            )?.focus();
            onClose();
          },
        },
      ];
    });

    return [
      ...addCommands,
      ...switchCommands,
      ...tileCommands,
      {
        id: "open-block-library",
        label: "Open block library",
        hint: "Browse every practice block",
        run: () => {
          onOpenBlockLibrary();
          onClose();
        },
      },
    ];
  }, [store, page, updatePage, onSwitchPage, onOpenBlockLibrary, onClose]);

  const filtered = useMemo(
    () => commands.filter((command) => matches(query, command)),
    [commands, query]
  );

  // Dialog with no primitive: focus the input on open, restore focus to
  // the trigger on close, trap Tab inside while open.
  useEffect(() => {
    if (!open) return;

    setQuery("");
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();

    return () => {
      restoreFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusables =
        dialogRef.current.querySelectorAll<HTMLElement>("button, input");
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
        aria-label="Command palette"
        data-testid="command-palette"
        className="w-full max-w-md rounded-xl border border-border bg-card p-2 shadow-lg"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search commands…"
          aria-label="Search commands"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
        />
        <div className="mt-2 max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No commands match.
            </p>
          ) : (
            filtered.map((command) => (
              <button
                key={command.id}
                type="button"
                onClick={command.run}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left hover:bg-muted/50"
                )}
              >
                <span className="text-sm text-foreground">
                  {command.label}
                </span>
                {command.hint ? (
                  <span className="text-xs text-muted-foreground">
                    {command.hint}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
        <p className="border-t border-border px-3 pb-1 pt-2 text-xs text-muted-foreground">
          Unmodified letters play notes — shortcuts:{" "}
          {WORKSHOP_SHORTCUTS.map((s) => s.keys).join(", ")}
        </p>
      </div>
    </div>
  );
}
