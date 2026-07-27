"use client";

import { useEffect } from "react";
import { DrillShell } from "@/components/drills/drill-shell";
import { Button } from "@/components/ui/button";
import { useMidi } from "@/hooks/useMidi";
import { useAudio } from "@/hooks/useAudio";
import { noteName } from "@/lib/music-theory";

export default function MidiTestPage() {
  const {
    supported,
    connected,
    inputs,
    selectedInputId,
    setSelectedInputId,
    heldNotes,
    connect,
    error,
  } = useMidi();
  const { playChime, ready: audioReady } = useAudio();

  useEffect(() => {
    if (!connected && supported) {
      connect();
    }
  }, [connected, supported, connect]);

  useEffect(() => {
    if (heldNotes.length > 0) {
      playChime();
    }
  }, [heldNotes.length, playChime]);

  return (
    <DrillShell
      title="MIDI Test"
      subtitle="Verify that your MIDI keyboard and audio output are working."
    >
      <div className="space-y-6">
        {!supported && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error ?? "Web MIDI is not supported in this browser."}
          </div>
        )}

        {!audioReady && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            Audio context is not ready. Click anywhere on the page to enable audio.
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-heading text-base font-semibold">MIDI Input</h2>

          {inputs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {connected
                ? "No MIDI inputs detected. Plug in a keyboard and refresh."
                : "Connect to MIDI to see available inputs."}
            </p>
          ) : (
            <div className="space-y-3">
              <label className="text-sm text-muted-foreground">Selected device</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={selectedInputId ?? ""}
                onChange={(e) => setSelectedInputId(e.target.value)}
              >
                {inputs.map((input) => (
                  <option key={input.id} value={input.id}>
                    {input.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            className="mt-4"
            onClick={connect}
            disabled={!supported || connected}
          >
            {connected ? "Connected" : "Connect MIDI"}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-heading text-base font-semibold">Held Notes</h2>

          {heldNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Play a note on your MIDI keyboard to see it here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {heldNotes.map((note) => (
                <span
                  key={note}
                  className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                >
                  {noteName(note % 12)} {note}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          This page is a primitive-layer integration check. A chime plays on every
          note-on event.
        </p>
      </div>
    </DrillShell>
  );
}
