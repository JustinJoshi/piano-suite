import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { NoteRollBlock } from "@/components/feature-blocks/note-roll-block";
import { DrillRuntimeProvider } from "@/lib/drill-runtime";

function stubMatchMedia(matchesReduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches:
        matchesReduce && query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

function renderBlock() {
  return render(
    <DrillRuntimeProvider pageId="page-1" blocks={[]}>
      <NoteRollBlock />
    </DrillRuntimeProvider>
  );
}

describe("NoteRollBlock motion controls", () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    rafSpy = vi.spyOn(window, "requestAnimationFrame");
  });

  afterEach(() => {
    cleanup();
    rafSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("does not start the animation loop when reduced motion is preferred", () => {
    stubMatchMedia(true);
    let uuidCount = 0;
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => `test-uuid-${++uuidCount}`),
    } as unknown as Crypto);

    renderBlock();

    expect(screen.getByTestId("note-roll")).toBeInTheDocument();
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it("starts the loop otherwise and pauses and resumes from the button", () => {
    stubMatchMedia(false);
    let uuidCount = 0;
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => `test-uuid-${++uuidCount}`),
    } as unknown as Crypto);

    renderBlock();

    expect(rafSpy).toHaveBeenCalled();

    const pause = screen.getByRole("button", { name: /pause animation/i });
    expect(pause).toHaveAttribute("data-paused", "false");

    fireEvent.click(pause);
    expect(pause).toHaveAttribute("data-paused", "true");
    expect(
      screen.getByRole("button", { name: /resume animation/i })
    ).toHaveAttribute("data-paused", "true");

    fireEvent.click(screen.getByRole("button", { name: /resume animation/i }));
    expect(
      screen.getByRole("button", { name: /pause animation/i })
    ).toHaveAttribute("data-paused", "false");
  });
});
