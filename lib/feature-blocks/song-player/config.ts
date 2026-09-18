import type { FieldDescriptor } from "../types";
import { toBool } from "../coerce";

export type SongPlayerConfig = {
  /** Show the upload button inside the player. */
  showUpload: boolean;
  /** Do not start playback when a file finishes loading. */
  startPaused: boolean;
};

export const songPlayerDefaultConfig: SongPlayerConfig = {
  showUpload: true,
  startPaused: true,
};

export function normalizeSongPlayerConfig(raw: unknown): SongPlayerConfig {
  const partial = typeof raw === "object" && raw !== null ? raw : {};
  const r = partial as Record<string, unknown>;
  return {
    showUpload: toBool(r.showUpload, songPlayerDefaultConfig.showUpload),
    startPaused: toBool(r.startPaused, songPlayerDefaultConfig.startPaused),
  };
}

export const songPlayerFields: FieldDescriptor[] = [
  {
    kind: "toggle",
    key: "showUpload",
    label: "Show upload button",
    helperText: "Let the user load a file from the block",
  },
  {
    kind: "toggle",
    key: "startPaused",
    label: "Start paused",
    helperText: "Do not auto-play when a file loads",
  },
];
