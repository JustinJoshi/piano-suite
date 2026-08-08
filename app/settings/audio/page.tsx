"use client";

import { AUDIO_PRESET_LABELS, type AudioPreset } from "@/lib/audio-settings";
import { useAudioSettings } from "@/hooks/useAudioSettings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AudioSettingsPage() {
  const {
    settings,
    setEnabled,
    setVolume,
    setPreset,
    setSustain,
    engineState,
  } = useAudioSettings();

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Audio
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure the piano sound that plays when you press keys on your MIDI
            keyboard. Preferences save in this browser and sync when signed in.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">
              MIDI sounds
            </CardTitle>
            <CardDescription>
              Play a piano sample when MIDI notes are pressed anywhere on the
              site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="mt-0.5 accent-primary"
                data-testid="audio-master-toggle"
              />
              <span>
                <span className="font-medium">Enable MIDI sounds</span>
                <span className="mt-1 block text-muted-foreground">
                  You can also toggle this quickly from the MIDI connection bar
                  on any drill page.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Sustain</CardTitle>
            <CardDescription>
              Hold notes after you release the keys, like a piano sustain pedal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={settings.sustain}
                onChange={(e) => setSustain(e.target.checked)}
                className="mt-0.5 accent-primary"
                data-testid="audio-sustain-toggle"
              />
              <span>
                <span className="font-medium">Enable sustain</span>
                <span className="mt-1 block text-muted-foreground">
                  You can also toggle this quickly from the MIDI connection bar
                  on any drill page.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Volume</CardTitle>
            <CardDescription>
              Master volume for the piano sound.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Output level</span>
                <span className="font-mono text-foreground">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={settings.volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="Volume"
                data-testid="audio-volume"
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Preset</CardTitle>
            <CardDescription>
              Choose the built-in piano sound. More options and custom
              soundfonts are coming soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {engineState === "loading" && (
              <div
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground"
                data-testid="audio-preset-loading"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading samples…
              </div>
            )}
            <select
              value={settings.preset}
              onChange={(e) => setPreset(e.target.value as AudioPreset)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              data-testid="audio-preset"
            >
              {(Object.keys(AUDIO_PRESET_LABELS) as AudioPreset[]).map(
                (preset) => (
                  <option key={preset} value={preset}>
                    {AUDIO_PRESET_LABELS[preset]}
                  </option>
                )
              )}
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Custom soundfonts
            </CardTitle>
            <CardDescription>
              Upload your own .sf2 files or sample packs to use as the piano
              sound.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Custom instrument support is on the way. For now, pick one of the
              built-in presets above.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
