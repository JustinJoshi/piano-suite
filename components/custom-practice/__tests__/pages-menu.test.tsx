import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PagesMenu } from "@/components/custom-practice/pages-menu";
import type { PracticePageStore } from "@/lib/custom-practice-storage";

function storeOf(
  pages: { id: string; title: string }[]
): PracticePageStore {
  return {
    version: 2,
    pages: pages.map((p) => ({
      ...p,
      blocks: [],
      updatedAt: 0,
    })),
    activePageId: pages[0].id,
  };
}

const handlers = {
  onSelect: vi.fn(),
  onCreate: vi.fn(),
  onDuplicate: vi.fn(),
  onDelete: vi.fn(),
  onToggleShare: vi.fn(),
  onTemplates: vi.fn(),
};

describe("PagesMenu", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the current page title on the trigger and empty titles as Untitled", () => {
    render(
      <PagesMenu
        store={storeOf([{ id: "p1", title: "  " }])}
        shareOpen={false}
        {...handlers}
      />
    );

    expect(screen.getByRole("button", { name: /untitled/i })).toBeInTheDocument();
  });

  it("lists pages and marks the active one when opened", () => {
    render(
      <PagesMenu
        store={storeOf([
          { id: "p1", title: "Warmup" },
          { id: "p2", title: "Scales" },
        ])}
        shareOpen={false}
        {...handlers}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /warmup/i }));

    const current = screen.getByRole("button", { name: /switch to warmup/i });
    expect(current).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("button", { name: /switch to scales/i })
    ).toBeInTheDocument();
  });

  it("selects a page and closes", () => {
    render(
      <PagesMenu
        store={storeOf([
          { id: "p1", title: "Warmup" },
          { id: "p2", title: "Scales" },
        ])}
        shareOpen={false}
        {...handlers}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /warmup/i }));
    fireEvent.click(screen.getByRole("button", { name: /switch to scales/i }));

    expect(handlers.onSelect).toHaveBeenCalledWith("p2");
    expect(screen.queryByRole("button", { name: /switch to scales/i })).not.toBeInTheDocument();
  });

  it("exposes page actions", () => {
    render(
      <PagesMenu
        store={storeOf([
          { id: "p1", title: "Warmup" },
          { id: "p2", title: "Scales" },
        ])}
        shareOpen={false}
        {...handlers}
      />
    );

    const open = () =>
      fireEvent.click(screen.getByRole("button", { name: /warmup/i }));

    open();
    fireEvent.click(screen.getByRole("button", { name: /new page/i }));
    expect(handlers.onCreate).toHaveBeenCalledTimes(1);

    open();
    fireEvent.click(screen.getByRole("button", { name: /duplicate page/i }));
    expect(handlers.onDuplicate).toHaveBeenCalledTimes(1);

    open();
    fireEvent.click(screen.getByRole("button", { name: /delete page/i }));
    expect(handlers.onDelete).toHaveBeenCalledTimes(1);

    open();
    fireEvent.click(screen.getByRole("button", { name: /share page/i }));
    expect(handlers.onToggleShare).toHaveBeenCalledTimes(1);

    open();
    fireEvent.click(screen.getByRole("button", { name: /templates/i }));
    expect(handlers.onTemplates).toHaveBeenCalledTimes(1);
  });

  it("disables delete when only one page exists", () => {
    render(
      <PagesMenu
        store={storeOf([{ id: "p1", title: "Warmup" }])}
        shareOpen={false}
        {...handlers}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /warmup/i }));
    expect(screen.getByRole("button", { name: /delete page/i })).toBeDisabled();
  });

  it("closes on Escape and outside clicks", () => {
    render(
      <PagesMenu
        store={storeOf([{ id: "p1", title: "Warmup" }])}
        shareOpen={false}
        {...handlers}
      />
    );

    const trigger = screen.getByRole("button", { name: /warmup/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: /new page/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("button", { name: /new page/i })).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("button", { name: /new page/i })).not.toBeInTheDocument();
  });
});
