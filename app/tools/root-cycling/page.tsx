export default function RootCyclingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/95 px-6 backdrop-blur">
        <div>
          <h1 className="font-heading text-lg font-semibold text-foreground">Root Cycling</h1>
          <p className="text-xs text-muted-foreground">
            Drill one fixed chord or arpeggio idea across random roots in all 12 keys.
          </p>
        </div>
      </header>

      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-6xl rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Root Cycling drill is coming soon.
        </div>
      </div>
    </div>
  );
}
