import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAnkiSync } from "@/hooks/useAnkiSync";
import * as anki from "@/lib/anki";
import * as musicTheory from "@/lib/music-theory";

vi.mock("@/lib/anki", async (importOriginal) => {
  const actual = await importOriginal<typeof anki>();
  return {
    ...actual,
    getCurrentCardWithMeta: vi.fn(),
  };
});

vi.mock("@/lib/music-theory", async (importOriginal) => {
  const actual = await importOriginal<typeof musicTheory>();
  return {
    ...actual,
    parseChord: vi.fn(),
  };
});

describe("useAnkiSync", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("is off when disabled", () => {
    const { result } = renderHook(() => useAnkiSync({ enabled: false }));
    expect(result.current.status).toBe("off");
    expect(result.current.parsedCard).toBeNull();
  });

  it("polls Anki and parses the current card", async () => {
    const card = {
      cardId: 123,
      question: "Gm7",
      answer: "G Bb D F",
      deckName: "Piano::Chord Symbols",
      modelName: "Basic",
      fields: {},
    };

    vi.mocked(anki.getCurrentCardWithMeta).mockResolvedValue({
      card,
      queue: "review",
      deckStats: { new: 5, learn: 2, review: 12, total: 100 },
    });

    vi.mocked(musicTheory.parseChord).mockReturnValue({
      root: { pc: 7, name: "G", flat: false },
      quality: { suffix: "m7", tones: [0, 3, 7, 10] },
      qualityIdx: 2,
      suffix: "m7",
      fullSymbol: "Gm7",
    });

    const { result } = renderHook(() => useAnkiSync({ enabled: true }));

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });

    expect(result.current.parsedCard?.chordSymbol).toBe("Gm7");
    expect(result.current.parsedCard?.queue).toBe("review");
    expect(result.current.deckStats).toEqual({
      new: 5,
      learn: 2,
      review: 12,
      total: 100,
    });
  });

  it("calls onFirstConnect once on first successful poll", async () => {
    const onFirstConnect = vi.fn();

    vi.mocked(anki.getCurrentCardWithMeta).mockResolvedValue({
      card: {
        cardId: 123,
        question: "Gm7",
        answer: "G Bb D F",
        deckName: "Piano::Chord Symbols",
        modelName: "Basic",
        fields: {},
      },
      queue: "review",
      deckStats: { new: 0, learn: 0, review: 0, total: 0 },
    });

    vi.mocked(musicTheory.parseChord).mockReturnValue({
      root: { pc: 7, name: "G", flat: false },
      quality: { suffix: "m7", tones: [0, 3, 7, 10] },
      qualityIdx: 2,
      suffix: "m7",
      fullSymbol: "Gm7",
    });

    renderHook(() => useAnkiSync({ enabled: true, onFirstConnect }));

    await waitFor(() => {
      expect(onFirstConnect).toHaveBeenCalledTimes(1);
    });
  });

  it("reports no-card when chord cannot be parsed", async () => {
    vi.mocked(anki.getCurrentCardWithMeta).mockResolvedValue({
      card: {
        cardId: 123,
        question: "Hello world",
        answer: "",
        deckName: "Piano::Chord Symbols",
        modelName: "Basic",
        fields: {},
      },
      queue: "new",
      deckStats: { new: 0, learn: 0, review: 0, total: 0 },
    });

    vi.mocked(musicTheory.parseChord).mockReturnValue(null);

    const { result } = renderHook(() => useAnkiSync({ enabled: true }));

    await waitFor(() => {
      expect(result.current.status).toBe("no-card");
    });
  });

  it("reports error when Anki is unreachable", async () => {
    vi.mocked(anki.getCurrentCardWithMeta).mockResolvedValue({
      card: null,
      queue: null,
      deckStats: { new: null, learn: null, review: null, total: null },
    });

    const { result } = renderHook(() => useAnkiSync({ enabled: true }));

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
  });

  it("polls on interval", async () => {
    vi.mocked(anki.getCurrentCardWithMeta).mockResolvedValue({
      card: null,
      queue: null,
      deckStats: { new: null, learn: null, review: null, total: null },
    });

    const { unmount } = renderHook(() => useAnkiSync({ enabled: true, pollIntervalMs: 50 }));

    await waitFor(() => {
      expect(anki.getCurrentCardWithMeta).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });

    await waitFor(() => {
      expect(anki.getCurrentCardWithMeta).toHaveBeenCalledTimes(2);
    });

    unmount();
  });
});
