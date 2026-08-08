"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useAudioSettings } from "@/hooks/useAudioSettings";
import { PresetPicker } from "@/components/audio/preset-picker";
import { SoundfontBrowser } from "@/components/audio/soundfont-browser";
import { ExternalSoundfontsCard } from "@/components/audio/external-soundfonts-card";
import { CustomKitCard } from "@/components/audio/custom-kit-card";
import { Sf2Uploader } from "@/components/audio/sf2-uploader";
import { SampleMapUploader } from "@/components/audio/sample-map-uploader";
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
    setCustomKit,
    engineState,
  } = useAudioSettings();

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Audio
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Configure the sound that plays when you press keys on your MIDI
            keyboard. Preferences save in this browser and sync when signed in.
          </p>
        </div>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="font-heading text-lg">
              MIDI sounds
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Play a sample when MIDI notes are pressed anywhere on the site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="flex cursor-pointer items-start gap-3 text-base text-foreground">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="mt-1 accent-primary"
                data-testid="audio-master-toggle"
              />
              <span className="space-y-1.5">
                <span className="block font-medium">Enable MIDI sounds</span>
                <span className="block text-sm leading-relaxed text-muted-foreground">
                  You can also toggle this quickly from the MIDI connection bar
                  on any drill page.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="font-heading text-lg">Sustain</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Hold notes after you release the keys, like a piano sustain pedal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="flex cursor-pointer items-start gap-3 text-base text-foreground">
              <input
                type="checkbox"
                checked={settings.sustain}
                onChange={(e) => setSustain(e.target.checked)}
                className="mt-1 accent-primary"
                data-testid="audio-sustain-toggle"
              />
              <span className="space-y-1.5">
                <span className="block font-medium">Enable sustain</span>
                <span className="block text-sm leading-relaxed text-muted-foreground">
                  You can also toggle this quickly from the MIDI connection bar
                  on any drill page.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="font-heading text-lg">Volume</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Master volume for the MIDI sound.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-sm">
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
          <CardHeader className="gap-2">
            <CardTitle className="font-heading text-lg">Preset</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Choose a curated instrument. Changes apply immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {engineState === "loading" && (
              <div
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
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
          <CardHeader className="gap-2">
            <CardTitle className="font-heading text-lg">
              Browse all soundfonts
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Explore every General MIDI instrument from smplr&apos;s built-in
              kits, plus electric pianos and mallets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <SoundfontBrowser
              activePreset={settings.preset}
              onSelect={setPreset}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="font-heading text-lg">
              Find more soundfonts
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Download .sf2 files or sample packs from these external libraries
              to use with the custom kit uploader.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ExternalSoundfontsCard />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="font-heading text-lg">
              Audio cache
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Clear downloaded samples from this browser. They will be
              re-downloaded the next time you play.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
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

        {settings.customKit && (
          <Card data-testid="active-custom-kit-card">
            <CardHeader className="gap-2">
              <CardTitle className="font-heading text-lg">
                Active custom kit
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Your uploaded kit is stored in this browser. The audio data does
                not sync to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <CustomKitCard
                kit={settings.customKit}
                isActive={settings.preset === "custom"}
                onUse={() => setPreset("custom")}
                onDelete={() => {
                  setCustomKit(null);
                  if (settings.preset === "custom") {
                    setPreset("splendid-grand-piano");
                  }
                }}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="font-heading text-lg">
              Upload .sf2 soundfont
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Load a SoundFont 2 file and pick one of its instruments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Sf2Uploader
              onSaved={(kit) => {
                setCustomKit(kit);
                setPreset("custom");
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="font-heading text-lg">
              Upload sample map
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Load individual audio files or a .zip of files named by note (e.g.
              C4.wav, F#3.mp3, 60.wav).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <SampleMapUploader
              onSaved={(kit) => {
                setCustomKit(kit);
                setPreset("custom");
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
