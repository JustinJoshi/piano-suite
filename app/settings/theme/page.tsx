"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { themes, type ThemeId } from "@/lib/themes";
import { useThemePreference } from "@/hooks/useThemePreference";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ThemeCard({
  theme,
  isActive,
  onSelect,
}: {
  theme: (typeof themes)[number];
  isActive: boolean;
  onSelect: (id: ThemeId) => void;
}) {
  return (
    <button
      onClick={() => onSelect(theme.id)}
      // Apply this preset's CSS class locally so swatches/preview chrome
      // show that theme's tokens even when a different global theme is active.
      className={cn(
        theme.id,
        "group relative flex flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-all",
        "hover:border-primary/50 hover:bg-card/80",
        isActive && "ring-1 ring-primary border-primary/50"
      )}
      aria-pressed={isActive}
      data-testid={`theme-card-${theme.id}`}
    >
      {isActive && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </span>
      )}
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-lg font-bold uppercase">{theme.id[0]}</span>
        </div>
        <div>
          <div className="font-medium text-foreground">{theme.name}</div>
          <div className="text-xs text-muted-foreground">{theme.description}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-6 flex-1 rounded-md bg-background ring-1 ring-border" />
        <div className="h-6 flex-1 rounded-md bg-primary" />
        <div className="h-6 flex-1 rounded-md bg-accent" />
        <div className="h-6 flex-1 rounded-md bg-card ring-1 ring-border" />
      </div>
    </button>
  );
}

function OnboardingResetCard() {
  const { reset } = useOnboarding();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Onboarding</CardTitle>
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

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Theme
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose a color scheme for Piano Suite. Your choice is saved to this
            browser, and synced to your account when signed in.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Preset themes</CardTitle>
            <CardDescription>
              Click a card to preview and apply it instantly.
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
