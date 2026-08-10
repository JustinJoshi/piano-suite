"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";
import { cn } from "@/lib/utils";
import { Play, Pause, Square, Upload, Volume2, Music2 } from "lucide-react";

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

export function MusicPlayer({ className }: { className?: string }) {
  const {
    file,
    state,
    isPlaying,
    progress,
    duration,
    volume,
    error,
    loadFile,
    play,
    pause,
    stop,
    setVolume,
  } = useMusicPlayer();

  const inputRef = useRef<HTMLInputElement>(null);

  const readyOrPlaying = state === "ready" || state === "playing" || state === "paused";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    await loadFile(uploaded);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <Card className={cn("ring-1 ring-foreground/10", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base">Music Ripple</CardTitle>
        <CardDescription>
          Upload a MIDI or audio file to drive the ripple and piano sound.
          MIDI is exact; audio uses best-effort pitch detection.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept=".mid,.midi,.mp3,.wav,.ogg,.flac,.m4a,audio/*"
          onChange={handleFileChange}
          className="hidden"
          data-testid="music-file-input"
        />

        {!file ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            data-testid="music-upload-btn"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Upload MIDI / audio
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Music2 className="h-4 w-4 text-primary" />
              <span className="truncate font-medium" data-testid="music-file-name">
                {file.name}
              </span>
              <span className="ml-auto text-xs text-muted-foreground uppercase">
                {file.kind}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(1, duration)}
                step={0.1}
                value={Math.min(progress, duration)}
                readOnly
                className="w-full accent-primary"
                aria-label="Playback progress"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={isPlaying ? pause : play}
                disabled={state === "loading" || state === "error"}
                data-testid="music-play-pause-btn"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={stop}
                disabled={!readyOrPlaying}
                data-testid="music-stop-btn"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Replace
              </Button>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-24 accent-primary"
                aria-label="Music volume"
              />
            </label>
          </div>
        )}

        {error ? (
          <p className="text-xs text-destructive" role="alert" data-testid="music-error">
            {error}
          </p>
        ) : null}

        {state === "loading" ? (
          <p className="text-xs text-muted-foreground" data-testid="music-loading">
            Loading…
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
