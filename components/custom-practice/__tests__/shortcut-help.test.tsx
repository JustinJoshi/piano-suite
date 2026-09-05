import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ShortcutHelp } from "@/components/custom-practice/shortcut-help";
import { WORKSHOP_SHORTCUTS } from "@/lib/keyboard";

describe("ShortcutHelp", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not render when closed", () => {
    render(<ShortcutHelp open={false} onClose={vi.fn()} />);

    expect(
      screen.queryByRole("dialog", { name: /keyboard shortcuts/i })
    ).not.toBeInTheDocument();
  });

  it("lists every binding from the shared constant", () => {
    render(<ShortcutHelp open onClose={vi.fn()} />);

    for (const shortcut of WORKSHOP_SHORTCUTS) {
      expect(
        screen.getByText(shortcut.keys),
        `missing binding cell for ${shortcut.id}`
      ).toBeInTheDocument();
      expect(
        screen.getByText(shortcut.description),
        `missing description for ${shortcut.id}`
      ).toBeInTheDocument();
    }
  });

  it("closes on Escape via the dialog element", () => {
    const onClose = vi.fn();
    render(<ShortcutHelp open onClose={onClose} />);

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });

  it("restores focus to the previously focused element on unmount", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    render(<ShortcutHelp open onClose={vi.fn()} />);
    expect(document.activeElement).not.toBe(trigger);

    cleanup();
    expect(document.activeElement).toBe(trigger);

    trigger.remove();
  });
});
