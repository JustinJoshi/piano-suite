"use client";

import Link from "next/link";
import {
  AMBIENT_EFFECT_KINDS,
  AMBIENT_EFFECT_LABELS,
  AMBIENT_ROUTE_CATALOG,
  type AmbientEffectKind,
  type AmbientFloatKind,
} from "@/lib/ambient-effects";
import { floatPanelUpgradeCopy } from "@/lib/billing";
import { useAmbientEffects } from "@/hooks/useAmbientEffects";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SELECTABLE_KINDS = AMBIENT_EFFECT_KINDS;
const FLOAT_KINDS = AMBIENT_EFFECT_KINDS.filter(
  (k): k is AmbientFloatKind => k !== "none"
);

function KindSelect({
  id,
  value,
  onChange,
  includeInherit,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  includeInherit?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
      data-testid={id}
    >
      {includeInherit ? <option value="inherit">Inherit</option> : null}
      {SELECTABLE_KINDS.map((kind) => (
        <option key={kind} value={kind}>
          {AMBIENT_EFFECT_LABELS[kind]}
        </option>
      ))}
    </select>
  );
}

export default function AtmosphereSettingsPage() {
  const { canUseFloatPanel } = useAuthAccess();
  const {
    settings,
    setDefaultBackground,
    setApplyEverywhere,
    setRouteBackground,
    setScrimDarkness,
    setFloatEnabled,
    setFloatKind,
    updateFloat,
  } = useAmbientEffects();

  const floatRouteSet = new Set(settings.float.routes);

  function toggleFloatRoute(href: string) {
    if (!canUseFloatPanel) return;
    const next = new Set(floatRouteSet);
    if (next.has(href)) next.delete(href);
    else next.add(href);
    updateFloat({ routes: [...next] });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Atmosphere
          </h1>
          <p className="text-sm text-muted-foreground">
            Assign math visualizations as page backgrounds per route. Pro can
            open a movable float panel for live resonance beside drills.
            MIDI-reactive patterns use the Chladni Ripple engine. Preferences
            save in this browser and sync with Pro.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Related:{" "}
            <Link
              href="/settings/theme"
              className="text-primary underline-offset-2 hover:underline"
            >
              Theme
            </Link>
            . Fine-tune Chladni / Quasiperiodic home params from their labs via
            Apply to home.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Default background</CardTitle>
            <CardDescription>
              Used when Apply everywhere is on, and as the Welcome fallback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <KindSelect
              id="ambient-default-kind"
              value={settings.defaultBackground}
              onChange={(v) =>
                setDefaultBackground(v as AmbientEffectKind)
              }
            />
            <label className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={settings.applyEverywhere}
                onChange={(e) => setApplyEverywhere(e.target.checked)}
                className="accent-primary"
                data-testid="ambient-apply-everywhere"
              />
              Apply default to every route (unless a route is set to None or a
              specific override)
            </label>
            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Scrim darkness</span>
                <span className="font-mono text-foreground">
                  {settings.scrimDarkness.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.scrimDarkness}
                onChange={(e) => setScrimDarkness(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="Scrim darkness"
                data-testid="ambient-scrim"
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Per-route backgrounds</CardTitle>
            <CardDescription>
              Inherit uses the default when Apply everywhere is on; otherwise
              Inherit means no background (except Welcome, which still falls
              back to the default).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/60">
              {AMBIENT_ROUTE_CATALOG.map((route) => {
                const current = settings.routeBackgrounds[route.href];
                const selectValue = current ?? "inherit";
                return (
                  <li
                    key={route.href}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {route.label}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {route.href}
                      </div>
                    </div>
                    <div className="sm:w-56">
                      <KindSelect
                        id={`ambient-route-${route.href}`}
                        value={selectValue}
                        includeInherit
                        onChange={(v) =>
                          setRouteBackground(
                            route.href,
                            v === "inherit"
                              ? "inherit"
                              : (v as AmbientEffectKind)
                          )
                        }
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Float panel</CardTitle>
            <CardDescription>
              Pro-only draggable card over drills (for example Chord Drill with
              Chladni Ripple). Running float + full-page MIDI ripple may cost
              FPS on slower devices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canUseFloatPanel ? (
              <p
                className="text-sm text-muted-foreground"
                data-testid="ambient-float-upgrade"
              >
                {floatPanelUpgradeCopy("atmosphere")}{" "}
                <Link
                  href="/pricing"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  See plans
                </Link>
              </p>
            ) : null}
            <label className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={canUseFloatPanel && settings.float.enabled}
                onChange={(e) => {
                  if (!canUseFloatPanel) return;
                  setFloatEnabled(e.target.checked);
                }}
                disabled={!canUseFloatPanel}
                className="accent-primary disabled:opacity-50"
                data-testid="ambient-float-enabled"
              />
              Show float panel
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Float effect</span>
              <select
                value={settings.float.kind}
                onChange={(e) => {
                  if (!canUseFloatPanel) return;
                  setFloatKind(e.target.value as AmbientFloatKind);
                }}
                disabled={!canUseFloatPanel}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground disabled:opacity-50"
                data-testid="ambient-float-kind"
              >
                {FLOAT_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {AMBIENT_EFFECT_LABELS[kind]}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <div className="mb-2 text-xs text-muted-foreground">
                Show on routes (none selected = all routes)
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {AMBIENT_ROUTE_CATALOG.map((route) => (
                  <li key={route.href}>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={floatRouteSet.has(route.href)}
                        onChange={() => toggleFloatRoute(route.href)}
                        disabled={!canUseFloatPanel}
                        className="accent-primary disabled:opacity-50"
                      />
                      {route.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
