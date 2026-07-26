"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LegacyChordDrillEvent {
  id?: string;
  chord: string;
  ms: number;
  grade?: number | null;
  gradeLabel?: string | null;
  isRedo?: boolean;
  ts: number;
}

interface LegacyArpeggioEvent {
  chord: string;
  fromDeg: string;
  toDeg: string;
  ms: number;
  ts: number;
}

interface LegacyArpeggioMissEvent {
  chord: string;
  fromDeg: string;
  toDeg: string;
  played: string;
  ts: number;
}

interface LegacyRootCycleEvent {
  mode: "chord" | "arpeggio";
  label?: string;
  root?: string;
  ms: number;
  fromDeg?: string;
  toDeg?: string;
  ts: number;
}

interface FoundData {
  chordDrill: LegacyChordDrillEvent[];
  arpeggio: LegacyArpeggioEvent[];
  arpeggioMiss: LegacyArpeggioMissEvent[];
  rootCycle: LegacyRootCycleEvent[];
}

interface ImportReport {
  chordDrillCount: number;
  arpeggioCount: number;
  arpeggioMissCount: number;
  rootCycleCount: number;
}

interface ExportedTrackingData {
  version?: number;
  exportedAt?: number;
  source?: string;
  chordDrill?: LegacyChordDrillEvent[];
  arpeggio?: LegacyArpeggioEvent[];
  arpeggioMiss?: LegacyArpeggioMissEvent[];
  rootCycle?: LegacyRootCycleEvent[];
}

const STORAGE_KEYS = {
  chordDrill: "blocked-drill-first-chord-log",
  arpeggio: "blocked-drill-arpeggio-log",
  arpeggioMiss: "blocked-drill-arpeggio-miss-log",
  rootCycle: "blocked-drill-rootcycle-log",
};

function parse<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadFoundData(): FoundData | null {
  if (typeof window === "undefined") return null;
  const data: FoundData = {
    chordDrill: parse<LegacyChordDrillEvent>(localStorage.getItem(STORAGE_KEYS.chordDrill)),
    arpeggio: parse<LegacyArpeggioEvent>(localStorage.getItem(STORAGE_KEYS.arpeggio)),
    arpeggioMiss: parse<LegacyArpeggioMissEvent>(localStorage.getItem(STORAGE_KEYS.arpeggioMiss)),
    rootCycle: parse<LegacyRootCycleEvent>(localStorage.getItem(STORAGE_KEYS.rootCycle)),
  };
  const total =
    data.chordDrill.length +
    data.arpeggio.length +
    data.arpeggioMiss.length +
    data.rootCycle.length;
  return total > 0 ? data : null;
}

function normalizeRootCycleEvent(e: LegacyRootCycleEvent) {
  let quality: string | undefined;
  if (e.mode === "chord" && e.label && e.root && e.label.startsWith(e.root)) {
    quality = e.label.slice(e.root.length);
  }
  return {
    mode: e.mode,
    label: e.label,
    root: e.root,
    quality,
    fromDeg: e.fromDeg,
    toDeg: e.toDeg,
    reactionTimeMs: e.ms,
    timestamp: e.ts,
  };
}

function normalizeGrade(label?: string | null): string | undefined {
  if (!label) return undefined;
  const map: Record<string, string> = {
    Again: "Again",
    Hard: "Hard",
    Good: "Good",
    Easy: "Easy",
  };
  return map[label] || undefined;
}

function toImportArgs(data: FoundData) {
  return {
    chordDrillEvents: data.chordDrill.map((e) => ({
      chord: e.chord,
      reactionTimeMs: e.ms,
      grade: normalizeGrade(e.gradeLabel),
      redo: !!e.isRedo,
      timestamp: e.ts,
    })),
    arpeggioEvents: data.arpeggio.map((e) => ({
      chord: e.chord,
      fromDeg: e.fromDeg,
      toDeg: e.toDeg,
      reactionTimeMs: e.ms,
      timestamp: e.ts,
    })),
    arpeggioMissEvents: data.arpeggioMiss.map((e) => ({
      chord: e.chord,
      fromDeg: e.fromDeg,
      toDeg: e.toDeg,
      played: e.played,
      timestamp: e.ts,
    })),
    rootCycleEvents: data.rootCycle.map(normalizeRootCycleEvent),
  };
}

