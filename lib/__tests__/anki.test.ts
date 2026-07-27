import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  callAnki,
  pingAnki,
  getCurrentCard,
  flipCurrentCard,
  gradeCurrentCard,
  getDeckStats,
  classifyCardQueue,
  getCurrentCardWithMeta,
} from "@/lib/anki";

describe("callAnki", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the correct request body", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ result: "6.1.0", error: null }),
    } as Response);

    await callAnki("version");

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:8765", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "version", version: 6 }),
    });
  });

  it("includes params when provided", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ result: true, error: null }),
    } as Response);

    await callAnki("guiAnswerCard", { ease: 3 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8765",
      expect.objectContaining({
        body: JSON.stringify({
          action: "guiAnswerCard",
          version: 6,
          params: { ease: 3 },
        }),
      })
    );
  });

  it("returns the result on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ result: "6.1.0", error: null }),
    } as Response);

    const result = await callAnki("version");
    expect(result).toBe("6.1.0");
  });

  it("throws when AnkiConnect returns an error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ result: null, error: "collection not open" }),
    } as Response);

    await expect(callAnki("version")).rejects.toThrow("collection not open");
  });

  it("throws when fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    await expect(callAnki("version")).rejects.toThrow("Network error");
  });
});

describe("pingAnki", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when Anki is reachable", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ result: "6.1.0", error: null }),
    } as Response);

    expect(await pingAnki()).toBe(true);
  });

  it("returns false when Anki is unreachable", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    expect(await pingAnki()).toBe(false);
  });
});

describe("getCurrentCard", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the current card", async () => {
    const card = {
      cardId: 123,
      question: "Gm7",
      answer: "G Bb D F",
      deckName: "Piano::Chord Symbols",
      modelName: "Basic",
      fields: {},
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ result: card, error: null }),
    } as Response);

    expect(await getCurrentCard()).toEqual(card);
  });

  it("returns null when no card is in review", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    expect(await getCurrentCard()).toBeNull();
  });
});

describe("flipCurrentCard", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("succeeds when Anki flips the card", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ result: true, error: null }),
    } as Response);

    await expect(flipCurrentCard()).resolves.toBeUndefined();
  });

  it("throws when no card is in review", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ result: false, error: null }),
    } as Response);

    await expect(flipCurrentCard()).rejects.toThrow("No card in review mode");
  });
});

describe("gradeCurrentCard", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the correct ease value", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ result: true, error: null }),
    } as Response);

    await gradeCurrentCard(3);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8765",
      expect.objectContaining({
        body: expect.stringContaining('"ease":3'),
      })
    );
  });
});

describe("classifyCardQueue", () => {
  it("classifies new cards", () => {
    expect(classifyCardQueue(0, 0)).toBe("new");
    expect(classifyCardQueue(2, 0)).toBe("new");
  });

  it("classifies learning cards", () => {
    expect(classifyCardQueue(1, 1)).toBe("learning");
    expect(classifyCardQueue(3, 3)).toBe("learning");
  });

  it("classifies review cards", () => {
    expect(classifyCardQueue(2, 2)).toBe("review");
  });

  it("returns null for unknown queues", () => {
    expect(classifyCardQueue(-1, -1)).toBeNull();
  });
});

describe("getDeckStats", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns stats for the first deck", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        result: {
          "Piano::Chord Symbols": {
            new_count: 5,
            learn_count: 2,
            review_count: 12,
            total_in_deck: 100,
          },
        },
        error: null,
      }),
    } as Response);

    const stats = await getDeckStats(["Piano::Chord Symbols"]);
    expect(stats).toEqual({ new: 5, learn: 2, review: 12, total: 100 });
  });

  it("returns null stats on error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    const stats = await getDeckStats(["Piano::Chord Symbols"]);
    expect(stats).toEqual({ new: null, learn: null, review: null, total: null });
  });
});

describe("getCurrentCardWithMeta", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns card, queue, and deck stats together", async () => {
    const card = {
      cardId: 123,
      question: "Gm7",
      answer: "G Bb D F",
      deckName: "Piano::Chord Symbols",
      modelName: "Basic",
      fields: {},
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({ result: card, error: null }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({
          result: [{ cardId: 123, type: 0, queue: 0 }],
          error: null,
        }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({
          result: {
            "Piano::Chord Symbols": {
              new_count: 5,
              learn_count: 0,
              review_count: 0,
              total_in_deck: 50,
            },
          },
          error: null,
        }),
      } as Response);

    const meta = await getCurrentCardWithMeta();
    expect(meta.card).toEqual(card);
    expect(meta.queue).toBe("new");
    expect(meta.deckStats).toEqual({ new: 5, learn: 0, review: 0, total: 50 });
  });
});
