"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

export function ImportLocalStorage() {
  const [found, setFound] = useState<FoundData | null>(loadFoundData);
  const [status, setStatus] = useState<"idle" | "importing" | "done" | "error">("idle");
  const importData = useMutation(api.tracking.bulkImportTracking);

  if (!found || status === "done") return null;

  const total =
    found.chordDrill.length +
    found.arpeggio.length +
    found.arpeggioMiss.length +
    found.rootCycle.length;

  async function handleImport() {
    setStatus("importing");
    try {
      await importData({
        chordDrillEvents: found!.chordDrill.map((e) => ({
          chord: e.chord,
          reactionTimeMs: e.ms,
          grade: normalizeGrade(e.gradeLabel),
          redo: !!e.isRedo,
          timestamp: e.ts,
        })),
        arpeggioEvents: found!.arpeggio.map((e) => ({
          chord: e.chord,
          fromDeg: e.fromDeg,
          toDeg: e.toDeg,
          reactionTimeMs: e.ms,
          timestamp: e.ts,
        })),
        arpeggioMissEvents: found!.arpeggioMiss.map((e) => ({
          chord: e.chord,
          fromDeg: e.fromDeg,
          toDeg: e.toDeg,
          played: e.played,
          timestamp: e.ts,
        })),
        rootCycleEvents: found!.rootCycle.map(normalizeRootCycleEvent),
      });
      // Clear legacy keys so the import card doesn't reappear.
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
      setFound(null);
      setStatus("done");
    } catch (err) {
      console.error("Import failed", err);
      setStatus("error");
    }
  }

  function handleSkip() {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setFound(null);
    setStatus("done");
  }

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Import local tracking data?</CardTitle>
        <CardDescription>
          Found {total} legacy practice entries from Reflex Drill EXT in this browser.
          Import them to Convex so they sync across devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button onClick={handleImport} disabled={status === "importing"}>
          {status === "importing" ? "Importing…" : "Import to cloud"}
        </Button>
        <Button variant="ghost" onClick={handleSkip} disabled={status === "importing"}>
          Skip and delete local data
        </Button>
        {status === "error" && (
          <span className="text-sm text-destructive">Import failed. Check console.</span>
        )}
      </CardContent>
    </Card>
  );
}
