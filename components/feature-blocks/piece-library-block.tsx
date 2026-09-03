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
} from "@/lib/feature-blocks/piece-library/adapt";
import { parseMidiFile, type ParsedMidi } from "@/lib/music-player";

/**
 * Piece library block: source UI. Upload a MIDI file and the block adapts
 * it into the page stream. The file lives in component state — block config
 * is JSON-only, so audio data never serializes into a page.
 */
export function PieceLibraryBlock(raw: Record<string, unknown>) {
  const config: PieceLibraryConfig = normalizePieceLibraryConfig(raw);
  const [parsed, setParsed] = useState<ParsedMidi | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const notes = useMemo(
    () => (parsed ? notesFromParsedMidi(parsed, config) : []),
    [parsed, config]
  );

  async function onFile(file: File) {
    setError("");
    try {
      const buffer = await file.arrayBuffer();
      const result = parseMidiFile(buffer);
      if (result.kind !== "midi") {
        setError("That file has no MIDI notes to practice.");
        return;
      }
      setParsed(result);
      setFileName(file.name);
    } catch {
      setError("Could not read that file as MIDI.");
    }
  }

  const seconds = Math.round(streamDurationMs(notes) / 1000);

  return (
    <div className="space-y-3 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Piece library
        </span>
        {parsed && (
          <span className="text-xs text-muted-foreground">
            {config.role === "graded" ? "Graded" : "Accompaniment"}
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
        <p className="text-xs text-muted-foreground" data-testid="piece-summary">
          {fileName}: {notes.length} note{notes.length === 1 ? "" : "s"}
          {seconds > 0 ? `, about ${seconds}s` : ""}. Feed a note roll or
          target display to practice it.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Upload a .mid file to turn a real piece into a practice page.
        </p>
      )}
    </div>
  );
}
