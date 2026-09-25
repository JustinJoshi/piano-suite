import { ROLL_LANES, ROLL_LOW } from "@/lib/roll-music";

/**
 * A strip of roll paper with one chord punched across it: the holes sit in
 * the same lanes as the tracker bar (C3 to C6). Replaces the lit keybed on
 * cards. Decorative.
 */
export function RollChordStrip({ notes, className }: { notes: number[]; className?: string }) {
  const lane = 100 / ROLL_LANES;
  const inRange = notes
    .map((n) => (n < ROLL_LOW ? n + 24 : n))
    .filter((n) => n >= ROLL_LOW && n < ROLL_LOW + ROLL_LANES);
  return (
    <svg
      className={["roll-chord-strip", className].filter(Boolean).join(" ")}
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="100" height="10" className="roll-chord-strip-paper" />
      {inRange.map((n, i) => (
        <rect key={`${n}-${i}`} x={(n - ROLL_LOW + 0.5) * lane - lane * 0.23} y={2.2} width={lane * 0.46} height={5.6} rx={0.6} className="roll-chord-strip-hole" />
      ))}
    </svg>
  );
}
