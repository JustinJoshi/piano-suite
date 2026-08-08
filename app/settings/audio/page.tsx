"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useAudioSettings } from "@/hooks/useAudioSettings";
import { PresetPicker } from "@/components/audio/preset-picker";
import { SoundfontBrowser } from "@/components/audio/soundfont-browser";
import { ExternalSoundfontsCard } from "@/components/audio/external-soundfonts-card";
import { clearAudioCache } from "@/lib/audio-engine";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
            Configure the sound that plays when you press keys on your MIDI
            keyboard. Preferences save in this browser and sync when signed in.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">
              MIDI sounds
            </CardTitle>
            <CardDescription>
              Play a sample when MIDI notes are pressed anywhere on the site.
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
              Master volume for the MIDI sound.
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
              Choose a curated instrument. Changes apply immediately.
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
            <PresetPicker
              activePreset={settings.preset}
              onSelect={setPreset}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Browse all soundfonts
            </CardTitle>
            <CardDescription>
              Explore every General MIDI instrument from smplr&apos;s built-in
              kits, plus electric pianos and mallets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SoundfontBrowser
              activePreset={settings.preset}
              onSelect={setPreset}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Find more soundfonts
            </CardTitle>
            <CardDescription>
              Download .sf2 files or sample packs from these external libraries
              to use with the custom kit uploader coming soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExternalSoundfontsCard />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Audio cache
            </CardTitle>
            <CardDescription>
              Clear downloaded samples from this browser. They will be
              re-downloaded the next time you play.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => void clearAudioCache()}
              data-testid="audio-clear-cache"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear audio cache
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Custom soundfonts
            </CardTitle>
            <CardDescription>
              Upload your own .sf2 files or sample packs to use as the MIDI
              sound.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Custom instrument support is on the way. For now, pick one of the
              built-in presets or browse the full soundfont catalog above.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
