"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const LEGACY_STORAGE_KEY = "technique-habit-log-v1";

type LegacyLog = Record<string, { bpm: number; notes?: string; exercise?: string }>;

type ExportedTechniqueData = {
  version?: number;
  exportedAt?: number;
  source?: string;
  log?: LegacyLog;
};

function loadLegacyLog(): LegacyLog | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LegacyLog;
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function logToSessions(log: LegacyLog) {
  return Object.entries(log).map(([date, entry]) => ({
    date,
    exercise: entry.exercise ?? "Technique practice",
    bpm: entry.bpm,
    notes: entry.notes,
    timestamp: Date.now(),
  }));
}

function parseExportFile(json: unknown): LegacyLog | null {
  const data = json as ExportedTechniqueData;
  if (data && typeof data.log === "object" && data.log !== null) {
    return Object.keys(data.log).length > 0 ? data.log : null;
  }
  return null;
}

export function ImportTechnique() {
  const [found, setFound] = useState<LegacyLog | null>(loadLegacyLog);
  const [status, setStatus] = useState<"idle" | "importing" | "done" | "error">("idle");
  const [count, setCount] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importSessions = useMutation(api.technique.bulkImportTechniqueSessions);

  const runImport = useCallback(
    async (log: LegacyLog, clearLegacyKey: boolean) => {
      setStatus("importing");
      setFileError(null);
      try {
        const result = await importSessions({ sessions: logToSessions(log) });
        if (clearLegacyKey) {
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
        setCount(result.count);
        setFound(null);
        setStatus("done");
      } catch (err) {
        console.error("Technique import failed", err);
        setStatus("error");
      }
    },
    [importSessions]
  );

  async function handleImportLocal() {
    if (!found) return;
    await runImport(found, true);
  }

  function handleSkip() {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setFound(null);
  }

  async function handleFile(file: File) {
    setFileError(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const log = parseExportFile(json);
      if (!log) {
        setFileError("That file doesn't contain any technique history.");
        return;
      }
      await runImport(log, false);
    } catch {
      setFileError("Could not read that file. Make sure it's a valid technique tracker export.");
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (e.target) e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  if (status === "done" && count !== null) {
    return (
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Import complete
          </CardTitle>
          <CardDescription>
            Imported {count} technique {count === 1 ? "session" : "sessions"} from Reflex Drill
            EXT.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Upload technique history to Pro</CardTitle>
        <CardDescription>
          Import Free-tier browser history or a Reflex Drill EXT export so session streaks sync
          across devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {found && Object.keys(found).length > 0 && (
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Found {Object.keys(found).length} technique{" "}
              {Object.keys(found).length === 1 ? "session" : "sessions"} in this browser (Free
              local history and/or Reflex Drill EXT).
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleImportLocal} disabled={status === "importing"}>
                {status === "importing" ? "Uploading…" : "Upload to Pro sync"}
              </Button>
              <Button variant="ghost" onClick={handleSkip} disabled={status === "importing"}>
                Skip and delete local data
              </Button>
            </div>
          </div>
        )}

        <div
          className={cn(
            "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/10"
              : "border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Import from export file</p>
          <p className="text-xs text-muted-foreground">
            Drag and drop a <code className="rounded bg-muted px-1 py-0.5">.json</code> export here,
            or click to browse.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={onFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => fileInputRef.current?.click()}
            disabled={status === "importing"}
          >
            Choose file
          </Button>
        </div>

        {fileError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {fileError}
          </div>
        )}
        {status === "error" && !fileError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            Import failed. Check the console for details.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
