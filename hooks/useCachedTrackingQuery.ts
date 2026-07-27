"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";

const CACHE_NAMESPACE = "piano-suite-tracking";
const CACHE_VERSION = 1;

interface CacheEnvelope<T> {
  data: T;
  cachedAt: number;
}

function buildKey(userId: string, name: string) {
  return `${CACHE_NAMESPACE}:v${CACHE_VERSION}:${userId}:${name}`;
}

function readCache<T>(userId: string, name: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(buildKey(userId, name));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    return parsed.data;
  } catch {
    return undefined;
  }
}

function writeCache<T>(userId: string, name: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    const envelope: CacheEnvelope<T> = { data, cachedAt: Date.now() };
    localStorage.setItem(buildKey(userId, name), JSON.stringify(envelope));
  } catch (err) {
    // Ignore quota/security errors so the UI keeps working.
    console.warn("Failed to write tracking cache", err);
  }
}

function clearCache(userId: string, name: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(buildKey(userId, name));
  } catch {
    // ignore
  }
}

/**
 * Persist tracking query results in localStorage so tab switches feel instant.
 *
 * Returns live Convex data when available, otherwise falls back to the last
 * cached value for the current user. The hook also exposes a helper to clear
 * the cache optimistically after mutations.
 */
export function useCachedTrackingQuery<T>(name: string, liveData: T | undefined) {
  const { user } = useUser();
  const userId = user?.id;

  // Bumps when we clear the cache so the memo below re-reads from storage.
  const [cacheGeneration, setCacheGeneration] = useState(0);

  // Read from localStorage synchronously. This is fast and lets us show cached
  // data on the very first render after a tab switch. cacheGeneration is
  // intentionally a dependency so clearing the cache forces a re-read.
  const cached = useMemo(() => {
    if (!userId) return undefined;
    return readCache<T>(userId, name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, name, cacheGeneration]);

  // Persist fresh data whenever Convex delivers it.
  useEffect(() => {
    if (liveData !== undefined && userId) {
      writeCache(userId, name, liveData);
    }
  }, [liveData, userId, name]);

  const clear = useCallback(() => {
    if (userId) {
      clearCache(userId, name);
      setCacheGeneration((g) => g + 1);
    }
  }, [userId, name]);

  const data = liveData ?? cached;
  const isLoading = liveData === undefined && cached === undefined;

  return { data, isLoading, clear };
}
