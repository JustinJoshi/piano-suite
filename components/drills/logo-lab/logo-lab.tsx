"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PianoSuiteMark } from "@/components/brand/piano-suite-mark";
import { useLogoMarkSettings } from "@/hooks/useLogoMarkSettings";
import { randomMode } from "@/lib/chladni";
import { settingsToSvgString } from "@/lib/logo-mark";
import {
  DEFAULT_LOGO_MARK_SETTINGS,
  LOGO_MARK_PRESETS,
  normalizeLogoMarkSettings,
  type LogoMarkSettings,
  type LogoModePair,
} from "@/lib/logo-mark-settings";
import { Check, Download, RotateCcw, Shuffle } from "lucide-react";

const PREVIEW_SIZES = [16, 32, 64, 128] as const;

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium text-muted-foreground">{children}</div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
  testId,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  display?: string;
  testId?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <span className="font-mono text-xs text-muted-foreground">
          {display ?? value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
        data-testid={testId}
        aria-label={label}
      />
    </div>
  );
}

export function LogoLab() {
  const { settings: applied, applySettings, resetSettings } =
    useLogoMarkSettings();

  const [draft, setDraft] = useState<LogoMarkSettings>(() =>
    normalizeLogoMarkSettings(applied)
  );
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  const patternColorValue = draft.patternColor ?? "#c9a227";
  const plateColorValue = draft.plateColor ?? "#0c0a08";

  const patch = (partial: Partial<LogoMarkSettings>) => {
    setDraft((prev) => normalizeLogoMarkSettings({ ...prev, ...partial }));
    setApplyMessage(null);
  };

  const setMode = (mode: LogoModePair) => patch({ mode });

  const handleApply = () => {
    applySettings(draft);
    setApplyMessage("Logo applied — navbar, sidebar, and favicon updated.");
  };

  const handleReset = () => {
    resetSettings();
    setDraft(normalizeLogoMarkSettings(DEFAULT_LOGO_MARK_SETTINGS));
    setApplyMessage("Logo reset to the shipping default.");
  };

  const handleRandomize = () => {
    const mode = randomMode(8);
    patch({ mode });
  };

  const handleDownload = () => {
    const svg = settingsToSvgString(draft, { baked: true, standalone: true });
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `piano-suite-logo-m${draft.mode[0]}-n${draft.mode[1]}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySvg = async () => {
    const svg = settingsToSvgString(draft, { baked: true, standalone: true });
    try {
      await navigator.clipboard.writeText(svg);
      setApplyMessage("SVG copied to clipboard.");
    } catch {
      setApplyMessage("Could not copy — use Download SVG instead.");
    }
  };

  const dirty = useMemo(() => {
    const keys: (keyof LogoMarkSettings)[] = [
      "mode",
      "threshold",
      "lineThickness",
      "zoom",
      "padding",
      "cornerRadius",
      "showPlate",
      "strokeOnly",
      "patternColor",
      "plateColor",
    ];
    return keys.some((k) => {
      if (k === "mode") {
        return (
          draft.mode[0] !== applied.mode[0] || draft.mode[1] !== applied.mode[1]
        );
      }
      return draft[k] !== applied[k];
    });
  }, [draft, applied]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      {/* Preview */}
      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base font-semibold text-foreground">
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className="flex min-h-[220px] items-center justify-center rounded-xl bg-muted/40 ring-1 ring-foreground/10"
            data-testid="logo-lab-hero-preview"
          >
            <PianoSuiteMark
              settings={draft}
              className="h-40 w-40 text-primary"
            />
          </div>

          <div className="space-y-2">
            <Label>Size check</Label>
            <div className="flex flex-wrap items-end gap-4">
              {PREVIEW_SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center gap-1.5">
                  <div style={{ width: size, height: size }}>
                    <PianoSuiteMark
                      settings={draft}
                      className="h-full w-full text-primary"
                    />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {size}px
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 ring-1 ring-foreground/5">
            <PianoSuiteMark
              settings={draft}
              className="h-8 w-8 text-primary"
            />
            <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
              Piano Suite
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading text-base font-semibold text-foreground">
            Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-3">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleApply}
                data-testid="apply-logo"
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                Apply logo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                data-testid="reset-logo"
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Reset logo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomize}
                data-testid="randomize-logo"
              >
                <Shuffle className="mr-1 h-3.5 w-3.5" />
                Randomize
              </Button>
            </div>
            {applyMessage ? (
              <p className="text-xs text-muted-foreground" role="status">
                {applyMessage}
              </p>
            ) : dirty ? (
              <p className="text-xs text-muted-foreground" role="status">
                Draft differs from the applied logo — click Apply to update the
                app mark.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground" role="status">
                Editing a draft. Apply stamps it onto navbar, sidebar, and
                favicon.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleDownload}
                data-testid="download-logo-svg"
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                Download SVG
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleCopySvg}
                data-testid="copy-logo-svg"
              >
                Copy SVG
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Presets</Label>
            <div className="flex flex-wrap gap-2">
              {LOGO_MARK_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() =>
                    patch({
                      ...preset.settings,
                      patternColor: draft.patternColor,
                      plateColor: draft.plateColor,
                    })
                  }
                  data-testid={`logo-preset-${preset.label.toLowerCase()}`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <SliderRow
            label="Mode m"
            value={draft.mode[0]}
            min={1}
            max={12}
            onChange={(m) => {
              let n = draft.mode[1];
              if (n === m) n = m >= 12 ? m - 1 : m + 1;
              setMode([m, n]);
            }}
            testId="logo-mode-m"
          />
          <SliderRow
            label="Mode n"
            value={draft.mode[1]}
            min={1}
            max={12}
            onChange={(n) => {
              let m = draft.mode[0];
              if (m === n) m = n >= 12 ? n - 1 : n + 1;
              setMode([m, n]);
            }}
            testId="logo-mode-n"
          />
          <SliderRow
            label="Threshold"
            value={draft.threshold}
            min={0.02}
            max={0.45}
            step={0.01}
            display={draft.threshold.toFixed(2)}
            onChange={(threshold) => patch({ threshold })}
            testId="logo-threshold"
          />
          <SliderRow
            label="Line weight"
            value={draft.lineThickness}
            min={1}
            max={8}
            onChange={(lineThickness) => patch({ lineThickness })}
            testId="logo-line-thickness"
          />
          <SliderRow
            label="Zoom"
            value={draft.zoom}
            min={0.6}
            max={2.5}
            step={0.05}
            display={draft.zoom.toFixed(2)}
            onChange={(zoom) => patch({ zoom })}
            testId="logo-zoom"
          />
          <SliderRow
            label="Padding"
            value={draft.padding}
            min={0}
            max={28}
            onChange={(padding) => patch({ padding })}
            testId="logo-padding"
          />
          <SliderRow
            label="Corner radius"
            value={draft.cornerRadius}
            min={0}
            max={40}
            onChange={(cornerRadius) => patch({ cornerRadius })}
            testId="logo-corner-radius"
          />

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={draft.showPlate}
                onChange={(e) => patch({ showPlate: e.target.checked })}
                className="accent-primary"
                data-testid="logo-show-plate"
              />
              Show plate
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={draft.strokeOnly}
                onChange={(e) => patch({ strokeOnly: e.target.checked })}
                className="accent-primary"
                data-testid="logo-stroke-only"
              />
              Outline only
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Pattern color</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => patch({ patternColor: null })}
                data-testid="logo-use-theme-pattern"
              >
                Use theme
              </Button>
            </div>
            <input
              type="color"
              aria-label="Pattern color"
              value={patternColorValue}
              onChange={(e) => patch({ patternColor: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded border border-border bg-background"
              data-testid="logo-pattern-color"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Plate color</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => patch({ plateColor: null })}
                data-testid="logo-use-theme-plate"
              >
                Use theme
              </Button>
            </div>
            <input
              type="color"
              aria-label="Plate color"
              value={plateColorValue}
              onChange={(e) => patch({ plateColor: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded border border-border bg-background"
              data-testid="logo-plate-color"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
