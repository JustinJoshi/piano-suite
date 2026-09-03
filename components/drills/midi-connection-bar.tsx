"use client";

import Link from "next/link";
import { Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioSettings } from "@/hooks/useAudioSettings";
import { KeyboardDisplayBlock } from "@/components/feature-blocks/keyboard-display-block";
import { keyboardDisplayDefaultConfig } from "@/lib/feature-blocks/keyboard-display/config";

export type MidiConnectionBarProps = {
  supported: boolean;
  connected: boolean;
  error: string | null;
  inputs: { id: string; name: string }[];
  selectedInputId: string | null;
  onSelectInput: (id: string) => void;
  onConnect: () => void;
};

/** On-screen keyboard shown whenever no MIDI hardware is playing. */
const fallbackKeyboard = (
  <KeyboardDisplayBlock {...keyboardDisplayDefaultConfig} />
);

/**
 * Reusable MIDI input connection bar for drill pages.
 *
 * Shows a connect button when disconnected, a device selector when multiple
 * inputs are available, or a simple "Connected" status for a single device.
 * Without hardware (or on browsers without Web MIDI), an on-screen keyboard
 * takes over so every drill stays playable.
 */
export function MidiConnectionBar({
  supported,
  connected,
  error,
  inputs,
  selectedInputId,
  onSelectInput,
  onConnect,
}: MidiConnectionBarProps) {
  const { settings, setEnabled, setSustain, engineState } = useAudioSettings();

  if (!supported) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          {error ?? "Web MIDI is not supported in this browser."} You can
          still play with the on-screen keyboard below.
        </div>
        {fallbackKeyboard}
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button onClick={onConnect} data-testid="connect-midi-btn">
            Connect MIDI Keyboard
          </Button>
          <span className="text-xs text-muted-foreground">
            No controller? Play the keyboard below or type A W S E D…
          </span>
        </div>
        {fallbackKeyboard}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="inline-flex items-center gap-1.5 text-success">
        <span className="h-2 w-2 rounded-full bg-success" />
        Connected
      </span>

      {inputs.length === 0 ? (
        <span className="text-muted-foreground">No devices found</span>
      ) : inputs.length === 1 ? (
        <span className="text-muted-foreground">{inputs[0].name}</span>
      ) : (
        <select
          className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-ring"
          value={selectedInputId ?? ""}
          onChange={(e) => onSelectInput(e.target.value)}
          data-testid="midi-input-select"
        >
          {inputs.map((input) => (
            <option key={input.id} value={input.id}>
              {input.name}
            </option>
          ))}
        </select>
      )}

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="accent-primary"
          data-testid="midi-sound-toggle"
        />
        <span className="text-xs">Use MIDI sounds</span>
      </label>

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground">
        <input
          type="checkbox"
          checked={settings.sustain}
          onChange={(e) => setSustain(e.target.checked)}
          className="accent-primary"
          data-testid="midi-sustain-toggle"
        />
        <span className="text-xs">Sustain</span>
      </label>

      {engineState === "loading" && (
        <span
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          data-testid="midi-audio-loading"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading
        </span>
      )}

      <Link
        href="/settings/audio"
        aria-label="Audio settings"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        data-testid="midi-audio-settings-link"
      >
        <Settings className="h-4 w-4" />
      </Link>
    </div>
  );
}
