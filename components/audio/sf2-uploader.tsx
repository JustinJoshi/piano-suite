"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseSf2Instruments } from "@/lib/sf2-kit";
import { generateKitId, saveSf2Kit } from "@/lib/audio-upload";
import type { CustomKit } from "@/lib/audio-settings";

type Sf2UploaderProps = {
  onSaved: (kit: CustomKit) => void;
};

export function Sf2Uploader({ onSaved }: Sf2UploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<string>("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setInstruments([]);
    setSelectedInstrument("");
    setName(selected.name.replace(/\.sf2$/i, ""));
    setError(null);
    setLoading(true);

    try {
      const buffer = await selected.arrayBuffer();
      const names = await parseSf2Instruments(buffer);
      setInstruments(names);
      if (names.length > 0) {
        setSelectedInstrument(names[0]!);
      } else {
        setError("No instruments found in this file.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse SF2 file.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!file || !selectedInstrument || !name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const id = generateKitId();
      const kit = await saveSf2Kit(id, name.trim(), file, selectedInstrument);
      onSaved(kit);
      setFile(null);
      setInstruments([]);
      setSelectedInstrument("");
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save kit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4" data-testid="sf2-uploader">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted-foreground transition-colors hover:bg-muted/30">
        <Upload className="h-5 w-5" />
        <span>Drop a .sf2 file here or click to browse</span>
        <input
          type="file"
          accept=".sf2"
          onChange={handleFileChange}
          className="sr-only"
          data-testid="sf2-file-input"
        />
      </label>

      {loading && !file && (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Parsing SF2…
        </div>
      )}

      {file && instruments.length > 0 && (
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
              data-testid="sf2-kit-name"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Instrument preset
            </label>
            <select
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              data-testid="sf2-instrument-select"
            >
              {instruments.map((instrument) => (
                <option key={instrument} value={instrument}>
                  {instrument}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={() => void handleSave()}
            disabled={loading || !selectedInstrument || !name.trim()}
            data-testid="sf2-save-kit"
          >
            {loading && (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            )}
            Save and use
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" data-testid="sf2-upload-error">
          {error}
        </p>
      )}
    </div>
  );
}
