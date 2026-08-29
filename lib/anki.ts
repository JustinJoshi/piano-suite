/**
 * Typed AnkiConnect client for Piano Suite.
 *
 * All communication with Anki desktop goes through this module.
 * Tool code should use the convenience helpers (`getCurrentCard`,
 * `flipCurrentCard`, etc.) rather than calling `callAnki` directly.
 */

export const DEFAULT_ANKI_CONNECT_URL = "http://127.0.0.1:8765";

export type AnkiEase = 1 | 2 | 3 | 4;

export type AnkiCardQueue = "new" | "learning" | "review" | null;

export type AnkiAction =
  | "version"
  | "guiCurrentCard"
  | "guiShowAnswer"
  | "guiAnswerCard"
  | "getDeckStats"
  | "cardsInfo";

export type AnkiRequest = {
  action: AnkiAction;
  version: number;
  params?: Record<string, unknown>;
};

export type AnkiResponse<T = unknown> = {
  result: T;
  error: string | null;
};

export type AnkiCard = {
  cardId: number;
  question: string;
  answer: string;
  deckName: string;
  modelName: string;
  fields: Record<string, { value: string; order: number }>;
};

export type DeckStats = {
  new: number | null;
  learn: number | null;
  review: number | null;
  total: number | null;
};

export type AnkiCardInfo = {
  cardId: number;
  type: number;
  queue: number;
};

function getAnkiConnectUrl(): string {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ANKI_CONNECT_URL) {
    return process.env.NEXT_PUBLIC_ANKI_CONNECT_URL;
  }
  return DEFAULT_ANKI_CONNECT_URL;
}

/**
 * Make a raw AnkiConnect request.
 */
export async function callAnki<T = unknown>(
  action: AnkiAction,
  params?: Record<string, unknown>
): Promise<T> {
  const url = getAnkiConnectUrl();
  const body: AnkiRequest = {
    action,
    version: 6,
    ...(params ? { params } : {}),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as AnkiResponse<T>;

  if (data.error) {
    throw new Error(`AnkiConnect error: ${data.error}`);
  }

  return data.result;
}

/**
 * Check whether AnkiConnect is reachable.
 */
export async function pingAnki(): Promise<boolean> {
  try {
    await callAnki("version");
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the card currently being reviewed in Anki.
 */
export async function getCurrentCard(): Promise<AnkiCard | null> {
  try {
    const result = await callAnki<AnkiCard>("guiCurrentCard");
    return result;
  } catch {
    return null;
  }
}

/**
 * Flip the current Anki card to its answer side.
 */
export async function flipCurrentCard(): Promise<void> {
  const result = await callAnki<boolean>("guiShowAnswer");
  if (result === false) {
    throw new Error("No card in review mode");
  }
}

/**
 * Grade the current Anki card. Must be called after the answer is shown.
 */
export async function gradeCurrentCard(ease: AnkiEase): Promise<void> {
  const result = await callAnki<boolean>("guiAnswerCard", { ease });
  if (result === false) {
    throw new Error("Could not grade card");
  }
}

/**
 * Get statistics for one or more decks.
 */
export async function getDeckStats(deckNames: string[]): Promise<DeckStats> {
  try {
    const result = await callAnki<Record<string, {
      new_count: number;
      learn_count: number;
      review_count: number;
      total_in_deck: number;
    }>>("getDeckStats", { decks: deckNames });

    const entry = Object.values(result)[0];
    if (!entry) {
      return { new: null, learn: null, review: null, total: null };
    }

    return {
      new: entry.new_count,
      learn: entry.learn_count,
      review: entry.review_count,
      total: entry.total_in_deck,
    };
  } catch {
    return { new: null, learn: null, review: null, total: null };
  }
}

/**
 * Determine whether a card is new, learning, or review.
 *
 * Anki's type/queue values:
 *   0 = new
 *   1 = learning
 *   2 = review
 *   3 = relearning / day learning
 */
export function classifyCardQueue(type: number, queue: number): AnkiCardQueue {
  if (type === 0 || queue === 0) return "new";
  if (type === 1 || type === 3 || queue === 1 || queue === 3) return "learning";
  if (type === 2 || queue === 2) return "review";
  return null;
}

/**
 * Get queue/type info for a specific card.
 */
export async function getCardInfo(cardId: number): Promise<AnkiCardInfo | null> {
  try {
    const result = await callAnki<AnkiCardInfo[]>("cardsInfo", {
      cards: [cardId],
    });
    return result[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Convenience helper: current card + deck stats + queue in one call.
 */
export async function getCurrentCardWithMeta(): Promise<{
  card: AnkiCard | null;
  queue: AnkiCardQueue;
  deckStats: DeckStats;
}> {
  const card = await getCurrentCard();
  if (!card) {
    return {
      card: null,
      queue: null,
      deckStats: { new: null, learn: null, review: null, total: null },
    };
  }

  const [info, deckStats] = await Promise.all([
    getCardInfo(card.cardId),
    card.deckName ? getDeckStats([card.deckName]) : Promise.resolve({
      new: null,
      learn: null,
      review: null,
      total: null,
    }),
  ]);

  const queue = info ? classifyCardQueue(info.type, info.queue) : null;

  return { card, queue, deckStats };
}
