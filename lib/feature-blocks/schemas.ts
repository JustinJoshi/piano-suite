import { normalizeMetronomeConfig } from "./metronome/config";
import { normalizeDrillTimerConfig } from "./drill-timer/config";
import { normalizeChordSetConfig } from "./chord-set/config";

/**
 * Server-safe validation for stored practice pages.
 *
 * This module must stay free of React / DOM imports so Convex functions can
 * bundle it (relative imports only — the Convex bundler does not resolve the
 * `@/` alias). The client also runs these checks before syncing.
 */

export const MAX_PAGE_TITLE_LENGTH = 80;
export const MAX_BLOCKS_PER_PAGE = 30;
export const MAX_BLOCK_CONFIG_BYTES = 8 * 1024;

type BlockNormalizer = (raw: unknown) => Record<string, unknown>;

const blockNormalizers: Record<string, BlockNormalizer> = {
  metronome: normalizeMetronomeConfig as BlockNormalizer,
  drillTimer: normalizeDrillTimerConfig as BlockNormalizer,
  chordSet: normalizeChordSetConfig as BlockNormalizer,
};

export type ValidatedBlock = {
  id: string;
  type: string;
  version: number;
  config: Record<string, unknown>;
};

export type ValidatedPage = {
  clientPageId: string;
  title: string;
  blocks: ValidatedBlock[];
  updatedAt: number;
};

function isFiniteInt(n: unknown, min: number, max: number): n is number {
  return (
    typeof n === "number" &&
    Number.isInteger(n) &&
    n >= min &&
    n <= max
  );
}

export function normalizePageTitle(raw: unknown): string {
  if (typeof raw !== "string") return "My Practice Page";
  const trimmed = raw.trim().slice(0, MAX_PAGE_TITLE_LENGTH);
  return trimmed === "" ? "My Practice Page" : trimmed;
}

export function isValidClientPageId(raw: unknown): raw is string {
  return typeof raw === "string" && raw.length > 0 && raw.length <= 64;
}

/**
 * Validates and sanitizes one stored block. Unknown types are dropped (the
 * renderer also skips them) so stale/unregistered content cannot accumulate.
 */
export function normalizeStoredBlock(raw: unknown): ValidatedBlock | null {
  if (typeof raw !== "object" || raw === null) return null;
  const block = raw as Record<string, unknown>;

  const id = block.id;
  if (typeof id !== "string" || id.length === 0 || id.length > 64) {
    return null;
  }

  const type = block.type;
  if (typeof type !== "string") {
    return null;
  }
  const normalize = blockNormalizers[type];
  if (!normalize) return null;

  try {
    const serialized = JSON.stringify(block.config ?? {});
    if (serialized.length > MAX_BLOCK_CONFIG_BYTES) return null;
  } catch {
    return null;
  }

  const version = block.version;
  return {
    id,
    type,
    version: isFiniteInt(version, 1, 1000) ? version : 1,
    config: normalize(block.config),
  };
}

/**
 * Validates a full page envelope. Returns null when the payload is not a
 * storable page (bad ids, too many blocks, no valid blocks shape at all).
 */
export function normalizeStoredPage(raw: unknown): ValidatedPage | null {
  if (typeof raw !== "object" || raw === null) return null;
  const page = raw as Record<string, unknown>;

  if (!isValidClientPageId(page.clientPageId)) return null;
  if (!Array.isArray(page.blocks)) return null;
  if (page.blocks.length > MAX_BLOCKS_PER_PAGE) return null;
  if (typeof page.updatedAt !== "number" || !Number.isFinite(page.updatedAt)) {
    return null;
  }
  const updatedAt = Math.floor(page.updatedAt);

  const blocks: ValidatedBlock[] = [];
  for (const rawBlock of page.blocks) {
    const block = normalizeStoredBlock(rawBlock);
    if (block) blocks.push(block);
  }

  return {
    clientPageId: page.clientPageId,
    title: normalizePageTitle(page.title),
    blocks,
    updatedAt,
  };
}