function parseExportFile(json: unknown): FoundData {
  const data = json as ExportedTrackingData;
  return {
    chordDrill: Array.isArray(data.chordDrill) ? data.chordDrill : [],
    arpeggio: Array.isArray(data.arpeggio) ? data.arpeggio : [],
    arpeggioMiss: Array.isArray(data.arpeggioMiss) ? data.arpeggioMiss : [],
    rootCycle: Array.isArray(data.rootCycle) ? data.rootCycle : [],
  };
}

function totalEntries(data: FoundData) {
  return data.chordDrill.length + data.arpeggio.length + data.arpeggioMiss.length + data.rootCycle.length;
}

export function ImportLocalStorage() {
  const [found, setFound] = useState<FoundData | null>(loadFoundData);
  const [status, setStatus] = useState<"idle" | "importing" | "done" | "error">("idle");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importData = useMutation(api.tracking.bulkImportTracking);

  const runImport = useCallback(
    async (data: FoundData, clearLegacyKeys: boolean) => {
      setStatus("importing");
      setFileError(null);
      try {
        const result = await importData(toImportArgs(data));
        if (clearLegacyKeys) {
          Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
        }
        setReport(result as ImportReport);
        setFound(null);
        setStatus("done");
      } catch (err) {
        console.error("Import failed", err);
        setStatus("error");
      }
    },
    [importData]
  );

  async function handleImportLocal() {
    if (!found) return;
    await runImport(found, true);
  }

  function handleSkip() {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setFound(null);
  }

  async function handleFile(file: File) {
    setFileError(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const data = parseExportFile(json);
      if (totalEntries(data) === 0) {
        setFileError("That file doesn't contain any tracking entries.");
        return;
      }
      await runImport(data, false);
    } catch {
      setFileError("Could not read that file. Make sure it's a valid Reflex Drill EXT export.");
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

  if (status === "done" && report) {
    const total =
      report.chordDrillCount +
      report.arpeggioCount +
      report.arpeggioMissCount +
      report.rootCycleCount;
    return (
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Import complete
          </CardTitle>
          <CardDescription>
            Imported {total} practice {total === 1 ? "entry" : "entries"} from Reflex Drill EXT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <li className="flex justify-between rounded-lg border border-border/50 bg-card px-3 py-2">
              <span className="text-muted-foreground">Chord Drill</span>
              <span className="font-medium">{report.chordDrillCount}</span>
            </li>
            <li className="flex justify-between rounded-lg border border-border/50 bg-card px-3 py-2">
              <span className="text-muted-foreground">Arpeggios</span>
              <span className="font-medium">{report.arpeggioCount}</span>
            </li>
            <li className="flex justify-between rounded-lg border border-border/50 bg-card px-3 py-2">
              <span className="text-muted-foreground">Arpeggio misses</span>
              <span className="font-medium">{report.arpeggioMissCount}</span>
            </li>
            <li className="flex justify-between rounded-lg border border-border/50 bg-card px-3 py-2">
              <span className="text-muted-foreground">Root Cycling</span>
              <span className="font-medium">{report.rootCycleCount}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Import practice history</CardTitle>
        <CardDescription>
          Bring your Reflex Drill EXT tracking data into Piano Suite so it syncs across devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {found && totalEntries(found) > 0 && (
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Found {totalEntries(found)} legacy practice {totalEntries(found) === 1 ? "entry" : "entries"} from
              Reflex Drill EXT in this browser.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleImportLocal} disabled={status === "importing"}>
                {status === "importing" ? "Importing…" : "Import from this browser"}
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
            Drag and drop{" "}
            <code className="rounded bg-muted px-1 py-0.5">reflex-drill-tracking-export.json</code>{" "}
            here, or click to browse.
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
