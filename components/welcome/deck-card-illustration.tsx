import { Keybed } from "@/components/brand/keybed";
import { cn } from "@/lib/utils";

/** Anki's four answer buttons with a plausible next-review interval each. */
const GRADES = [
  { label: "Again", interval: "<1m", tone: "bg-grade-again/14 text-grade-again ring-grade-again/30" },
  { label: "Hard", interval: "6m", tone: "bg-grade-hard/14 text-grade-hard ring-grade-hard/30" },
  { label: "Good", interval: "1d", tone: "bg-grade-good/16 text-grade-good ring-grade-good/35" },
  { label: "Easy", interval: "4d", tone: "bg-grade-easy/14 text-grade-easy ring-grade-easy/30" },
] as const;

/**
 * What the companion deck actually looks like in Anki: a chord-symbol card
 * turned over to its answer — the symbol, its notes, the chord lit on a
 * keybed — with the four grade buttons underneath. Two more cards peek out
 * behind it, fanned like a deck on a music stand.
 *
 * Decorative (`aria-hidden`); the section copy describes the decks.
 */
export function DeckCardIllustration({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative mx-auto w-full max-w-[19rem]", className)}>
      <div className="absolute inset-x-8 top-3 bottom-6 rotate-[7deg] rounded-2xl border border-border bg-elevated/80 shadow-surface" />
      <div className="absolute inset-x-4 top-1 bottom-3 -rotate-[4deg] rounded-2xl border border-border bg-elevated shadow-surface" />

      <div className="relative rounded-2xl border border-border bg-card p-5 shadow-raised">
        <div className="flex items-center justify-between text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span>Chord Symbols</span>
          <span className="font-mono normal-case tracking-normal">7ths · C</span>
        </div>

        <p className="mt-4 text-center font-heading text-5xl font-semibold tracking-tight text-foreground">
          Cmaj7
        </p>
        <div className="mx-auto mt-3 h-px w-16 bg-border" />
        <p className="mt-3 text-center font-mono text-xs tracking-[0.2em] text-muted-foreground">
          C&nbsp;·&nbsp;E&nbsp;·&nbsp;G&nbsp;·&nbsp;B
        </p>

        <div className="mt-4 overflow-hidden rounded-lg border border-ebony/40">
          <Keybed octaves={1} closingC lit={[0, 4, 7, 11]} className="h-10 w-full" />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-1.5">
          {GRADES.map((grade) => (
            <span
              key={grade.label}
              className={cn(
                "flex flex-col items-center rounded-md py-1.5 ring-1 ring-inset",
                grade.tone
              )}
            >
              <span className="font-mono text-[0.58rem] opacity-80">{grade.interval}</span>
              <span className="text-[0.68rem] font-semibold">{grade.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
