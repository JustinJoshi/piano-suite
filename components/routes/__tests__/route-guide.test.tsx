import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { readFileSync } from "fs";
import path from "path";
import { RouteGuide } from "@/components/routes/route-guide";
import { getLearningRoute, ROUTE_PROGRESS_KEY } from "@/lib/routes";
import type { AnkiDeckFile } from "@/lib/anki-setup-prompt";
import {
  resetPracticePageStore,
  getPracticePageStore,
} from "@/lib/custom-practice-storage";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function loadDecks(): AnkiDeckFile[] {
  return ["chord-symbols-CGDAEno11.txt", "chord-symbols-CGDAE.txt"].map(
    (filename) => ({
      title: filename,
      filename,
      content: readFileSync(
        path.join(process.cwd(), "public", filename),
        "utf8"
      ),
    })
  );
}

describe("RouteGuide", () => {
  const route = getLearningRoute("music-theory");
  if (!route) throw new Error("music-theory route missing");

  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.localStorage.clear();
    resetPracticePageStore();
    pushMock.mockClear();
    let uuidCount = 0;
    vi.stubGlobal(
      "crypto",
      { randomUUID: vi.fn(() => `uuid-${++uuidCount}`) } as unknown as Crypto
    );
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
    resetPracticePageStore();
  });

  it("renders every step with its title and body", () => {
    render(<RouteGuide routeId="music-theory" decks={loadDecks()} />);

    const steps = screen.getAllByTestId("route-step");
    expect(steps).toHaveLength(route.steps.length);
    for (const step of route.steps) {
      expect(screen.getByText(step.title)).toBeInTheDocument();
    }
  });

  it("shows the progress count as done steps are toggled", () => {
    render(<RouteGuide routeId="music-theory" decks={loadDecks()} />);

    expect(screen.getByTestId("route-progress")).toHaveTextContent(
      /0 of \d+ steps/
    );

    const firstToggle = screen.getAllByRole("button", {
      name: /mark ".*" done/i,
    })[0];
    fireEvent.click(firstToggle);

    expect(screen.getByTestId("route-progress")).toHaveTextContent(
      /1 of \d+ steps/
    );
  });

  it("persists toggles to localStorage and restores them", () => {
    render(<RouteGuide routeId="music-theory" decks={loadDecks()} />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /mark ".*" done/i })[0]
    );

    expect(window.localStorage.getItem(ROUTE_PROGRESS_KEY)).toContain(
      route.steps[0].id
    );

    // Fresh mount restores the done state.
    const { unmount } = render(
      <RouteGuide routeId="music-theory" decks={loadDecks()} />
    );
    expect(
      screen.getAllByTestId("route-step")[0].getAttribute("data-done")
    ).toBe("true");
    unmount();
  });

  it("copies a self-contained Anki setup prompt from the tiny button", async () => {
    render(<RouteGuide routeId="music-theory" decks={loadDecks()} />);

    fireEvent.click(screen.getByTestId("copy-anki-prompt"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const prompt = writeText.mock.calls[0][0] as string;
    expect(prompt).toContain("2055492159");
    expect(prompt).toContain("chord-symbols-CGDAEno11.txt");
  });

  it("seeds the workshop page and navigates there", async () => {
    render(<RouteGuide routeId="music-theory" decks={loadDecks()} />);

    fireEvent.click(screen.getByTestId("seed-workshop"));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/tools/workshop"));

    const store = getPracticePageStore();
    expect(store.pages).toHaveLength(1);
    expect(store.pages[0].blocks.length).toBeGreaterThan(0);
  });
});
