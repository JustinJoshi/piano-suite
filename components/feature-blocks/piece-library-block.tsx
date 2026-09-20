"use client";

import { useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  normalizePieceLibraryConfig,
  type PieceLibraryConfig,
} from "@/lib/feature-blocks/piece-library/config";
import {
  notesFromParsedMidi,
  streamDurationMs,
  type HandAssignment,
} from "@/lib/feature-blocks/piece-library/adapt";
import { useRuntimeSource } from "@/hooks/useRuntimeSource";
import { parseMidiFile, type ParsedMidi } from "@/lib/music-player";

/**
 * Piece library block: source UI. Upload a MIDI file and the block adapts
 * it into the page stream via `useRuntimeSource`. The file lives in component
 * state — block config is JSON-only, so audio data never serializes into a
 * page. Hands are never guessed: left/right track assignment is an explicit
 * user action, local to the uploaded file.
 */

const UNASSIGNED = "__none__";

function trackOption(
  parsed: ParsedMidi | null,
  index: number
): { value: string; label: string } {
  const track = parsed?.tracks?.find((t) => t.index === index);
  return { value: String(index), label: track?.name ?? `Track ${index}` };
}

export function PieceLibraryBlock(
  raw: Record<string, unknown> & { blockId?: string }
) {
  // Memoised on the raw props object: a fresh config object every render
  // would invalidate the notes memo, and through useRuntimeSource that would
  // re-compose the page's stream on every render.
  const config: PieceLibraryConfig = useMemo(
    () => normalizePieceLibraryConfig(raw),
    [raw]
  );
  const [parsed, setParsed] = useState<ParsedMidi | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [assignment, setAssignment] = useState<HandAssignment>({
    leftTrack: null,
    rightTrack: null,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoised derived notes; no registration loop here — useRuntimeSource
  // owns the single effect that publishes them to the page stream.
  const notes = useMemo(() => {
    if (!parsed) return [];
    const hasAnyAssignment =
      assignment.leftTrack !== null || assignment.rightTrack !== null;
    return notesFromParsedMidi(
      parsed,
      config,
      hasAnyAssignment ? assignment : undefined
    );
  }, [parsed, config, assignment]);

  const { hasRuntime } = useRuntimeSource(raw.blockId ?? "", notes);

  async function onFile(file: File) {
    setError("");
    try {
      const buffer = await file.arrayBuffer();
      const result = parseMidiFile(buffer);
      if (result.kind !== "midi") {
        setError("That file has no MIDI notes to practice.");
        return;
      }
      // Assignments are local to the uploaded file; a new file must never
      // inherit the previous file's track numbers.
      setAssignment({ leftTrack: null, rightTrack: null });
      setParsed(result);
      setFileName(file.name);
    } catch {
      setError("Could not read that file as MIDI.");
    }
  }

  const trackCount = parsed?.notes.length
    ? new Set(parsed.notes.map((n) => n.trackIndex)).size
    : 0;
  const handFiltered =
    config.handFilter !== "both" &&
    assignment[config.handFilter === "left" ? "leftTrack" : "rightTrack"] ===
      null;

  const seconds = Math.round(streamDurationMs(notes) / 1000);

  return (
    <div className="space-y-3 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Piece library
        </span>
        {parsed && (
          <span className="text-xs text-muted-foreground">
            {config.role === "graded" ? "Practice part" : "Backing track"}
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".mid,.midi,audio/midi"
        className="hidden"
        data-testid="piece-file-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
        }}
      />
      <Button
        variant="outline"
        className="w-full"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" /> Upload MIDI
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {parsed ? (
        <>
          <p className="text-xs text-muted-foreground" data-testid="piece-summary">
            {fileName}: {notes.length} note{notes.length === 1 ? "" : "s"}
            {seconds > 0 ? `, about ${seconds}s` : ""}
            {hasRuntime
              ? ". Playing in the page stream below."
              : ". Feed a note roll or target display to practice it."}
          </p>

          {handFiltered && (
            <p className="text-xs text-muted-foreground" data-testid="assign-prompt">
              This page practices the{" "}
              {config.handFilter === "left" ? "left" : "right"} hand, but no
              track is assigned to it yet. Pick a track below to fill the
              practice stream.
            </p>
          )}

          {/* A single track cannot be split between two hands; hide selectors */}
          {trackCount > 1 && (
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="block text-xs font-medium text-muted-foreground">
                  Left hand track
                </span>
                <select
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                  data-testid="left-track-select"
                  aria-label="Left hand track"
                  value={
                    assignment.leftTrack === null
                      ? UNASSIGNED
                      : String(assignment.leftTrack)
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setAssignment((prev) => ({
                      ...prev,
                      leftTrack:
                        value === UNASSIGNED ? null : Number(value),
                    }));
                  }}
                >
                  <option value={UNASSIGNED}>Unassigned</option>
                  {Array.from({ length: trackCount }, (_, i) =>
                    trackOption(parsed, i)
                  ).map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={
                        assignment.rightTrack !== null &&
                        assignment.rightTrack !== assignment.leftTrack &&
                        opt.value === String(assignment.rightTrack)
                      }
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="block text-xs font-medium text-muted-foreground">
                  Right hand track
                </span>
                <select
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                  data-testid="right-track-select"
                  aria-label="Right hand track"
                  value={
                    assignment.rightTrack === null
                      ? UNASSIGNED
                      : String(assignment.rightTrack)
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setAssignment((prev) => ({
                      ...prev,
                      rightTrack:
                        value === UNASSIGNED ? null : Number(value),
                    }));
                  }}
                >
                  <option value={UNASSIGNED}>Unassigned</option>
                  {Array.from({ length: trackCount }, (_, i) =>
                    trackOption(parsed, i)
                  ).map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={
                        assignment.leftTrack !== null &&
                        assignment.leftTrack !== assignment.rightTrack &&
                        opt.value === String(assignment.leftTrack)
                      }
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Upload a .mid file to turn a real piece into a practice page.
        </p>
      )}
    </div>
  );
}
