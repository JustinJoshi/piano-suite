"use client";

import { Check, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { themes, type ThemeId } from "@/lib/themes";
import { useThemePreference } from "@/hooks/useThemePreference";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useExperimentalFeatures } from "@/hooks/useExperimentalFeatures";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Keybed } from "@/components/brand/keybed";
import { SettingsPageHeader } from "@/components/tools/settings-page-header";

function ThemeCard({
  theme,
  isActive,
  onSelect,
}: {
  theme: (typeof themes)[number];
  isActive: boolean;
  onSelect: (id: ThemeId) => void;
}) {
  const AppearanceIcon = theme.appearance === "light" ? Sun : Moon;

  return (
    <button
      onClick={() => onSelect(theme.id)}
      // Apply this preset's CSS class locally so the miniature stage below
      // shows that theme's tokens even when a different global theme is active.
      className={cn(
        theme.id,
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left text-card-foreground shadow-surface transition-all",
        "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-raised",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        isActive && "border-primary/60 ring-2 ring-primary/50"
      )}
      aria-pressed={isActive}
      data-testid={`theme-card-${theme.id}`}
    >
      {/* Miniature stage */}
      <div className="relative h-24 w-full overflow-hidden bg-background">
        <div className="hero-glow absolute inset-0 opacity-70" aria-hidden />
        <div className="staff-lines absolute inset-0" aria-hidden />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="h-1.5 w-12 rounded-full bg-foreground/70" />
        </div>
        <div className="absolute left-4 top-9 flex gap-1.5">
          <span className="h-5 w-12 rounded-md bg-action" />
          <span className="h-5 w-10 rounded-md border border-border bg-card" />
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <Keybed octaves={3} className="h-6 w-full opacity-90" />
        </div>
      </div>

      <div className="flex items-center gap-3 p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <AppearanceIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-heading text-base font-semibold text-foreground">
            {theme.name}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {theme.description}
          </div>
        </div>
        {isActive ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
    </button>
  );
}

function OnboardingResetCard() {
  const { reset } = useOnboarding();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding</CardTitle>
        <CardDescription>
          Replay the first-time introduction shown on the Tools dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={reset}>
          Replay onboarding
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ThemeSettingsPage() {
  const { theme, setTheme, mounted } = useThemePreference();
  const { enabled: experimentalEnabled, setEnabled: setExperimentalEnabled } =
    useExperimentalFeatures();

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <SettingsPageHeader
          title="Theme"
          description="Choose a stage for Piano Suite. Your choice is saved to this browser, and synced to your account when signed in."
        />

        <Card>
          <CardHeader>
            <CardTitle>Preset themes</CardTitle>
            <CardDescription>
              Click a card to preview and apply it instantly. Ivory is the
              light stage; everything else is a dark stage with a different
              brand hue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {themes.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  isActive={mounted && theme === t.id}
                  onSelect={setTheme}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <OnboardingResetCard />

        <Card>
          <CardHeader>
            <CardTitle>Experimental features</CardTitle>
            <CardDescription>
              Early labs and unfinished surfaces. Off by default.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex items-start gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={experimentalEnabled}
                onChange={(e) => setExperimentalEnabled(e.target.checked)}
                className="mt-0.5 accent-primary"
                data-testid="enable-experimental-features"
              />
              <span>
                <span className="font-medium">Enable experimental features</span>
                <span className="mt-1 block text-muted-foreground">
                  Shows Multigrid Lab in Tools and Atmosphere. Preferences save
                  in this browser and sync when signed in.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          Customize the home Chladni pattern in{" "}
          <Link
            href="/tools/chladni"
            className="text-primary underline-offset-2 hover:underline"
          >
            Pattern Lab
          </Link>
          . Assign backgrounds per route in{" "}
          <Link
            href="/settings/atmosphere"
            className="text-primary underline-offset-2 hover:underline"
          >
            Atmosphere
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
