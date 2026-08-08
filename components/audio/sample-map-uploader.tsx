"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseSampleFiles } from "@/lib/sample-map-kit";
import { generateKitId, saveSampleKit } from "@/lib/audio-upload";
import type { CustomKit } from "@/lib/audio-settings";
import type { SampleMapEntry } from "@/lib/sample-map-kit";

type SampleMapUploaderProps = {
  onSaved: (kit: CustomKit) => void;
};

export function SampleMapUploader({ onSaved }: SampleMapUploaderProps) {
  const [entries, setEntries] = useState<SampleMapEntry[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setEntries([]);
    setName("");
    setError(null);
    setLoading(true);

    try {
      const parsed = await parseSampleFiles(files);
      setEntries(parsed);
      if (parsed.length === 0) {
        setError(
          "No valid samples found. Name files like C4.wav, F#3.mp3, or 60.wav."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse sample files."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (entries.length === 0 || !name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const id = generateKitId();
      const kit = await saveSampleKit(
        id,
        name.trim(),
        entries.map((e) => ({ note: e.note, blob: e.blob }))
      );
      onSaved(kit);
      setEntries([]);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save kit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4" data-testid="sample-map-uploader">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted-foreground transition-colors hover:bg-muted/30">
        <Upload className="h-5 w-5" />
        <span>Drop audio files or a .zip here, or click to browse</span>
        <input
          type="file"
          accept=".wav,.mp3,.ogg,.m4a,.flac,.zip,audio/*"
          multiple
          onChange={handleFileChange}
          className="sr-only"
          data-testid="sample-map-file-input"
        />
      </label>

      {loading && entries.length === 0 && (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Parsing samples…
        </div>
      )}

      {entries.length > 0 && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Kit name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              data-testid="sample-map-kit-name"
            />
          </div>

          <div>
            <div className="mb-1 text-xs text-muted-foreground">
              Detected notes ({entries.length})
            </div>
            <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-border bg-background p-2">
              {entries.map((entry) => (
                <span
                  key={entry.note}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground"
                >
                  {entry.note}
                </span>
              ))}
            </div>
          </div>

          <Button
            onClick={() => void handleSave()}
            disabled={loading || !name.trim()}
            data-testid="sample-map-save-kit"
          >
            {loading && (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            )}
            Save and use
          </Button>
        </div>
      )}

      {error && (
        <p
          className="text-sm text-destructive"
          data-testid="sample-map-upload-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}
