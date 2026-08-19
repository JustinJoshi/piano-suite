"use client";

import { useState } from "react";
import Link from "next/link";
import { Music, Zap, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardMenuButton } from "@/components/tools/dashboard-nav";
import { ChordDrillPanel } from "@/components/tracking/chord-drill-panel";
import { ArpeggioPanel } from "@/components/tracking/arpeggio-panel";
import { RootCyclingPanel } from "@/components/tracking/root-cycling-panel";
import { ImportLocalStorage } from "@/components/tracking/import-local-storage";
import { useToolUserReady } from "@/hooks/useToolUserReady";
import { localPracticeBanner } from "@/lib/billing";

const tabs = [
  { id: "chords", label: "Chord Drill", icon: Music },
  { id: "arpeggios", label: "Arpeggios", icon: Zap },
  { id: "rootcycle", label: "Root Cycling", icon: RefreshCw },
];

export default function TrackingPage() {
  const [activeTab, setActiveTab] = useState("chords");
  const { canAccess, canPersist, userReady } = useToolUserReady();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/50 bg-background/95 px-4 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <DashboardMenuButton />
          <div className="min-w-0">
            <h1 className="font-heading text-lg font-semibold text-foreground">
              Tracking
            </h1>
            <p className="text-xs text-muted-foreground">
              Review first-chord times, transitions, misses, and random-root
              recall.
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8">
        {!canAccess ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Sign in to view your practice history.
          </div>
        ) : !userReady ? (
          <div className="mx-auto max-w-6xl rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Loading your practice history…
          </div>
        ) : (
          <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col">
            {!canPersist ? (
              <p className="mb-4 text-center text-sm text-muted-foreground">
                {localPracticeBanner("tracking")}{" "}
                <Link
                  href="/pricing"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  See plans
                </Link>
              </p>
            ) : null}
            <div className="flex-1">
              <div className="mb-6 flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      data-testid={`tracking-tab-${tab.id}`}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                        activeTab === tab.id
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {activeTab === "chords" && <ChordDrillPanel />}
              {activeTab === "arpeggios" && <ArpeggioPanel />}
              {activeTab === "rootcycle" && <RootCyclingPanel />}
            </div>

            {canPersist ? <ImportLocalStorage /> : null}
          </div>
        )}
      </div>
    </div>
  );
}
