"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { parseChord } from "@/lib/music-theory";
import {
  getCurrentCardWithMeta,
  type AnkiCard,
  type DeckStats,
  type AnkiCardQueue,
} from "@/lib/anki";

export type ParsedAnkiCard = {
  card: AnkiCard;
  chordSymbol: string | null;
  queue: AnkiCardQueue;
  deckStats: DeckStats;
};

export type AnkiSyncStatus = "off" | "connecting" | "connected" | "no-card" | "error";

export type AnkiSyncOptions = {
  enabled: boolean;
  pollIntervalMs?: number;
  onCard?: (card: ParsedAnkiCard | null) => void;
  onFirstConnect?: () => void;
};

type AnkiSyncState = {
  connectionStatus: Exclude<AnkiSyncStatus, "off">;
  parsedCard: ParsedAnkiCard | null;
  deckStats: DeckStats | null;
};

type AnkiSyncAction =
  | { type: "connecting" }
  | { type: "error" }
  | { type: "no-card"; deckStats: DeckStats }
  | { type: "connected"; parsedCard: ParsedAnkiCard };

const initialState: AnkiSyncState = {
  connectionStatus: "connecting",
  parsedCard: null,
  deckStats: null,
};

function reducer(state: AnkiSyncState, action: AnkiSyncAction): AnkiSyncState {
  switch (action.type) {
    case "connecting":
      return { ...state, connectionStatus: "connecting" };
    case "error":
      return { connectionStatus: "error", parsedCard: null, deckStats: null };
    case "no-card":
      return {
        connectionStatus: "no-card",
        parsedCard: null,
        deckStats: action.deckStats,
      };
    case "connected":
      return {
        connectionStatus: "connected",
        parsedCard: action.parsedCard,
        deckStats: action.parsedCard.deckStats,
      };
    default:
      return state;
  }
}

/**
 * React hook that polls Anki for the current review card and parses its chord.
 *
 * Mirrors the behavior of Reflex Drill EXT's "Follow card" feature:
 * - polls AnkiConnect on a fixed interval
 * - detects card changes
 * - parses the chord symbol from the card front
 * - fetches deck stats and card queue/type
 * - optionally fires a one-time `onFirstConnect` callback when the first
 *   successful connection happens
 */
export function useAnkiSync(options: AnkiSyncOptions) {
  const { enabled, pollIntervalMs = 800, onCard, onFirstConnect } = options;

  const [state, dispatch] = useReducer(reducer, initialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCardIdRef = useRef<number | null>(null);
  const lastParsedCardRef = useRef<ParsedAnkiCard | null>(null);
  const firstConnectRef = useRef<boolean>(false);

  const poll = useCallback(async () => {
    if (!enabled) return;

    dispatch({ type: "connecting" });

    const meta = await getCurrentCardWithMeta();

    if (!meta.card) {
      dispatch({ type: "error" });
      lastCardIdRef.current = null;
      return;
    }

    if (!firstConnectRef.current) {
      firstConnectRef.current = true;
      onFirstConnect?.();
    }

    const cardId = meta.card.cardId;
    if (cardId === lastCardIdRef.current && lastParsedCardRef.current) {
      // Card hasn't changed; just refresh connection status.
      dispatch({ type: "connected", parsedCard: lastParsedCardRef.current });
      return;
    }

    lastCardIdRef.current = cardId;

    const parsed = parseChord(meta.card.question);
    const chordSymbol = parsed?.fullSymbol ?? null;

    if (parsed) {
      const next: ParsedAnkiCard = {
        card: meta.card,
        chordSymbol,
        queue: meta.queue,
        deckStats: meta.deckStats,
      };
      lastParsedCardRef.current = next;
      dispatch({ type: "connected", parsedCard: next });
      onCard?.(next);
    } else {
      lastParsedCardRef.current = null;
      dispatch({ type: "no-card", deckStats: meta.deckStats });
      onCard?.(null);
    }
  }, [enabled, onCard, onFirstConnect]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      lastCardIdRef.current = null;
      firstConnectRef.current = false;
      return;
    }

    poll();
    intervalRef.current = setInterval(poll, pollIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, pollIntervalMs, poll]);

  const status: AnkiSyncStatus = enabled ? state.connectionStatus : "off";

  return {
    status,
    parsedCard: state.parsedCard,
    deckStats: state.deckStats,
    isFollowing: enabled,
    refresh: poll,
  };
}
