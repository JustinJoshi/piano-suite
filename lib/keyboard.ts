export const EDITABLE_TAGS = new Set(["input", "textarea", "select"]);

/** Window event asking a tile to open its gear panel (see workshop-tile). */
export const OPEN_TILE_SETTINGS_EVENT = "piano-suite:open-tile-settings";

/**
 * True when keyboard events originate from a field the user types in.
 * Shared by every window-level shortcut: unmodified letters are piano
 * notes (QWERTY piano), so shortcuts must be ignored while editing.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (EDITABLE_TAGS.has(target.tagName.toLowerCase()) ||
      target.isContentEditable)
  );
}

/**
 * Every Workshop keyboard binding, in one place. The palette hint and the
 * shortcut help dialog both render this list so they cannot drift. Keys
 * shown are how they behave on macOS; Ctrl maps to Cmd elsewhere.
 */
export type WorkshopShortcut = {
  id: string;
  keys: string;
  description: string;
};

export const WORKSHOP_SHORTCUTS: WorkshopShortcut[] = [
  {
    id: "palette",
    keys: "Ctrl/Cmd+K",
    description: "Open the command palette (add blocks, switch pages, focus tiles)",
  },
  {
    id: "help",
    keys: "?",
    description: "Show this shortcut help",
  },
  {
    id: "block-library",
    keys: "/",
    description: "Open the block library",
  },
  {
    id: "reorder",
    keys: "Arrow keys",
    description: "Reorder tiles after picking one up with the drag handle (Space to grab, Esc to cancel)",
  },
];
